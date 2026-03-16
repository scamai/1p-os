# Operations — Blueprint

**Route**: `/operations`
**Components**: `OperationsView.tsx`, `WorkflowCanvas.tsx`, `nodes/*`
**Status**: Partial — 50% backend, React Flow canvas fully functional

## What Exists

### Workflow Builder (React Flow)
- Drag-and-drop node palette (Trigger, Agent Step, Condition, Output)
- Department-colored agent nodes with status indicators
- Animated edges with directional arrows
- Auto-layout (dagre algorithm)
- MiniMap, controls, snap-to-grid
- Delete nodes with Backspace
- Canvas stats (nodes, connections, workflows)

### Org Structure
- Department cards with agent lists
- Founder → Department hierarchy visualization
- Status legend
- Summary stats (departments, agents, active, cost)

### Custom Node Types

| Node | Color | Handles | Features |
|------|-------|---------|----------|
| TriggerNode | Blue | 1 source | Workflow name + trigger event |
| AgentStepNode | Dept color | 1 target + 1 source | Status dot, tasks, cost |
| ConditionNode | Amber | 1 target + 2 source (yes/no) | Branch logic |
| OutputNode | Green | 1 target | Completion marker |

## API Endpoint

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/core/operations` | GET | Working (infers workflows from agent messages) |

## What Needs Work

1. **Workflow persistence**: Save canvas state (nodes + edges) to database
2. **Workflow execution**: Connect saved workflows to automation engine
3. **Node configuration**: Double-click to edit node properties
4. **Trigger scheduling**: Configure trigger conditions (cron, event, webhook)
5. **Condition logic**: Define condition expressions
6. **Execution visualization**: Show which nodes are currently active
7. **Workflow templates**: Pre-built workflow templates
8. **Version history**: Track workflow changes over time
9. **Error handling**: Show failed nodes with error details
10. **Export/import**: Share workflows as JSON
