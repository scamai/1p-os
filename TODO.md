# TODO

## Tech Debt

- [ ] 🟡 Upgrade Next.js from 14 to latest to fix 4 high-severity CVEs (DoS, HTTP smuggling, image disk cache) — `package.json` (breaking change, needs testing)
- [ ] 🔴 Push migration 012 to Supabase — `supabase db push` requires login (`supabase login` then push `supabase/migrations/012_missing_tables.sql`)
