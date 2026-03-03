# AppointPanda - Product Requirements Document

## Original Problem Statement
Comprehensive audit and enhancement of a Next.js and Supabase-based dental clinic directory platform called "AppointPanda".

## Project Architecture
```
/app/
├── pages/           # Next.js pages (routes) - including /admin, /dashboard
├── src/
│   ├── components/  # React components (admin/tabs/, dentist/, ui/)
│   ├── hooks/       # Custom React hooks
│   ├── lib/         # Utilities and constants
│   └── integrations/# Supabase client
├── supabase/
│   ├── functions/   # 70+ Deno edge functions
│   └── migrations/  # Database schema
└── public/          # Static assets
```

## Tech Stack
- **Frontend**: Next.js 14 (Pages Router), React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase Edge Functions (Deno/TypeScript)
- **Database**: Supabase (PostgreSQL)
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth
- **Email**: Resend
- **AI**: AIMLAPI (Gemini 2.0 Flash)

## Required API Keys (Supabase Secrets)
| Key | Value | Purpose |
|-----|-------|---------|
| AIMLAPI_KEY | 48c16010b8fb429c9e971b29c986d808 | AI content generation (FAQ Studio, Content Studio) |
| RESEND_API_KEY | re_buZ9bQ8a_BEmkMiXx6z7KBVxcT9vDSaFa | Email notifications |

## Current Status

### ✅ Completed
- [x] Project environment setup
- [x] Application running and previewable
- [x] High-level architecture audit
- [x] Identified root cause of admin tab errors (missing Supabase secrets)
- [x] **UI/UX Font Changes**: Updated fonts from `DM Sans/Quicksand` to `Nunito/Plus Jakarta Sans` (round, bold, modern style)
  - Updated: `/app/tailwind.config.ts`
  - Updated: `/app/src/index.css`
  - Updated: `/app/pages/_document.tsx` (Google Fonts)
  - Updated: All page components with hardcoded font references
- [x] **Popular Areas Section**: Expanded from 12 to 36+ areas across all 7 Emirates
  - Dubai: 20 areas (Jumeirah, Marina, Downtown, DIFC, JBR, Palm Jumeirah, etc.)
  - Abu Dhabi: 6 areas (Khalidiyah, Reem Island, Corniche, Yas Island, etc.)
  - Sharjah: 4 areas (Al Nahda, Al Majaz, Al Qasimia, Muwaileh)
  - Other Emirates: Ajman, RAK, Fujairah, UAQ
  - Areas now grouped by emirate for better navigation
- [x] **GitHub Push Fix**: Removed large CSV files from git history (reduced .git from 29MB to 5MB)
- [x] **Fixed Ranking Rules Tab**: Resolved "Element type is invalid" error by fixing icon serialization when loading from database
- [x] **FAQ Studio**: Verified working - UI loads correctly with page selection and generation settings
- [x] **Content Studio**: Verified working - UI loads correctly with state setup and page selection engine

### 🟠 P1 - High Priority (Next)
- [ ] Implement appointment reminder system (24hr and 1hr before)
- [ ] Test email notifications (booking confirmations, dentist alerts)
- [ ] End-to-end test of FAQ generation with actual AI call
- [ ] End-to-end test of Content generation with actual AI call

### 🟡 P2 - Medium Priority
- [ ] End-to-end flow testing (Admin, Dentist, Patient perspectives)
- [ ] Full admin panel audit

### 🔵 P3 - Low Priority
- [ ] Deep audit of all 80+ admin tabs
- [ ] Address TypeScript strictNullChecks configuration
- [ ] Validate ranking rules application on frontend

## Key Admin Tab Components
1. **RankingRulesTab** (`/src/components/admin/tabs/RankingRulesTab.tsx`)
   - Manages clinic ranking weights and boosts
   - Queries: `global_settings`, `clinics`, `cities` tables
   
2. **FAQGenerationStudioTab** (`/src/components/admin/tabs/FAQGenerationStudioTab.tsx`)
   - AI-powered FAQ generation
   - Calls: `faq-generation-studio` edge function
   - Requires: AIMLAPI_KEY
   
3. **ContentGenerationStudioTab** (`/src/components/admin/tabs/ContentGenerationStudioTab.tsx`)
   - AI content generation (1500+ words)
   - Calls: `content-generation-studio` edge function
   - Requires: AIMLAPI_KEY

## Admin Credentials
- Email: adilahmadip@gmail.com
- Password: aDIL@8899

## Important URLs
- Supabase Project: https://eneuthbghipsdvsqilmb.supabase.co
- Supabase Dashboard: https://supabase.com/dashboard/project/eneuthbghipsdvsqilmb

## Notes
- All AI features use AIMLAPI to access Gemini 2.0 Flash model
- Edge functions are deployed to Supabase (not running locally)
- Secrets must be configured in Supabase Dashboard → Edge Functions → Secrets

---
Last Updated: March 3, 2026
