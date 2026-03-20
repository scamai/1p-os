# TODO

## Tech Debt

- [ ] 🟡 Upgrade Next.js from 14 to latest to fix 4 high-severity CVEs (DoS, HTTP smuggling, image disk cache) — `package.json` (breaking change, needs testing)
- [ ] 🔴 Add migration for `milestones` table — referenced in `app/api/ai/summary/route.ts:107` but doesn't exist in DB
- [ ] 🔴 Add migration for `efficiency_events` table — referenced in `app/api/efficiency/cost/route.ts:108` but doesn't exist in DB
