# AppointPanda Status

This file is a lightweight reference, not a runtime health source.

## Current Architecture

- `Next.js 14` Pages Router app
- `Supabase` for auth, data, storage, and edge functions
- `React Query` for client-side caching
- `Vercel` deployment config in `vercel.json`
- separate `Cloudflare Worker` under `workers/page-content-generator/`

## Core App Areas

- public SEO pages for emirates, cities, services, clinics, dentists, insurance, and blog
- protected admin and practice dashboards
- booking, review, onboarding, and Google Business flows

## Verification Commands

```sh
npm run typecheck
npm run lint
```

## Security Notes

- keep real credentials in local-only env files
- do not commit auth dumps or exported tokens
- rotate any credential that was previously committed or shared
