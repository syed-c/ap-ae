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

### 🔴 P0 - Critical (Blocked on Supabase Configuration)
- [ ] Configure AIMLAPI_KEY in Supabase Dashboard
- [ ] Configure RESEND_API_KEY in Supabase Dashboard
- [ ] FAQ Studio functionality
- [ ] Content Studio functionality

### 🟠 P1 - High Priority
- [ ] Verify Ranking Rules tab functionality
- [ ] Implement appointment reminder system (24hr and 1hr before)
- [ ] Test email notifications (booking confirmations, dentist alerts)

### 🟡 P2 - Medium Priority
- [ ] Change global font style
- [ ] Update homepage "Popular Areas" to show only Dubai locations
- [ ] End-to-end flow testing (Admin, Dentist, Patient perspectives)

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

## Important URLs
- Supabase Project: https://eneuthbghipsdvsqilmb.supabase.co
- Supabase Dashboard: https://supabase.com/dashboard/project/eneuthbghipsdvsqilmb

## Notes
- All AI features use AIMLAPI to access Gemini 2.0 Flash model
- Edge functions are deployed to Supabase (not running locally)
- Secrets must be configured in Supabase Dashboard → Edge Functions → Secrets

---
Last Updated: March 3, 2026
