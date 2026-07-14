# AppointPanda

AppointPanda is a UAE dental marketplace built with `Next.js 14` Pages Router, `Supabase`, `React Query`, and `Tailwind CSS`.

## Stack

- `Next.js 14` with route entrypoints in `pages/`
- page implementations in `src/pages/`
- shared UI in `src/components/`
- Supabase clients and utilities in `src/lib/` and `src/integrations/supabase/`
- Supabase Edge Functions in `supabase/functions/`
- an auxiliary Cloudflare Worker in `workers/page-content-generator/`

## Local Development

1. Install dependencies:

```sh
npm ci
```

2. Create a local env file from `.env.example`.

Required variables:

```sh
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

3. Start the app:

```sh
npm run dev
```

## Commands

```sh
npm run dev
npm run lint
npm run typecheck
npm run build
npm run start
```

## Notes

- `npm run build` generates sitemap files before the Next.js production build.
- Protected dashboard pages rely on Supabase auth cookies and user roles from `user_roles`.
- Do not commit real `.env` values, auth dumps, or generated local artifacts.
