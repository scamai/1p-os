# TODO

## Tech Debt

- [ ] 🟡 Upgrade Next.js from 14 to latest to fix 4 high-severity CVEs (DoS, HTTP smuggling, image disk cache) — `package.json` (breaking change, needs testing)
- [ ] 🟡 Reduce `any` type usage in orchestration modules — `lib/orchestration/ceo.ts` (11), `lib/orchestration/goals.ts` (8), `app/api/sales/pipeline/route.ts` (6)

## Seed Data Needed

- [ ] 🟡 `accelerator_programs` — table exists but empty, accelerators page shows nothing
- [ ] 🟡 `investor_database` — table exists but empty, investor search returns 0 results
- [ ] 🟡 `launch_phases` + `launch_steps` + `launch_templates` — needed for launch dashboard progress tracker
