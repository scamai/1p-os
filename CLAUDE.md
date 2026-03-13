# 1P OS — Development Guide

## What is this?
An open-source, AI-native operating system where solo founders hire unlimited AI agents to run their business. AGPLv3 licensed.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS (dark mode, `class` strategy)
- **Database**: Supabase Postgres with RLS
- **Auth**: Supabase Auth
- **AI**: Anthropic Claude API (primary), Ollama/Together/OpenRouter (fallback)
- **Payments**: Stripe
- **Cache**: Redis

## Project Structure
- `app/` — Next.js pages and API routes
- `lib/` — Core business logic (context, agents, safety, efficiency, AI)
- `components/` — React components (company, team, talent, costs, shell, setup, ui)
- `supabase/migrations/` — Database migrations

## Key Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## Architecture Layers
1. **Client Layer** — Next.js App (web + PWA)
2. **API Gateway** — Next.js API Routes + auth middleware
3. **Business Context Engine** (`lib/context/`) — Source of truth for business state
4. **Agent Runtime** (`lib/agents/`) — Orchestrator, execution loop, message bus
5. **Safety Layer** (`lib/safety/`) — Circuit breakers, cost budget, human gate, kill switch, audit
6. **Efficiency Engine** (`lib/efficiency/`) — Task router, context cache, cost tracker
7. **Data Layer** — Supabase Postgres (RLS), Redis

## Development Rules
- Every table has RLS policies — never bypass them
- Every API route checks auth session first
- Every AI call goes through the safety pipeline (budget check → circuit breaker → human gate)
- Every AI call is logged to audit_log with cost, model, and token count
- All inputs validated with Zod
- Sensitive data encrypted with AES-256-GCM (lib/encryption.ts)
- Agent actions validated against allowed_actions before execution
- Cost tracked for EVERY API call — no exceptions
- Use `@/` path alias for imports

## Safety Defaults
- Agent budget: $2/day, $50/month per agent
- Global budget: $20/day, $500/month
- Circuit breaker: 3 failures in 5 minutes → auto-pause
- Loop detection: max chain depth 10, 3 repeats = break
- Human gate: always required for payments, contracts, tax filing, data deletion

## Environment Variables
Copy `.env.example` to `.env.local` and fill in values. Required: Supabase URL/keys, Anthropic API key, Encryption key.
