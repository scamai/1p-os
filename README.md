# 1P OS

**The AI-native operating system for solo founders.**

Hire unlimited AI agents to run your business — sales, support, finance, content, ops — all coordinated through a single dashboard. No employees needed.

**AGPLv3 Licensed** | Built with Next.js, Supabase, Claude

---

## How It Works

You describe your business. 1P OS spins up a team of AI agents, each with a role, budget, and set of permissions. They work autonomously — qualifying leads, resolving tickets, reconciling books, publishing content — and escalate decisions to you when needed.

```
You (Founder)
 ├── Sales Agent ──── qualifies leads, drafts proposals
 ├── Support Agent ── resolves tickets, tracks CSAT
 ├── Content Agent ── writes blog posts, schedules social
 ├── Bookkeeper ───── reconciles Stripe, categorizes expenses
 ├── Invoice Agent ── sends invoices, follows up on payments
 └── Ops Coordinator ─ routes tasks, compiles daily briefs
```

Every agent has a daily budget, circuit breaker, and human gate. You stay in control.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Client Layer — Next.js 14 (App Router + PWA)   │
├─────────────────────────────────────────────────┤
│  API Gateway — 42 routes + auth middleware       │
├─────────────────────────────────────────────────┤
│  Context Engine — business state (lib/context/)  │
├─────────────────────────────────────────────────┤
│  Agent Runtime — orchestrator, runner, bus       │
├─────────────────────────────────────────────────┤
│  Safety Layer — budget, circuit breaker, gates   │
├─────────────────────────────────────────────────┤
│  Efficiency Engine — routing, cache, dedup       │
├─────────────────────────────────────────────────┤
│  Data Layer — Supabase Postgres (RLS) + Redis    │
└─────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14, React 18, TypeScript (strict) |
| Styling | Tailwind CSS (dark mode, class strategy) |
| Database | Supabase Postgres with Row Level Security |
| Auth | Supabase Auth (email, OAuth) |
| AI (primary) | Anthropic Claude API |
| AI (fallback) | OpenAI, Google Gemini, Mistral, Groq, Ollama |
| AI memory | mem0 (pgvector semantic search) |
| Integrations | Composio (500+ apps), direct OAuth |
| Payments | Stripe |
| Cache | Redis / Upstash |
| Voice | ElevenLabs, Deepgram, Whisper |

---

## Features

### Agent Management
- **Team Dashboard** — grid view of all agents with status, tasks, cost
- **Agent Chat** — talk to any agent directly
- **Talent Marketplace** — hire pre-built agents (SEO, legal, data analyst, etc.)
- **Team Templates** — one-click setups for SaaS, agency, consultant, freelancer
- **Agent Evolution** — agents level up with XP as they complete tasks

### Operations
- **HQ** — daily brief, pending decisions, agent activity feed
- **Operations View** — org chart by department + workflow visualization
- **Decision Cards** — approve/reject agent escalations (proposals, refunds, payments)
- **Kill Switch** — pause all agents instantly

### Finance
- **Cost Dashboard** — daily spend by agent, model, task type
- **Budget Controls** — per-agent and global limits
- **What-If Calculator** — estimate cost changes before making them
- **Invoice Management** — auto-generate, send, and track invoices
- **Expense Tracking** — categorized expenses with agent attribution

### Business Tools
- **CRM** — relationships, leads, customers, vendors
- **Vault** — document storage with access control and audit trail
- **Memory** — business knowledge base (semantic search via mem0)
- **Canvas** — agent-generated documents and reports
- **Channels** — internal agent communication threads
- **Automations** — event-driven and scheduled workflows

### Safety & Control
- **Per-agent budgets** — $2/day, $50/month defaults
- **Global budget** — $20/day, $500/month
- **Circuit breaker** — 3 failures in 5 min = auto-pause
- **Loop detection** — max chain depth 10, 3 repeats = break
- **Human gate** — required for payments, contracts, tax, data deletion
- **Audit log** — every AI call logged with cost, model, tokens
- **Action validation** — agents can only perform allowed actions

### Integrations
- Gmail, Outlook, Slack, Google Drive, Notion
- Stripe (payments + webhooks)
- 500+ apps via Composio SDK
- Voice: ElevenLabs, Deepgram, Cartesia, Whisper

---

## Project Structure

