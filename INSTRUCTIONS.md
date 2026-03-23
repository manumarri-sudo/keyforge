# KeyForge: Build Instructions

## What You Are Building

KeyForge is a local-first developer tool. It has a web UI and a CLI. The user connects their service accounts once (Stripe, OpenAI, Supabase, Anthropic, Resend, Clerk) by pasting API credentials. The credentials are encrypted and stored locally via the system keychain. Then, whenever the user starts a new project, they open KeyForge, check the services they need, type a project name, and hit go. KeyForge creates fresh API keys (via official service APIs where supported) or copies stored credentials, and writes a complete .env file.

No Playwright. No browser automation. No cloud. No server. No telemetry. Everything runs locally.

## Tech Stack

- Runtime: Node.js with TypeScript (strict mode)
- Server: Hono + @hono/node-server (port 4000)
- Frontend: React 18 + Tailwind CSS + shadcn/ui components
- CLI: commander + @clack/prompts
- Credential storage: keytar (system keychain). Graceful fallback to AES-256-encrypted JSON file for systems without native keychain.
- Dev tooling: Vite (frontend), tsx (server), concurrently (run both)
- No Playwright dependency anywhere

## Design Direction

Dark theme. Clean grid layout. Developer tool aesthetic. Think Vercel dashboard meets 1Password.

- Background: zinc-950
- Cards: zinc-900 with zinc-800 border
- Connected state: emerald-500 accent
- Warning state: yellow-500
- Text: zinc-100 primary, zinc-400 secondary
- Use each provider's brand color as a subtle accent on their tile

## Project Structure

```
keyforge/
  package.json
  tsconfig.json
  vite.config.ts
  src/
    server/
      index.ts              # Hono app, serves API + static frontend
      routes/
        auth.ts             # Connect/disconnect endpoints
        provision.ts        # Key creation endpoints
        projects.ts         # Project management endpoints
    providers/
      types.ts              # ProviderDefinition interface
      registry.ts           # Exports array of all providers
      openai.ts
      supabase.ts
      resend.ts
      anthropic.ts
      stripe.ts
      clerk.ts
    store/
      keychain.ts           # Keytar wrapper for encrypted credential storage
      projects.ts           # Project manifest + .env management
      audit.ts              # Append-only audit log
    cli/
      index.ts              # CLI entry point
      commands/
        new.ts
        status.ts
        export.ts
        connect.ts
        projects.ts
        revoke.ts
    web/
      index.html
      main.tsx
      App.tsx
      components/
        ServiceGrid.tsx
        ConnectDialog.tsx
        ProvisionFlow.tsx
        ProjectList.tsx
        Layout.tsx
      lib/
        api.ts              # Fetch wrapper for Hono API
  data/                     # Gitignored. Runtime data lives here.
    projects/               # Per-project .env files and manifests
    audit.log
```

---

## PHASE 1: Project Scaffold + Dependencies

Initialize the project with all dependencies installed and the folder structure created. Every directory listed above should exist. Create a working package.json with these scripts:

- `dev`: runs server (tsx) and frontend (vite) concurrently
- `build`: builds frontend with vite, compiles server with tsc
- `start`: runs production build

Install these packages:
- hono, @hono/node-server
- react, react-dom, @types/react, @types/react-dom
- tailwindcss, postcss, autoprefixer
- commander, @clack/prompts
- keytar
- vite, @vitejs/plugin-react, tsx, concurrently, typescript

Set up Tailwind config with the dark theme colors from the design direction. Set up Vite to build the React app. Set up the Hono server to serve the built frontend files in production and proxy in dev.

Do not move to Phase 2 until `npm run dev` starts without errors.

---

## PHASE 2: Provider Adapter System

### Provider Interface

Create `src/providers/types.ts`:

