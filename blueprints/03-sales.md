# Sales — Blueprint

**Route**: `/sales`
**Component**: `components/sections/sales/SalesPage.tsx` (211 lines)
**Status**: UI Only — 0% backend

## What Exists

4-tab interface:
- **Pipeline**: KPIs (pipeline value, active leads, proposals out, won MTD) + stage visualization
- **Leads**: List with company, contact, stage badge, source, date, value
- **Proposals**: List with title, client, status, date, amount
- **Activity**: Log of sales agent actions

## Mock Data

- 4 leads (Acme Corp $12k, Globex $8.5k, Wayne Ent $15k, Stark Ind $3.2k)
- 3 proposals (sent, draft, accepted)
- 5 activity items

## What Needs Work

1. **Database tables**: Create `leads`, `proposals` tables in Supabase
2. **API endpoints**:
   - `GET/POST /api/sales/leads` — CRUD leads
   - `GET/POST /api/sales/proposals` — CRUD proposals
   - `GET /api/sales/pipeline` — Pipeline summary
   - `GET /api/sales/activity` — Activity log from audit_logs
3. **Lead creation form**: Add form or wire to InlineFormSheet
4. **Proposal creation**: Wire to document/template system
5. **Stage transitions**: Allow drag-drop or click to change lead stage
6. **Pipeline calculations**: Compute from real data
7. **Search/filter**: Add search by company, filter by date/source
8. **Agent integration**: Sales agent auto-creates leads from email/form data
9. **Server component wrapper**: Fetch initial data server-side like Team page
