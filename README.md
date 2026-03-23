# KeyForge

A local-first developer tool for managing API keys across services. Connect your accounts once (Stripe, OpenAI, Supabase, Anthropic, Resend, Clerk), then create fresh, named API keys for any new project in seconds. No cloud, no telemetry — everything runs locally and credentials are encrypted via your system keychain.

## Quick Start

```bash
npm install
npm run dev
```

Then open [http://localhost:4000](http://localhost:4000) (via Vite proxy at port 5173 in dev).

## Supported Services

| Service    | Creates New Keys | Env Vars |
|------------|:---:|---|
| OpenAI     | ✓ | `OPENAI_API_KEY` |
| Supabase   | ✓ | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Resend     | ✓ | `RESEND_API_KEY` |
| Anthropic  | ✗ (copies stored key) | `ANTHROPIC_API_KEY` |
| Stripe     | ✗ (copies stored key) | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY` |
| Clerk      | ✗ (copies stored key) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |

## CLI Commands

```
keyforge status                          # Show connection status
keyforge connect <provider>              # Connect a provider interactively
keyforge new <name> [-s openai,stripe]   # Create a project with keys
keyforge projects                        # List all projects
keyforge export <name> [--to ./path]     # Export .env to a directory
keyforge revoke <name>                   # Revoke keys and delete project
```

## Security

Credentials are stored in your system keychain via `keytar`. On systems without a native keychain, KeyForge falls back to an AES-256-GCM encrypted JSON file derived from your machine identity. No credentials ever leave your machine — the only network calls are to the official service APIs for key validation and creation.

## License

MIT