```typescript
export interface ProviderDefinition {
  id: string;
  name: string;
  color: string;
  icon: string;                    // Emoji or short text fallback

  // Connection config
  credentialFields: {
    key: string;                   // e.g. 'secretKey', 'publishableKey'
    label: string;                 // e.g. 'Secret Key'
    placeholder: string;           // e.g. 'sk_live_...'
  }[];
  credentialHelpUrl: string;

  // Capabilities
  canCreateKeys: boolean;

  // Validation
  validateCredential: (creds: Record<string, string>) => Promise<{
    valid: boolean;
    account?: string;
    error?: string;
  }>;

  // Key creation (only called if canCreateKeys is true)
  createKey?: (projectName: string, creds: Record<string, string>) => Promise<{
    keys: Record<string, string>;
    keyId?: string;
  }>;

  // What goes in .env
  envVars: string[];

  // Cleanup
  revokeKey?: (keyId: string, creds: Record<string, string>) => Promise<void>;
}
```

### Provider Implementations

**OpenAI** (canCreateKeys: true)
- credentialFields: [{ key: 'adminKey', label: 'Admin API Key', placeholder: 'sk-admin-...' }]
- credentialHelpUrl: "https://platform.openai.com/settings/organization/admin-keys"
- validateCredential: `GET https://api.openai.com/v1/organization/me` with header `Authorization: Bearer {adminKey}`. If 200, valid. Extract org name from response for account display.
- createKey: `POST https://api.openai.com/v1/organization/admin_api_keys` with body `{ "name": "{projectName}" }` and header `Authorization: Bearer {adminKey}`. Response contains `value` (the new key) and `id` (for revocation).
- envVars: ['OPENAI_API_KEY']
- color: '#10A37F'

**Supabase** (canCreateKeys: true)
- credentialFields: [{ key: 'accessToken', label: 'Personal Access Token', placeholder: 'sbp_...' }]
- credentialHelpUrl: "https://supabase.com/dashboard/account/tokens"
- validateCredential: `GET https://api.supabase.com/v1/projects` with header `Authorization: Bearer {accessToken}`. If 200, valid. Also call `GET https://api.supabase.com/v1/organizations` and store the first org ID in the credential metadata for later use.
- createKey: First `POST https://api.supabase.com/v1/projects` with body `{ "name": "{projectName}", "organization_id": "{stored_org_id}", "plan": "free", "region": "us-east-1", "db_pass": "{generate a random 24-char password}" }`. Wait for project to be ready (poll status). Then `GET https://api.supabase.com/v1/projects/{ref}/api-keys` to get anon and service_role keys. Also construct the URL as `https://{ref}.supabase.co`.
- envVars: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
- color: '#3FCF8E'

**Resend** (canCreateKeys: true)
- credentialFields: [{ key: 'apiKey', label: 'API Key', placeholder: 're_...' }]
- credentialHelpUrl: "https://resend.com/api-keys"
- validateCredential: `GET https://api.resend.com/domains` with header `Authorization: Bearer {apiKey}`. If 200, valid.
- createKey: `POST https://api.resend.com/api-keys` with body `{ "name": "{projectName}" }` and header `Authorization: Bearer {apiKey}`. Response contains `id` and `token` (the new key).
- envVars: ['RESEND_API_KEY']
- color: '#000000'

**Anthropic** (canCreateKeys: false)
- credentialFields: [{ key: 'apiKey', label: 'API Key', placeholder: 'sk-ant-...' }]
- credentialHelpUrl: "https://console.anthropic.com/settings/keys"
- validateCredential: Format check (starts with 'sk-ant-'). Optionally make a lightweight API call to verify.
- canCreateKeys: false. During provisioning, the stored apiKey is copied directly to the .env.
- envVars: ['ANTHROPIC_API_KEY']
- color: '#D4A574'
- Note for UI: "Anthropic doesn't support per-project key creation. Your stored key will be shared across projects."

