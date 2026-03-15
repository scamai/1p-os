# 1P OS — Product Plan

## One-liner
An AI CEO that runs your business while you sleep.

## Who is this for?
Solo founders who want to run a real business without hiring humans. You set the mission, the AI CEO breaks it down, hires agents, delegates work, and reports back. You approve decisions, check progress, and course-correct — like a board of directors with one member.

## Core Loop (daily)
```
Morning:  Open app → see what happened overnight → approve/reject decisions
Midday:   Check progress → adjust priorities → talk to agents if needed
Evening:  Set tomorrow's goals → agents work while you sleep
```

## What exists today (honest)
- 20+ UI pages (mostly demo data, not connected)
- Backend orchestration (goals, heartbeat, CEO agent, org chart) — no UI
- Terminal with real PTY — works
- Agent runtime with safety pipeline — works but no real agents running
- Voice input — works
- Supabase schema — ready but no real database running

## What needs to happen (in order)

### Phase 1: Make it real (1 page that works end-to-end)
**The only page that matters: HQ**

HQ should be the ONLY page a founder needs to see. It shows:
1. **Mission** — your company mission (editable, one sentence)
2. **CEO Brief** — what happened since you last checked (auto-generated)
3. **Decisions** — approve/reject cards from your agents
4. **Goals** — mission → strategy → tasks, live progress
5. **Team** — who's working, what they're doing, cost
6. **Spend** — today's cost, budget remaining

Everything else (finance, sales, vault, etc.) is secondary. Cut it from the sidebar or hide it behind "More".

### Phase 2: Onboarding that works
1. "What's your business?" (one sentence)
2. "What's your mission?" (one sentence)
3. AI CEO decomposes mission → hires agents → starts working
4. You see your first CEO brief within 5 minutes

### Phase 3: Real agent execution
- Connect Anthropic API key
- CEO decomposes goals using Claude
- Worker agents execute tasks via Claude
- Results appear in HQ as completed tasks + decision cards
- Cost tracked per agent per task

### Phase 4: Everything else
- Finance, sales, vault, etc. become views into data agents create
- Terminal stays for power users
- Voice stays as input method

## What to cut
- Canvas (agents can create docs, but no separate page needed)
- Channels (agent messages show in HQ)
- Memory (internal, not user-facing)
- Automations (CEO handles this)
- Products, CRM, Sales as separate pages (data lives in goals/tasks)
- Achievements (vanity)

## Architecture (simplified)
```
Founder (you)
    ↓ sets mission
CEO Agent (Claude)
    ↓ decomposes into goals + tasks
    ↓ assigns to worker agents
Worker Agents (Claude)
    ↓ execute tasks
    ↓ escalate decisions
    ↓ report results
HQ Dashboard
    ↓ shows everything
    ↓ founder approves/rejects
```

## Success metric
A founder opens the app in the morning, sees work done overnight, approves 3 decisions, adjusts 1 priority, and closes the app in under 10 minutes. Business ran itself.
