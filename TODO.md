# TODO

All items from previous review rounds have been resolved.

## Tech Debt

- [ ] Missing DB tables: `efficiency_events` (`app/api/efficiency/cost/route.ts:108`) and `milestones` (`app/api/ai/summary/route.ts:107`) referenced in code but not in migrations — migration 012 was created but needs `supabase db push`
- [ ] Canvas agent integration: `components/sections/canvas/CanvasPage.tsx:171` has TODO for agent-generated canvas updates
- [ ] Remaining `any` types (pragmatic, low priority): `lib/voice/speech-recognition.ts:60` (window as any for SpeechRecognition API), `lib/integrations/composio.ts:20` (lazy SDK loading)

## Completed (2026-03-25)

- [x] Upgrade ESLint 8 → 9 + migrate to flat config (`eslint.config.mjs`) — fixes eslint-config-next@16 compatibility
- [x] Fix 11 new React 19 ESLint errors (set-state-in-effect, purity, refs) across 7 files
- [x] Replace `any` types in heartbeat.ts, morning-brief.ts, business-templates.ts, runner.ts, local-db.ts with proper types
- [x] Update CLAUDE.md: Next.js 15 → 16
- [x] Upgrade Next.js from 14 → 15 to fix 4 high-severity CVEs + upgraded eslint-config-next to fix glob CVE (0 vulnerabilities remaining)
- [x] Replace `any` types in orchestration modules — `lib/orchestration/ceo.ts`, `lib/orchestration/goals.ts`, `app/api/sales/pipeline/route.ts`
- [x] Seed `accelerator_programs` — 5 programs (YC, Techstars, 500 Global, Precursor, SPC) in `seed_launch.sql`
- [x] Seed `investor_database` — 15 investors in `seed_launch.sql`
- [x] Seed `launch_phases` + `launch_steps` + `launch_templates` — 7 phases, 46 steps, 14 templates in `seed_launch.sql`
