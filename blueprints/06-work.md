# Work — Blueprint

**Route**: `/work`
**Component**: `components/sections/work/WorkPage.tsx`
**Status**: UI Only — 0% backend

## What Exists

- Summary stats (running, queued, done today, cost today)
- 3 tabs: Active, Queue, Completed
- Expandable task rows (title, agent, status, time, cost, description)
- "Approve Access" button for blocked tasks
- "+ New Task" button (dispatches app-action)

## Mock Data

- 10 tasks across all statuses (running, queued, blocked, done)

## What Needs Work

1. **Database table**: Create `tasks` table or use existing agent task tracking
2. **API endpoints**:
   - `GET /api/tasks` — List tasks with filters (status, agent, date)
   - `POST /api/tasks` — Create manual task
   - `PATCH /api/tasks/{id}` — Update status, approve access
   - `GET /api/tasks/stats` — Summary metrics
3. **Real-time status**: WebSocket or polling for running task updates
4. **Task assignment**: Assign tasks to specific agents
5. **Approve access**: Wire to safety/approvals system
6. **Task output**: Show agent's work output in expanded view
7. **Cost tracking**: Real cost per task from audit_logs
8. **Priority levels**: Add priority field (low/medium/high/critical)
9. **Dependencies**: Task dependency chains
10. **Wire New Task**: Connect to ProjectForm or new TaskForm
