# Settings — Blueprint

**Routes**: `/settings`, `/settings/safety`, `/settings/keys`, `/settings/models`
**Status**: Working — 90% backend integration

## Settings Main (5 tabs)

### Business Tab — Working
- Business name, entity type, industry, timezone, currency
- API: `/api/context` (GET/PATCH)

### Security Tab — Working
- Daily/monthly budget sliders
- Alert threshold
- Circuit breaker toggle + threshold
- Pending approvals (approve/deny)
- Devices panel (mock data)
- Kill switch button
- API: `/api/safety/budget`, `/api/security/approvals`

### Models Tab — Working
- Strategy selector (Quality/Balanced/Savings)
- Estimated costs per strategy
- API: `/api/efficiency/routing` (GET/PATCH)

### API Keys Tab — Working
- Environment variable status display
- Lists configured vs missing keys
- API: `/api/context`

### Usage Tab — Working
- Monthly API calls, tokens, total cost
- Per-agent breakdown table
- API: `/api/safety/budget`

## Sub-Pages

### /settings/safety — Working
- Budget limits (daily/monthly inputs)
- Alert threshold slider
- Circuit breaker toggle
- Data from Supabase `safety_config` table

### /settings/keys — Working
- Infrastructure mode selector (Cloud vs BYOK)
- ApiKeySetup component (46 LLM providers, voice, image, video, music, search)
- Encrypted key storage

### /settings/models — Working
- Strategy picker with cost estimates
- Task routing breakdown table
- Strategy comparison table
- API: `/api/efficiency/routing`

## What Could Be Improved

1. **Devices panel**: Wire to real device tracking
2. **Real-time usage**: Live cost ticker
3. **Notification preferences**: Email/Slack alerts for budget thresholds
4. **Team management**: Multiple users with roles
5. **Billing**: Stripe integration for hosted version