**Stripe** (canCreateKeys: false)
- credentialFields: [{ key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_...' }, { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_...' }]
- credentialHelpUrl: "https://dashboard.stripe.com/apikeys"
- validateCredential: `GET https://api.stripe.com/v1/balance` with header `Authorization: Bearer {secretKey}`. If 200, valid.
- canCreateKeys: false. During provisioning, both keys are copied to .env.
- envVars: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY']
- color: '#635BFF'
- Note for UI: "Stripe OAuth integration coming soon. For now, your keys are shared across projects."

**Clerk** (canCreateKeys: false)
- credentialFields: [{ key: 'secretKey', label: 'Secret Key', placeholder: 'sk_live_...' }, { key: 'publishableKey', label: 'Publishable Key', placeholder: 'pk_live_...' }]
- credentialHelpUrl: "https://dashboard.clerk.com"
- validateCredential: Format check (secretKey starts with 'sk_live_' or 'sk_test_', publishableKey starts with 'pk_live_' or 'pk_test_').
- canCreateKeys: false.
- envVars: ['NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY']
- color: '#6C47FF'

Create `src/providers/registry.ts` that imports all six providers and exports them as an array.

---

## PHASE 3: Credential Store

### Keychain wrapper (src/store/keychain.ts)

Use keytar with service name "keyforge" and account pattern "provider:{id}".

Store credentials as JSON strings containing: the credential fields, the account display name, connectedAt timestamp, and any metadata (like Supabase org_id).

Functions:
- `saveCredential(providerId, data)` - saves to keychain
- `getCredential(providerId)` - retrieves and parses, returns null if not found
- `deleteCredential(providerId)` - removes from keychain
- `listConnected()` - returns array of provider IDs that have stored credentials

If keytar fails (no native keychain available), fall back to writing an AES-256-GCM encrypted JSON file at `data/auth.enc`. Use a machine-specific key derived from os.hostname() + os.userInfo().username. Log a warning that system keychain is unavailable.

### Project store (src/store/projects.ts)

Functions:
- `createProject(name, services)` - creates `data/projects/{name}/` directory with manifest.json
- `writeEnv(name, keys)` - writes `data/projects/{name}/.env` with all key-value pairs, and `.env.example` with keys only (values replaced with placeholder text)
- `getProject(name)` - reads and returns manifest
- `listProjects()` - returns array of all projects with metadata
- `deleteProject(name)` - removes project directory
- `exportProject(name, targetPath)` - copies .env and .env.example to targetPath, creates/updates .gitignore at targetPath to include .env

Manifest format:
```json
{
  "name": "lattice",
  "createdAt": "2026-03-23T01:00:00Z",
  "services": {
    "openai": { "method": "api", "keyId": "key_abc", "envVars": ["OPENAI_API_KEY"] },
    "stripe": { "method": "copy", "envVars": ["STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY"] }
  }
}
```

### Audit log (src/store/audit.ts)

Append-only JSONL file at `data/audit.log`. Each line is a JSON object with: timestamp, event type (provider_connected, provider_disconnected, key_created, key_copied, project_created, project_exported, key_revoked), provider ID, project name (if applicable).

---

## PHASE 4: API Server

Build the Hono server at `src/server/index.ts` on port 4000.

### Routes

**GET /api/providers**
Returns all providers from the registry with their connection status. For each provider, check if a credential exists in the keychain. Response shape:
```json
[{
  "id": "openai",
  "name": "OpenAI",
  "color": "#10A37F",
  "icon": "🤖",
  "connected": true,
  "account": "Loomiq Org",
  "canCreateKeys": true,
  "credentialFields": [...],
  "credentialHelpUrl": "...",
  "envVars": ["OPENAI_API_KEY"]
}]
```

**POST /api/connect/:providerId**
Body: `{ credentials: { secretKey: "sk_...", publishableKey: "pk_..." } }`
Calls the provider's validateCredential. If valid, saves to keychain. Returns `{ success: true, account: "manu@..." }`. If invalid, returns 400 with error message.

**DELETE /api/connect/:providerId**
Deletes credential from keychain. Returns `{ success: true }`.