```
app/
├── (app)/               # Authenticated pages (20 sections)
│   ├── company/         # HQ dashboard
│   ├── team/            # Agent management
│   ├── talent/          # Agent marketplace
│   ├── operations/      # Org chart + workflows
│   ├── finance/         # Financial management
│   ├── sales/           # Sales pipeline
│   ├── work/            # Projects & tasks
│   ├── vault/           # Document storage
│   ├── channels/        # Communication
│   ├── memory/          # Business knowledge
│   ├── canvas/          # Agent documents
│   ├── automations/     # Workflow builder
│   ├── costs/           # Cost analytics
│   ├── settings/        # Config (models, safety, keys)
│   └── ...
├── api/                 # 42 API routes across 16 domains
│   ├── ai/              # AI chat, setup, agent creation
│   ├── agents/          # CRUD + messaging
│   ├── safety/          # Kill switch, budget, audit
│   ├── efficiency/      # Cost tracking, routing
│   ├── integrations/    # OAuth, Composio
│   ├── gateway/         # Protocol layer
│   └── ...
├── auth/                # Login, signup
└── layout.tsx           # Root layout

lib/
├── agents/              # Runtime, orchestrator, runner, memory (12 files)
├── safety/              # Budget, circuit breaker, gates, audit (8 files)
├── efficiency/          # Cost tracker, router, cache, dedup (9 files)
├── context/             # Business context engine (2 files)
├── core/                # Core engine and actions (5 files)
├── gateway/             # Protocol and tool layer (5 files)
├── integrations/        # OAuth, email, Composio (5 files)
├── security/            # Audit engine, approvals (2 files)
├── voice/               # TTS/STT engine (3 files)
├── ai/                  # AI client and prompts (3 files)
├── marketplace/         # Agent registry and review (2 files)
├── supabase/            # DB client (4 files)
└── encryption.ts        # AES-256-GCM

components/
├── ui/                  # Button, Card, Badge, Input, Modal (6)
├── shared/              # DataTable, SparklineChart, EmptyState (6)
├── shell/               # Sidebar, Header, CommandBar, KillSwitch (9)
├── company/             # DecisionFeed, MorningBrief, HealthScore (11)
├── team/                # AgentGrid, AgentDetail, AgentChat (4)
├── talent/              # MarketplaceGrid, HireFlow (4)
├── costs/               # CostDashboard, BudgetControls (5)
├── forms/               # Invoice, Expense, Person, Project forms (6)
├── setup/               # Onboarding, TemplatePicker (6)
└── sections/            # Full-page feature components (15)

supabase/
├── migrations/          # 7 migration files (schema + seed templates)
├── seed.sql             # Demo data for all features
└── config.toml          # Local dev configuration
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Docker (for local Supabase)
- Supabase CLI (`npm i -g supabase`)

### 1. Clone and install

```bash
git clone https://github.com/scamai/1p-os.git
cd 1p-os
npm install
```

### 2. Start the demo database

```bash
./scripts/demo-setup.sh
```

This starts local Supabase, applies all migrations, seeds demo data, and configures `.env.local`.

### 3. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo login:** `demo@1pos.dev` / `demo1234`

### What the demo includes

| Data | Count |
|---|---|
| Business | 1 (Acme Studios — B2B SaaS, $45K MRR) |
| AI Agents | 7 across 5 departments |
| Pending Decisions | 5 (proposals, budgets, refunds) |
| Relationships | 10 (customers, leads, vendors) |
| Invoices | 7 (paid, sent, draft, overdue) |
| Projects | 7 (5 active, 2 completed) |
| Documents | 8 (proposals, reports, contracts) |
| Business Memories | 8 (facts, insights, competitor intel) |
| Cost Snapshots | 14 days of daily breakdowns |
| Achievements | 8 unlocked |
| Marketplace Agents | 6 available to hire |

---

## Configuration

Copy `.env.example` to `.env.local`. Required variables:

```bash
# Supabase (auto-set by demo-setup.sh for local dev)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI — at minimum, set one provider
ANTHROPIC_API_KEY=           # Primary (recommended)

# Security
ENCRYPTION_KEY=              # openssl rand -hex 32
```

### Supported AI Providers (15+)

Anthropic (Claude), OpenAI, Google Gemini, Mistral, Cohere, xAI (Grok), DeepSeek, Groq, Perplexity, and more. Plus gateways: OpenRouter, Together, Ollama (local).

### Smart Router

Set `ONEPOS_ROUTER_ENABLED=true` to let 1P OS automatically route each AI call to the best model based on task complexity, cost, and latency.

---

## Database

7 migration files define the schema:

| Migration | Tables |
|---|---|
| 001_initial | businesses, agents, agent_messages, decision_cards, invoices, relationships, deadlines, business_memory, agent_data, marketplace_agents, achievements, audit_log, safety_config, cost_snapshots, industry_templates |
| 002_seed_templates | Industry template data (freelancer, SaaS, consultant) |
| 003_integrations | integrations, infra_mode columns |
| 004_mem0_memory | mem0_memories (pgvector), mem0_history, match_vectors() |
| 005_vault_documents | documents, document_access_log |
| 006_projects_channels | projects, channels, expenses |
| 007_automations | automation workflows |

All tables use Row Level Security scoped to `auth.uid()`.

### Useful commands

```bash
supabase start          # Start local Supabase
supabase db reset       # Reset DB (reapply migrations + seed)
supabase studio         # Open Supabase Studio (port 54423)
supabase migration new  # Create new migration
```

---

## Safety Model

Every AI call passes through a safety pipeline before execution:

```
Trigger → Budget Check → Circuit Breaker → Loop Detection → Human Gate → Execute → Audit Log
```

- **Budget check** — rejects if agent or global budget exceeded
- **Circuit breaker** — auto-pauses agent after repeated failures
- **Loop detection** — breaks infinite agent-to-agent chains
- **Human gate** — blocks sensitive actions (payments, contracts, deletion)
- **Audit log** — records cost, model, tokens, context accessed

The kill switch (`/api/safety/kill-switch`) pauses all agents instantly.

---

## Development

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint
```

### Key rules

- Every table has RLS policies — never bypass them
- Every API route checks auth session first
- Every AI call goes through the safety pipeline
- Every AI call is logged to audit_log with cost
- All inputs validated with Zod
- Sensitive data encrypted with AES-256-GCM
- Agent actions validated against allowed_actions
- Use `@/` path alias for imports

---

## License

[AGPLv3](https://www.gnu.org/licenses/agpl-3.0.en.html) — free to use, modify, and deploy. If you run a modified version as a service, you must open-source your changes.
