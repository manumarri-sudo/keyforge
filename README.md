# KeyForge

A local-first developer tool for managing API keys across services. Connect your accounts once, then create fresh, named API keys for any new project in seconds. No cloud, no telemetry — everything runs locally.

## Quick Start

```bash
git clone https://github.com/manumarri-sudo/keyforge.git
cd keyforge
npm install
npm run dev
```

Open **http://localhost:5173** — the web UI connects to the local server on port 4000 automatically.

## How It Works

1. **Connect** — Enter your admin/master API keys. Stored in your OS keychain (or AES-256 encrypted file).
2. **Provision** — Create a project. KeyForge calls official APIs to generate scoped, named keys.
3. **Export** — Download `.env` or copy to clipboard. Every action is logged locally.

## Supported Services

| Service | Creates New Keys | Validation | Env Vars |
|---------|:---:|---|---|
| OpenAI | ✓ | `GET /v1/organization/me` | `OPENAI_API_KEY` |
| Supabase | ✓ | `GET /v1/projects` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Resend | ✓ | `GET /domains` | `RESEND_API_KEY` |
| Anthropic | copies key | `GET /v1/models` | `ANTHROPIC_API_KEY` |
| Stripe | copies key | `GET /v1/balance` + `/v1/account` | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| Clerk | copies key | `GET /v1/users` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |

**Creates New Keys** = KeyForge calls the provider's API to create a scoped key named `keyforge-<project>`. On project deletion, these keys are automatically revoked.

**Copies key** = Your stored credential is copied into the project's `.env`. You manage these keys manually in the provider's dashboard.

## CLI

```
keyforge status                          # Show connection status
keyforge connect <provider>              # Connect a provider interactively
keyforge disconnect <provider>           # Disconnect a provider
keyforge new <name> [-s openai,stripe]   # Create a project with keys
keyforge projects                        # List all projects
keyforge export <name> [--to ./path]     # Export .env to a directory
keyforge revoke <name>                   # Revoke keys and delete project
```

### Examples

```bash
# Connect OpenAI with an admin key
keyforge connect openai

# Create a project with specific services
keyforge new my-saas -s openai,supabase,stripe

# Export to your project directory
keyforge export my-saas --to ~/projects/my-saas

# Delete project and revoke API-created keys
keyforge revoke my-saas
```

## Security

- **System keychain** — Credentials stored in macOS Keychain, Windows Credential Manager, or Linux Secret Service via `keytar`.
- **AES-256-GCM fallback** — If no keychain is available, keys are encrypted with a machine-specific derived key and stored in `data/auth.enc`.
- **Local audit log** — Every connect, provision, export, and revoke is logged to `data/audit.log`.
- **No cloud** — The only network calls are to official service APIs for validation and key creation. Nothing is sent to KeyForge servers (there are none).

### Where are credentials stored?

| System | Location |
|--------|----------|
| macOS | Keychain Access → "keyforge" |
| Windows | Credential Manager → "keyforge" |
| Linux | Secret Service (GNOME Keyring / KDE Wallet) |
| Fallback | `data/auth.enc` (AES-256-GCM encrypted) |

## Development

```bash
npm run dev       # Start server (4000) + Vite frontend (5173)
npm run build     # Build frontend + compile server TypeScript
npm start         # Run production server from dist/
```

## License

MIT
