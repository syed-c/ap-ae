# AppointPanda Setup

## Requirements

- Node.js 20+
- npm 10+
- Supabase project credentials

## Setup

1. Install dependencies.

```sh
npm ci
```

2. Create a local env file from `.env.example`.

3. Fill in:

```sh
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Start development.

```sh
npm run dev
```

## Repository Layout

```txt
pages/                 Next.js route entrypoints
src/pages/             page implementations
src/components/        shared and feature UI
src/lib/               utilities, SEO, server helpers
src/hooks/             client hooks and auth context
public/                static assets and generated sitemaps
supabase/              migrations and edge functions
workers/               Cloudflare worker projects
scripts/               local build and audit scripts
```

## Verification

```sh
npm run typecheck
npm run lint
```

Run `npm run build` only after valid Supabase environment variables are configured.
