# AGENTS.md - AppointPanda Developer Guide

## Essential Commands

```bash
npm run dev      # Start dev server (port 3000)
npm run build   # Production build (SSG/ISR pages)
npm run lint   # Lint code
npm run start  # Start production server
```

## Architecture - Next.js 14 Pages Router + Supabase

- **Pages directory**: `pages/` - SSR/SSG entrypoints (getStaticProps, getServerSideProps)
- **Components**: `src/pages/*.tsx` - Actual page components that receive props
- **Data layer**: `src/lib/supabaseServer.ts` - Server-side Supabase clients
  - `createServerSupabase()` - Uses anon key (RLS applies)
  - `createServerSupabaseAdmin()` - Uses service role key (bypasses RLS)
- **Client hooks**: `src/hooks/*.ts` - Client-side React Query hooks use `supabase` (anon key) from `@/integrations/supabase/client` — do NOT use service role key client-side

## Critical Pattern: Props Must Flow to Components

When adding data fetching in `getStaticProps` (pages/*.tsx), the fetched data MUST be passed to the component:

```tsx
// Wrong - data fetched but never used!
<Component prop1={val} />

// Correct - ALL fetched props passed through
<Component prop1={val} serverDataProp={serverData} />
```

The interface in the component (`src/pages/*.tsx`) must also declare these props.

## Supabase Access Pattern

All server-side data fetching for SSG build (especially SSG/ISR pages) MUST use `createServerSupabaseAdmin()` to bypass RLS and speed up builds. Do not use `createServerSupabase()` for build-time data fetching.

## Env Variables Required

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only, for admin queries — do NOT use NEXT_PUBLIC_ prefix)

## Testing Changes

After any data layer or component prop changes, verify with:
```bash
npm run build
```

Build output shows generated static pages and timing - check for errors.

## Skills Available

The repo has custom skills in `.opencode/skills/`:
- `elite-coder` - Principal engineer mindset
- `nextjs-expert` - Next.js 14 Pages Router patterns
- `seo-expert` - UAE dental marketplace SEO
- `supabase-expert` - Supabase patterns
- `problem-detective` - Bug detection

Use `skill` tool to load domain-specific guidance.