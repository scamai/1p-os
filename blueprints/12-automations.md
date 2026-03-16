# Automations — Blueprint

**Route**: `/automations`
**Component**: `components/sections/automations/AutomationsPage.tsx` (945 lines)
**Status**: Working — 95% complete, full CRUD

## What Exists (All Working)

### Schedules Tab
- Create schedules (cron, interval, one-time)
- Cron presets (8 common patterns)
- Agent assignment
- Status toggle (active/paused)
- Last run timestamp, error tracking
- Delete with confirmation

### Triggers Tab
- 11 event types + custom events
- Condition expressions
- Fire count tracking
- Status toggle

### History Tab
- Execution log table
- Status indicators (ok/error/skipped)
- Error message display

### Create Modals
- Job modal (name, schedule kind, expression, agent, message)
- Trigger modal (name, event, condition, agent, message)

## API Endpoints (All Implemented)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/automations` | GET | List all jobs, triggers, runs |
| `/api/automations` | POST | Create job or trigger |
| `/api/automations` | PATCH | Update status, edit |
| `/api/automations` | DELETE | Delete job or trigger |

## What Could Be Improved

1. **Cron expression builder**: Visual cron builder instead of text input
2. **Execution details**: Expandable rows showing full run output
3. **Retry logic**: Manual retry for failed runs
4. **Metrics dashboard**: Success rate, average duration charts
5. **Link to Operations**: Navigate from automation to workflow canvas
