# PROGRESS

## 2026-03-25 — TODO Cleanup

### What was done
- **Next.js 14 → 15**: Upgraded `next`, `react`, `react-dom`, `eslint-config-next`. Fixed async `params` in 3 files: `talent/[slug]/page.tsx`, `data/[table]/route.ts` (4 handlers), `orchestration/goals/[id]/route.ts` (2 handlers). npm audit: 0 vulnerabilities.
- **Type safety**: Replaced 25+ `any` annotations with proper types (`SupabaseClient`, `AgentRecord`, `GoalRecord`, `GoalTreeNode`) across `ceo.ts`, `goals.ts`, `pipeline/route.ts`.
- **Seed data**: `investor_database` now has 15 realistic investor records. `launch_phases` (7), `launch_steps` (46), `launch_templates` (14), `accelerator_programs` (5) were already seeded in `seed_launch.sql`.

### Lessons learned
- Next.js 15 makes ALL route `params` async (`Promise<{...}>`) — not just page components, but API route handlers too. The build error only shows the first failing file, so must grep for ALL occurrences before building.
- `eslint-config-next` had a transitive `glob` CVE — upgrading it separately was necessary to reach 0 vulnerabilities.
- Anthropic SDK's `ContentBlock` type union requires `"text" in b` narrowing, not a type predicate cast, because `TextBlock` has required fields beyond `type` and `text`.

## 2026-03-25 — Review Round 5

### What was fixed
- **Error message leaks (2 more)**: Removed `createError.message` from `app/api/agents/route.ts:116` and `publishError.message` from `app/api/marketplace/publish/route.ts:92`
- **Dead code (418 lines)**: Removed 3 orphaned components: `Education.tsx` (296 lines), `FounderTip.tsx` (52 lines), `PWAInstall.tsx` (70 lines)
- Full re-audit of all 57 API routes — zero remaining `.message` leaks, all routes authed

### Status after Round 5
- tsc: 0 errors
- eslint: 0 errors/warnings
- build: passes clean
- All API routes: authed + no error leaks

## 2026-03-25 — Review Round 4

### What was fixed
- **Build-blocking type error**: Fixed explicit type annotation in `app/api/memory/stats/route.ts:155` — `.map()` callback had narrower type than Supabase JSON column inference. Used `String()` coercion instead.
- **SQL injection (2 routes)**: Sanitized search params in `.or()` queries — `app/api/launch/investors/route.ts:30`, `app/api/marketplace/route.ts:47`. Stripped `%_.,()` chars that PostgREST interprets as operators.
- **Missing auth (3 routes)**: Added `supabase.auth.getUser()` checks to `app/api/launch/investors/route.ts`, `app/api/launch/accelerators/route.ts`, `app/api/activity/stream/route.ts`
- **Error message leaks (2 spots)**: Removed `${error.message}` from audit-engine findings at `lib/security/audit-engine.ts:380,468`
- **Dead code**: Removed orphaned `components/launch/LaunchDashboard.tsx` (224 lines, replaced by HQPage)
- **Missing devDependency**: Installed `@playwright/test` — fixed 17 tsc errors in `e2e/navigation.spec.ts` and `playwright.config.ts`

### Lessons learned
- Supabase `.or()` filter strings accept raw PostgREST syntax — user input with `.` or `,` can break filter logic. Always strip operator chars.
- Supabase JSON columns infer as `{}` in TS — explicit type annotations on `.map()` callbacks will conflict. Let TS infer or use `String()`.
- SSE stream endpoints need auth too — `activity/stream` was fully open.

## 2026-03-19 — Review Round 3

### What was fixed
- **Auth (6 pages)**: Replaced hardcoded `userId = "00000000-..."` with real `supabase.auth.getUser()` in all launch pages: page, onboarding, reminders, templates, investors, accelerators
- **Security**: Removed `bizError.message` leak in `app/api/ai/setup/route.ts`
- **Auth callback**: Fixed `0.0.0.0:3000` redirect by using `x-forwarded-host` header
- **NEXT_PUBLIC vars**: Added `.env.production` committed to git to fix DO build-time env var injection
- **OAuth**: Reverted to browser-side `signInWithOAuth` — DO Encrypted vars are runtime-only, can't be used for NEXT_PUBLIC_ baking

### Lessons learned
- All Server Component pages that query user-specific data must call `supabase.auth.getUser()` — never hardcode user IDs
- DO App Platform "Encrypted" env vars are runtime-only; NEXT_PUBLIC_ vars need to be in committed `.env.production` for build-time baking
- After OAuth callback, `request.url` origin reflects internal binding (`0.0.0.0:3000`), not the public domain — always use `x-forwarded-host`

## 2026-03-19 — Review Round 2

### What was fixed
- **Security (6 files)**: Removed `error.message` / `err.message` leaks from API responses:
  - `gateway/route.ts` (2 spots — channel send error, automation add error)
  - `agent-run/stream/route.ts` — SSE error payload
  - `orchestration/template/route.ts` — template apply error
  - `integrations/connect/route.ts` — OAuth error response (removed env var name leak too)
  - `invoices/route.ts` — Supabase error details field
- **Migration**: Created `supabase/migrations/012_missing_tables.sql` with `milestones` and `efficiency_events` tables (RLS + indexes). Needs `supabase db push` with login.
- **OAuth fix**: Reverted to browser-side `signInWithOAuth` (removes server-side PKCE cookie complexity that caused `bad_oauth_state` on DO production)

### Lessons learned
- `error.message` in SSE streams also leaks to users — treat stream payloads same as HTTP JSON responses
- Removing a Next.js route requires clearing `.next/types/` to avoid stale TS errors
- `integrations/connect` was leaking env var names (e.g. `GOOGLE_CLIENT_ID`) in error responses — removed the "helpful" not_configured message since it reveals internal config structure
- `supabase db push` requires `supabase login` (access token) — can't automate without stored token

## 2026-03-19 — Session 1

### What was done
- Cloned repo, installed deps, pushed 11 DB migrations to Supabase cloud
- Configured Google OAuth (user did manually in dashboard)
- Set up nginx + Headscale VPN for internal domain `1p-os.internal.scam.ai`
- Review Round 1: fixed 18 issues — 24 error.message leaks, 7 lint warnings, dead code, npm audit patch
- OAuth `bad_oauth_state` debugging: nginx buffer fix (502), then switched to server-side OAuth (wrong fix)
- DO production deploy: added env vars, updated Supabase Site URL + Redirect URLs
- Final OAuth fix: reverted to browser-side client (correct fix)

### Lessons learned
- `bad_oauth_state` was caused by nginx buffer too small (502 on callback) + stale test states — not a client-side OAuth issue
- Server-side `signInWithOAuth` with `next/headers` cookie setting is fragile in JSON route handlers — browser-side is the right approach for PKCE
- Port 3000 taken by another dev server — 1p-os runs on 3001
