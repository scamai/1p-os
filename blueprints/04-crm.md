# CRM — Blueprint

**Route**: `/crm`
**Component**: `components/sections/crm/CRMPage.tsx` (200 lines)
**Status**: UI Only — 0% backend

## What Exists

- Summary stats (clients, active leads, total revenue)
- 4 tabs: All, Clients, Leads, Contractors
- Expandable contact rows (avatar, name, type, status, email, notes, revenue)
- "+ Add Contact" button (dispatches event, no dialog)

## Mock Data

- 6 contacts (2 clients, 3 leads, 1 contractor)
- Revenue tracking per contact
- Last interaction and agent tracking

## What Needs Work

1. **Database table**: Already has `people` table — wire to it
2. **API endpoints**:
   - `GET/POST /api/crm` — List/create contacts (may already exist for ContactForm)
   - `PATCH/DELETE /api/crm/{id}` — Update/delete contacts
   - `GET /api/crm/stats` — Summary metrics
3. **Search**: Add search by name, email, company
4. **Sort**: By revenue, date, name
5. **Edit contact**: Inline editing or modal form
6. **Delete contact**: With confirmation
7. **Contact detail page**: Expandable view with interaction history
8. **Agent integration**: Auto-create contacts from email parsing
9. **Revenue tracking**: Link invoices to contacts for automatic revenue calculation
10. **Wire Add Contact button**: Connect to existing ContactForm via InlineFormSheet