**POST /api/provision**
Body: `{ projectName: "lattice", providerIds: ["openai", "supabase", "resend", "stripe"] }`
Validates project name (lowercase, alphanumeric + hyphens, no spaces, 1-50 chars).
For each provider:
- If canCreateKeys: call createKey(projectName, storedCredential). Log "key_created" audit event.
- If not canCreateKeys: copy stored credential values to output. Log "key_copied" audit event.
Assemble all keys into a flat object. Call createProject + writeEnv. Log "project_created" audit event.
Returns:
```json
{
  "success": true,
  "project": {
    "name": "lattice",
    "services": { "openai": { "method": "api" }, "stripe": { "method": "copy" } },
    "envVars": { "OPENAI_API_KEY": "sk-proj...****", "STRIPE_SECRET_KEY": "sk_live...****" }
  }
}
```
Mask all key values in the response (show first 8 chars + "****").

**GET /api/projects**
Returns list of all projects from the project store.

**GET /api/projects/:name/env**
Returns raw .env file content as text/plain for download.

**POST /api/projects/:name/export**
Body: `{ targetPath: "/Users/manu/projects/lattice" }`
Calls exportProject. Returns `{ success: true, path: "..." }`.

**DELETE /api/projects/:name**
Deletes the project directory and files. Returns `{ success: true }`.

In production mode, serve the built React frontend from `dist/` as static files on the root path. In dev mode, the Vite dev server handles the frontend.

---

## PHASE 5: React Frontend

### Layout (src/web/components/Layout.tsx)
- Full-height dark background (zinc-950)
- Header bar: "KeyForge" wordmark on the left (use a bold monospace or geometric sans font, something distinctive). Minimal, no nav clutter.
- Tab bar below header: "Services" | "New Project" | "Projects"
- Content area below tabs

### ServiceGrid (src/web/components/ServiceGrid.tsx)
- Fetches GET /api/providers on mount
- Renders a responsive grid of cards (3 cols desktop, 2 tablet, 1 mobile)
- Each card:
  - Provider icon (emoji) and name
  - Left border or top accent in the provider's brand color
  - If connected: emerald badge showing account name, "Disconnect" button (subtle)
  - If not connected: gray "Connect" button
  - Small text showing envVars this provider contributes
- Clicking "Connect" opens ConnectDialog for that provider
- Clicking "Disconnect" calls DELETE /api/connect/:id after confirmation

### ConnectDialog (src/web/components/ConnectDialog.tsx)
- Modal/dialog overlay
- Shows provider name, icon, and brand color accent
- Renders input fields based on provider.credentialFields (1 field for most, 2 for Stripe/Clerk)
- Each input: label, placeholder, password-type with show/hide toggle
- Link: "Where do I find this?" opens credentialHelpUrl in new tab
- If provider.canCreateKeys is false, show info text: "This provider doesn't support per-project key creation. Your stored credential will be shared across all projects."
- "Connect" button: calls POST /api/connect/:id, shows loading spinner, then success toast or error message
- On success: closes dialog, refreshes ServiceGrid

### ProvisionFlow (src/web/components/ProvisionFlow.tsx)
- "New Project" tab content
- Text input for project name with validation (lowercase, alphanumeric + hyphens)
- Below that: list of connected providers as checkboxes
  - Each row: checkbox, provider icon, provider name, badge showing "Creates new key" (emerald) or "Uses stored key" (zinc)
  - Only connected providers shown. If none connected, show message: "Connect services in the Services tab first."
  - Disconnected providers not shown at all (no grayed-out rows, keeps it clean)
- "Create Keys for {projectName}" button (disabled until valid name + at least 1 checked)
- On submit: calls POST /api/provision
  - Show progress: each provider shows a spinner then checkmark as it completes
  - On complete: show results card with:
    - List of env vars (values masked)
    - "Download .env" button (fetches GET /api/projects/:name/env, triggers download)
    - "Copy .env to clipboard" button
    - Text input + button for "Export to path"
    - Code block showing: `keyforge export {name} --to ./`

