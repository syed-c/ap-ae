---
name: nextjs-expert
description: Expert-level Next.js 14 Pages Router patterns for AppointPanda — TypeScript, Tailwind, shadcn/ui, TanStack Query, React Hook Form, Zod, SSG/ISR, Vercel deployment. Load for any frontend or page work.
license: MIT
compatibility: opencode
metadata:
  project: appointpanda
  stack: next14-pages-ts-tailwind-supabase
---

# Next.js Expert — AppointPanda Stack

## Project Stack
- **Framework:** Next.js 14.2.x — Pages Router (NOT App Router)
- **Language:** TypeScript 5 — strict mode target
- **Styling:** Tailwind CSS 3 + tailwind-merge + tailwindcss-animate
- **Components:** shadcn/ui (Radix UI primitives)
- **Data Fetching:** TanStack Query v5 (React Query)
- **Forms:** React Hook Form v7 + Zod v3
- **Database:** Supabase (client: `@supabase/supabase-js`)
- **Animation:** Framer Motion
- **Deployment:** Vercel

---

## Pages Router Rules

### ALWAYS use Pages Router patterns — never App Router
```typescript
// CORRECT — pages/ directory structure
// pages/clinic/[clinicSlug].tsx
// pages/[stateSlug]/[citySlug]/index.tsx

// WRONG — never use these in this project
// app/clinic/[clinicSlug]/page.tsx
// 'use client' directive
// Next.js 13+ metadata API
```

### Page File Template
```typescript
import type { GetStaticProps, GetStaticPaths, NextPage } from 'next'
import Head from 'next/head'

interface Props {
  clinic: Clinic
}

const ClinicPage: NextPage<Props> = ({ clinic }) => {
  return (
    <>
      <Head>
        <title>{clinic.name} | AppointPanda</title>
        <meta name="description" content={clinic.metaDescription} />
      </Head>
      {/* page content */}
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  // fetch all slugs from Supabase
  return { paths, fallback: 'blocking' }
}

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.clinicSlug as string
  // fetch data
  if (!data) return { notFound: true }
  return { props: { clinic: data }, revalidate: 3600 }
}

export default ClinicPage
```

---

## SSG / ISR Strategy

This project is migrating from SSR + Prerender.io to pure SSG/ISR.

### Rules for Dynamic Routes
```typescript
// Always use fallback: 'blocking' for large datasets (clinics, areas)
// Use fallback: false only for small static sets (a handful of pages)
export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: slugs.map(s => ({ params: { clinicSlug: s } })),
    fallback: 'blocking'  // renders on first request, then caches
  }
}

// Always add revalidate for ISR — never stale forever
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: { ... },
    revalidate: 3600  // revalidate every 1 hour
  }
}
```

### notFound handling
```typescript
// Always return notFound for missing records
if (!clinic) return { notFound: true }
// Never throw or return empty props — that causes blank pages
```

---

## TanStack Query v5 Patterns

```typescript
// Client-side data (user-specific, real-time)
const { data, isLoading, error } = useQuery({
  queryKey: ['clinic', clinicId],
  queryFn: () => fetchClinic(clinicId),
  staleTime: 5 * 60 * 1000,  // 5 minutes
})

// Mutations
const mutation = useMutation({
  mutationFn: updateClinic,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clinic', clinicId] })
    toast.success('Clinic updated')
  },
  onError: (error) => {
    toast.error(`Failed to update: ${error.message}`)
  }
})
```

---

## React Hook Form + Zod Pattern

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+971\d{9}$/, 'Must be a UAE phone number'),
})

type FormData = z.infer<typeof schema>

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
  resolver: zodResolver(schema)
})
```

---

## Tailwind + shadcn/ui Rules

```typescript
// Use cn() utility for conditional classes — always
import { cn } from '@/lib/utils'

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  variant === 'outline' && 'outline-classes'
)} />

// Use shadcn components from @/components/ui/
// Never rebuild what shadcn already provides
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
```

---

## Import Path Rules

```typescript
// Use @/ alias for all internal imports
import { supabase } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import type { Clinic } from '@/types/clinic'

// Never use relative paths from pages/ directory
// WRONG: import { supabase } from '../../lib/supabaseClient'
```

---

## Component Rules

- All components are functional. No class components.
- Extract reusable UI into `src/components/`.
- Page-specific components live in the same folder as the page or in a co-located `components/` subfolder.
- Never fetch data inside a component that receives it via props — respect the data flow boundary.
- Keep components under 200 lines. Extract sub-components if longer.

---

## Vercel Deployment Rules

- `next.config.js` controls build behavior — do not add `ignoreBuildErrors: true` for new code.
- Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser — never put secrets there.
- Use `vercel.json` for rewrites/redirects — check existing rules before adding new ones.
- ISR revalidation happens automatically on Vercel — `revalidate` seconds is sufficient for most pages.
