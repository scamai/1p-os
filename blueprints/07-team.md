# Team — Blueprint

**Route**: `/team`
**Components**: `app/(app)/team/page.tsx` (server), `TeamView.tsx` (client), `components/team/*`
**Status**: Working — 80% backend

## What Exists

### Working
- Agent grid with status dots, task counts, costs
- Agent detail sidebar (stats, activity, actions)
- Agent chat (POST `/api/ai/chat`, stores messages)
- Pause/Resume (PATCH `/api/agents/{id}`)
- Delete with confirmation (DELETE `/api/agents/{id}`)
- Server-side data fetching with Supabase

### Demo/Placeholder
- Skills Panel (10 hardcoded skills, local toggle only)
- Browser Panel (3 hardcoded active sessions, 10 history)
- Hire Agent button (dispatches event only)

## Components

| Component | File | Status |
|-----------|------|--------|
| AgentGrid | `components/team/AgentGrid.tsx` | Working |
| AgentDetail | `components/team/AgentDetail.tsx` | Working |
| AgentChat | `components/team/AgentChat.tsx` | Working |
| AgentStats | `components/team/AgentStats.tsx` | Working |
| SkillsPanel | `components/sections/team/SkillsPanel.tsx` | Demo |
| BrowserPanel | `components/sections/team/BrowserPanel.tsx` | Demo |

## What Needs Work

1. **Skills management**: Create `agent_skills` table, wire CRUD
2. **Browser sessions**: Integrate with actual web browsing agent capability
3. **Hire flow**: Connect AIWizard → `/api/agents/hire` → refresh grid
4. **Agent activity**: Pull from `audit_logs` instead of hardcoded strings
5. **Real-time chat**: Consider WebSocket for live agent responses
6. **Agent configuration**: Edit agent role, budget, allowed actions