### ProjectList (src/web/components/ProjectList.tsx)
- "Projects" tab content
- Lists all projects from GET /api/projects
- Each row: project name, creation date, number of services, service icons
- "Export" button per project
- "Delete" button per project (with confirmation)
- Click to expand: shows full manifest details (which services, methods, env vars)

### API helper (src/web/lib/api.ts)
- Simple fetch wrapper that prepends /api/ to paths
- Handles JSON parsing and error extraction
- Returns typed responses

Use useState and useEffect for data fetching. No need for React Query for this scope. Use toast notifications (build a simple one or use sonner) for success/error feedback.

---

## PHASE 6: CLI Companion

Build `src/cli/index.ts` as a separate entry point. Add `"bin": { "keyforge": "./dist/cli/index.js" }` to package.json.

### Commands

**keyforge** (no args)
Starts the Hono server and opens localhost:4000 in the default browser using `open` (macOS) or `xdg-open` (Linux).

**keyforge new \<projectName\> [--services openai,supabase,resend]**
If --services flag provided: provision those services directly (no prompts).
If not: use @clack/prompts to show multi-select of connected services.
Calls the same provisioning logic as the API.
Prints results to terminal with masked keys.

**keyforge status**
Lists all providers with connection status in a clean table:
```
  OpenAI       ● connected    admin key
  Supabase     ● connected    PAT
  Resend       ● connected    API key
  Stripe       ● connected    credential paste
  Anthropic    ○ not connected
  Clerk        ○ not connected
```

**keyforge export \<projectName\> [--to \<path\>]**
If --to provided: copies .env + .env.example there, updates .gitignore.
If not: copies to current working directory.
Prints confirmation with file paths.

**keyforge connect \<providerId\>**
Interactive: uses @clack/prompts to ask for credential fields, validates, saves.

**keyforge projects**
Lists all projects in a table: name, date, service count.

**keyforge revoke \<projectName\>**
For services that support it: calls revokeKey.
For others: prints "Manually revoke your {provider} key in their dashboard."
Deletes local project files after confirmation.

---

## PHASE 7: Testing + Polish + README

1. Run `npm run dev` and verify the app starts
2. Open localhost:4000 and verify the UI renders with all 6 service tiles
3. Test a connect flow (use Resend or Anthropic with a test key if available)
4. Test the provision flow end to end
5. Test the CLI: `npx tsx src/cli/index.ts status`
6. Verify .env and .env.example are written correctly
7. Verify audit.log has entries
8. Verify .gitignore is created when exporting

Polish:
- Loading spinners on all async operations
- Toast notifications for success and errors
- Enter key submits forms
- Auto-focus project name input on New Project tab
- Credential inputs are password fields with show/hide toggle
- All API keys masked in logs and responses (show first 8 chars only)
- data/ directory is in .gitignore
- Smooth tab transitions

Create README.md at project root:
- One paragraph: what KeyForge is
- Quick start: `npm install && npm run dev`
- Table of supported services with which ones create keys vs copy
- CLI commands reference
- Security: one paragraph on keychain encryption, local-only, no network except service APIs
- License: MIT

---

## IMPORTANT CONSTRAINTS

- TypeScript strict mode. No `any` types except where interfacing with external APIs.
- All API calls wrapped in try/catch with user-friendly error messages.
- Never log or display full API keys. Mask everything beyond the first 8 characters.
- The `data/` directory must be in .gitignore.
- Make keytar import optional with try/catch. If it fails, use the encrypted JSON fallback and log a warning.
- All provider API calls should have reasonable timeouts (15 seconds).
- Supabase project creation can take 30-60 seconds. Show appropriate loading state and poll for readiness.
- If any single provider fails during provisioning, continue with the others and report the failure. The .env should still be written with whatever keys succeeded.
