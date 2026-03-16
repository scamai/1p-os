# Products — Blueprint

**Route**: `/products`
**Component**: `components/sections/products/ProductsPage.tsx` (542 lines)
**Status**: UI Only — 0% backend, but most interactive of the mock pages

## What Exists

- Product cards (collapsible) with status, instances, cost
- Instance cards with start/stop, delete, model selector
- New product dialog with name, description, repo fields
- Add instance button per product
- 3 Claude model options (Opus 4, Sonnet 4, Haiku 3.5)
- Simulated deploy animation (1.5s delay)

## Mock Data

- 2 products (1P OS Website, Client Dashboard)
- 5 instances across products with varying statuses

## What Needs Work

1. **Database tables**: Create `products`, `product_instances` tables
2. **API endpoints**:
   - `GET/POST /api/products` — CRUD products
   - `POST /api/products/{id}/instances` — Create instance
   - `PATCH /api/products/{id}/instances/{instanceId}` — Start/stop, change model
   - `DELETE /api/products/{id}/instances/{instanceId}` — Remove instance
3. **Real instance management**: Connect to actual Claude Code API or agent runtime
4. **Cost tracking**: Track real token usage per instance
5. **Uptime tracking**: Calculate from actual start/stop times
6. **Repository linking**: Clone/connect to git repos
7. **Status persistence**: Save product/instance state to database
8. **Logs/output**: Show instance output/logs in expandable panel
9. **Product editing**: Allow name/description/status changes after creation
