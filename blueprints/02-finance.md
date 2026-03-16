# Finance — Blueprint

**Route**: `/finance`
**Component**: `components/sections/finance/FinancePage.tsx` (1410 lines)
**Status**: Partial — 40% backend integration

## What Exists

6-tab interface:

### Tab 1: Overview
- P&L strip (revenue, outstanding, AI spend, net profit)
- Monthly AI budget bar
- Monthly runrate card
- Annual projection card
- Invoices list + Agent costs list

### Tab 2: Accounts
- AI CFO recommendations (algorithmic, no LLM needed)
- Expenses & Reimbursements grid
- Data sources (Gmail, Bank, Stripe, Manual)

### Tab 3: Expenses
- CostTrend chart (line chart with budget overlay)
- Quick stats (best ROI agents, monthly tokens, time saved)

### Tab 4: Auditing
- Audit trail (agent actions, invoice changes, budget changes)
- Export buttons (CSV, PDF)

### Tab 5: Tax Filing
- Tax overview with estimated deductions
- Filing items with due dates

### Tab 6: Human Controllers
- Controller management (accountant, bookkeeper, advisor, preparer)
- Connect accounting software (QuickBooks, Xero, FreshBooks, Wave)
- Approval rules

## API Endpoints Used

| Endpoint | Method | Status |
|----------|--------|--------|
| `/api/invoices` | GET | Working |
| `/api/efficiency/cost?view=summary` | GET | Working |
| `/api/efficiency/cost?view=by-agent` | GET | Working |

## What Needs Work

1. **Expenses endpoint**: Create `/api/expenses` (GET/POST) and fetch in FinancePage
2. **Reimbursements endpoint**: Create `/api/reimbursements` (GET/POST)
3. **Trend data**: Add `view=trend` to `/api/efficiency/cost` for daily cost line chart
4. **Data sources**: Create `/api/data-sources` for connected account tracking
5. **Export endpoints**: Create `/api/exports/{type}` for CSV/PDF generation
6. **Tax filing**: Create `/api/tax/overview` and `/api/tax/filings`
7. **Human controllers**: Create `/api/controllers` for managing access
8. **Wire CFO suggestions**: Use real data thresholds (already algorithmic, just needs real data)
9. **Audit trail**: Pull from `audit_logs` table with proper filtering
