# Memory — Blueprint

**Route**: `/memory`
**Component**: `app/(app)/memory/page.tsx` (728 lines, inline)
**Status**: Working — 95% complete, full CRUD + search

## What Exists (All Working)

### Overview Tab
- Total memories, agents, categories stats
- Category breakdown bar chart
- Agent breakdown list
- Recent memories preview

### Timeline Tab
- 30-day bar chart (memories per day)
- Daily breakdown grouped list

### All Memories Tab
- Category filter dropdown
- Agent filter dropdown
- Result count
- Memory rows with category badge, agent, date, importance

### Search Tab
- Full-text and semantic search
- Search results display

### Add Memory Form
- Content textarea
- Category selector (fact, preference, relationship, event, insight)
- Importance slider (0.0–1.0)

## API Endpoints (All Implemented)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/memory/stats` | GET | Aggregated statistics |
| `/api/memory` | POST | Add memory |
| `/api/memory` | DELETE | Remove memory |
| `/api/context/memory?q=` | GET | Search (semantic + text) |

## What Could Be Improved

1. **Edit memories**: Allow updating content and metadata
2. **Bulk operations**: Select + delete multiple
3. **Memory sources**: Show which agent/conversation created each memory
4. **Semantic visualization**: Show related memory clusters
5. **Auto-extraction**: Settings for what agents should auto-remember
