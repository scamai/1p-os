# 1P OS — Master Blueprint

> AI-native operating system where solo founders hire unlimited AI agents to run their business.

## Platform Health Overview

| Page | Status | Backend | Data Source | Priority |
|------|--------|---------|-------------|----------|
| **HQ** | Partial | 30% | Mock + API fallback | P0 |
| **Finance** | Partial | 40% | API (invoices, costs) + mock (expenses, trends) | P0 |
| **Sales** | UI Only | 0% | 100% mock | P1 |
| **CRM** | UI Only | 0% | 100% mock | P1 |
| **Products** | UI Only | 0% | 100% mock | P1 |
| **Work** | UI Only | 0% | 100% mock | P0 |
| **Team** | Working | 80% | Supabase + API | P2 |
| **Talent** | Broken | 60% | Supabase (schema mismatch bug) | P1 |
| **Vault** | UI Only | 0% | 100% mock | P1 |
| **Channels** | Working | 95% | Full API integration | P3 |
| **Operations** | Partial | 50% | API + mock fallback | P2 |
| **Automations** | Working | 95% | Full CRUD Supabase | P3 |
| **Memory** | Working | 95% | Full CRUD + search | P3 |
| **Canvas** | UI Only | 0% | 100% hardcoded | P2 |
| **Settings** | Working | 90% | Supabase + API | P3 |
| **Costs** | Partial | 40% | Some API, missing trend data | P1 |
| **History** | Working | 100% | Supabase audit_logs | P3 |
| **Achievements** | Working | 100% | Supabase achievements | P3 |
| **Setup** | Working | 85% | Full onboarding flow | P3 |
| **Terminal** | Working | 80% | xterm.js + PTY server | P3 |

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  CLIENT LAYER — Next.js 14 App Router (PWA)     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Voice    │ │ Command  │ │ Shell (Header,   │ │
│  │ Control  │ │ Bar      │ │ Sidebar, Forms)  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────┤
│  API GATEWAY — Next.js API Routes + Auth        │
│  40+ endpoints across 12 domains                │
├─────────────────────────────────────────────────┤
│  BUSINESS CONTEXT ENGINE (lib/context/)          │
├─────────────────────────────────────────────────┤
│  AGENT RUNTIME (lib/agents/)                     │
├─────────────────────────────────────────────────┤
│  SAFETY LAYER — Budget, Circuit Breaker, Gate   │
├─────────────────────────────────────────────────┤
│  EFFICIENCY ENGINE — Router, Cache, Cost        │
├─────────────────────────────────────────────────┤
│  DATA LAYER — Supabase Postgres (RLS) + Redis   │
└─────────────────────────────────────────────────┘
```

## Critical Bugs

1. **Talent Marketplace Install — Schema Mismatch**
   - `TalentView` sends `{ agentName }`, API expects `{ marketplaceAgentId: uuid }`
   - All hire operations fail with validation error
   - File: `app/api/marketplace/install/route.ts`

2. **Finance — Missing Data Fetches**
   - `trendData` state initialized empty, never populated
   - `expenses` and `reimbursements` never loaded from API
   - `dataSources` never populated
   - File: `components/sections/finance/FinancePage.tsx`

3. **HQ — Silent API Failures**
   - Decision actions (`PATCH /api/decisions/{id}`) fail silently
   - Goal decomposition may not have backend implementation
   - File: `components/sections/hq/HQPage.tsx`

## Voice Control Coverage

The platform has full voice control via CommandBar + AlwaysOnVoice:
- **40+ commands**: navigation, CRUD, safety, search, scroll, sidebar, approvals
- **Always-on mode**: Cmd+Shift+L toggle, persistent background listening
- **Voice feedback**: TTS confirmation of executed commands
- **Shortcuts**: Cmd+K (command bar), Cmd+Shift+V (push-to-talk)

## Sub-Blueprints

Detailed blueprints for each section are in `blueprints/`:

| File | Covers |
|------|--------|
| [01-hq.md](blueprints/01-hq.md) | HQ/Home — CEO dashboard, decisions, goals |
| [02-finance.md](blueprints/02-finance.md) | Finance — P&L, invoices, expenses, tax, CFO AI |
| [03-sales.md](blueprints/03-sales.md) | Sales — Pipeline, leads, proposals |
| [04-crm.md](blueprints/04-crm.md) | CRM — Contacts, relationships |
| [05-products.md](blueprints/05-products.md) | Products — Instances, models, deployment |
| [06-work.md](blueprints/06-work.md) | Work — Tasks, queue, approvals |
| [07-team.md](blueprints/07-team.md) | Team — Agents, skills, chat, browser |
| [08-talent.md](blueprints/08-talent.md) | Talent — Marketplace, templates, hiring |
| [09-vault.md](blueprints/09-vault.md) | Vault — Documents, access control, integrations |
| [10-channels.md](blueprints/10-channels.md) | Channels — Integrations, OAuth, Composio |
| [11-operations.md](blueprints/11-operations.md) | Operations — Workflow builder, org chart |
| [12-automations.md](blueprints/12-automations.md) | Automations — Schedules, triggers, history |
| [13-memory.md](blueprints/13-memory.md) | Memory — Knowledge base, search, timeline |
| [14-canvas.md](blueprints/14-canvas.md) | Canvas — Documents, markdown, AI editing |
| [15-settings.md](blueprints/15-settings.md) | Settings — Business, security, models, keys |
| [16-shell.md](blueprints/16-shell.md) | Shell — Header, sidebar, voice, command bar |

## Design Language

All pages must follow these conventions for cohesion:

- **Colors**: Zinc palette (zinc-50 to zinc-900), accent colors per domain
- **Typography**: text-[13px] body, text-[11px] labels, text-[10px] hints, font-mono for numbers
- **Cards**: rounded-xl border-zinc-200 bg-white (or bg-zinc-50/50 for nested)
- **Badges**: rounded-full px-2 py-0.5 text-[9px] font-medium
- **Status dots**: h-2 w-2 rounded-full with domain colors
- **Tabs**: TabBar component or custom tab strip with bottom border indicator
- **Spacing**: gap-4 for grids, gap-6 for stat rows, p-4 for card content
- **Empty states**: Centered text with action button, text-zinc-400
- **Loading**: h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900
- **Modals**: Modal component with backdrop blur, max-w-lg
- **Forms**: Input component with label + error, Button with variants
- **Actions**: dispatch `app-action` custom events for cross-component communication
- **Data flow**: Server component fetches → client component renders with fallback mock data

## API Route Map

```
/api/ai/          — AI services (chat, prefill, setup, parse-command, summary)
/api/agents/      — Agent CRUD, messages, hire
/api/automations/ — Schedule/trigger CRUD
/api/context/     — Business context, memory context
/api/core/        — Insights, operations, chat, automation engine
/api/decisions/   — Decision queue CRUD
/api/efficiency/  — Cost, routing, estimation
/api/gateway/     — API gateway router
/api/integrations/— OAuth, API keys, Composio, logs
/api/invoices/    — Invoice CRUD + send
/api/marketplace/ — Install, publish, list
/api/memory/      — Memory CRUD + stats
/api/orchestration/ — Goals, org, heartbeat
/api/safety/      — Kill switch, audit, budget
/api/security/    — Approvals
/api/terminal/    — Shell execution
/api/webhooks/    — Stripe
```

## Database Tables (Supabase)

Core tables with RLS:
- `businesses` — Business profile
- `agents` — AI agent instances
- `agent_messages` — Agent conversation history
- `agent_data` — Agent KV state store
- `audit_logs` — All system actions (cost, agent, decision, safety)
- `safety_config` — Budget limits, circuit breaker settings
- `achievements` — Unlocked milestones
- `marketplace_agents` — Published marketplace listings
- `invoices` — Invoice records
- `decisions` — Pending human decisions
- `integrations` — Connected external services
- `automation_jobs` — Scheduled automations
- `automation_triggers` — Event-driven automations
- `automation_runs` — Execution history
- `mem0_memories` — Agent/business memories
- `business_memory` — Legacy memory store
