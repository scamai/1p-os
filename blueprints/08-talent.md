# Talent (Marketplace) — Blueprint

**Route**: `/talent`, `/talent/[slug]`
**Components**: `TalentView.tsx`, `AgentDetailView.tsx`, `components/talent/*`
**Status**: Broken — 60% backend, critical schema mismatch bug

## What Exists

- Pre-built team templates (4 templates with agent bundles)
- Marketplace grid with search, category filter, sort
- Agent detail page (capabilities, permissions, cost)
- Hire flow modal (confirm/customize)
- Real data from `marketplace_agents` Supabase table

## Critical Bug

**API Schema Mismatch in `/api/marketplace/install`**:
- API expects: `{ marketplaceAgentId: uuid }`
- TalentView sends: `{ agentName: string }` (line 48)
- TeamTemplates sends: `{ templateId: string }` (line 57)
- AgentDetailView sends: `{ agentId: string }` (line 30)
- **Result**: All hire operations fail with 400 validation error

## Components

| Component | File | Status |
|-----------|------|--------|
| MarketplaceGrid | `components/talent/MarketplaceGrid.tsx` | Working |
| AgentListing | `components/talent/AgentListing.tsx` | Working |
| TeamTemplates | `components/talent/TeamTemplates.tsx` | Broken (API) |
| HireFlow | `components/talent/HireFlow.tsx` | Broken (API) |

## What Needs Work

1. **Fix schema mismatch**: Update all 3 client calls to send `{ marketplaceAgentId: id }`
2. **Template installation**: Add template handling logic to install endpoint
3. **Error handling**: Show success/error notifications after hire attempt
4. **Post-hire redirect**: Navigate to `/team` after successful hire
5. **Agent customization**: Wire "Customize" button in HireFlow to configuration
6. **Ratings/reviews**: Add review system for marketplace agents
7. **Publishing**: Wire publish flow for users to share their agents
