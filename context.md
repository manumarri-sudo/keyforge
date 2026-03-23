# KeyForge

## What This Is
A local developer platform where you connect your service accounts once (Stripe, OpenAI, Supabase, etc.) and then create fresh, named API keys for any new project in seconds.

## Core UX
Two moments:
1. CONNECT (one-time): User provides master credentials for each service. Stored encrypted locally.
2. PROVISION (per project): User checks services, types project name, hits go. Tool creates new keys via official APIs and writes .env.

## Design Direction
Clean, minimal, professional. Dark theme. Service grid with connection status badges. Think Vercel dashboard meets 1Password. Not playful, not enterprise-heavy. Developer tool aesthetic.

## Principles
- KISS/YAGNI/SOLID
- .env always gets written. Every provision flow completes.
- No cloud, no server, no telemetry. Everything local.
- No Playwright. No browser automation. API-only for key creation.
- Credential-paste for services without creation APIs.