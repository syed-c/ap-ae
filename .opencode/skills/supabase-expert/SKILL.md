---
name: supabase-expert
description: Expert Supabase patterns for AppointPanda — correct client usage, RLS awareness, query optimization, edge function patterns, auth integration, and safe migration practices. Load for any database or backend task.
license: MIT
compatibility: opencode
metadata:
  project: appointpanda
  db: supabase-postgres
  functions: 70-plus-edge-functions
---

# Supabase Expert — AppointPanda

## Project Context

- **Instance:** `eneuthbghipsdvsqilmb.supabase.co`
- **Key Tables:** `clinics` (1,172+), `dentists`, `treatments`, `appointments`, `leads`, `cities`, `areas`, `user_roles`, `global_settings`
- **Edge Functions:** 70+ deployed functions
- **Auth:** Email/Password + Google OAuth + GMB OAuth
- **Roles:** `super_admin`, `district_manager`, `seo_team`, `content_team`, `marketing_team`, `support_team`, `dentist`, `patient`

---

## Client Setup Rules

### Use the Correct Client for the Context

```typescript
// For SSG/getStaticProps — use service role (bypasses RLS, reads all data)
// ONLY in server-side contexts (getStaticProps, getStaticPaths, API routes)
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // never expose this to browser
)

// For client-side — use anon key (respects RLS)
import { supabase } from '@/lib/supabaseClient'
```

### Never expose SERVICE_ROLE_KEY to the browser
- `NEXT_PUBLIC_*` variables are bundled into the client build
- `SUPABASE_SERVICE_ROLE_KEY` must never start with `NEXT_PUBLIC_`
- Service role client ONLY in: `getStaticProps`, `getStaticPaths`, `pages/api/*` routes

---

## Query Patterns

### Always select specific columns — never `select('*')` in production
```typescript
// CORRECT — explicit columns, predictable payload
const { data, error } = await supabase
  .from('clinics')
  .select('id, slug, name, area, emirate, avg_rating, review_count, is_active')
  .eq('is_active', true)
  .order('ranking_score', { ascending: false })

// WRONG — over-fetches all columns including blobs/large text
const { data } = await supabase.from('clinics').select('*')
```

### Always check error before using data
```typescript
const { data: clinic, error } = await supabase
  .from('clinics')
  .select('id, slug, name')
  .eq('slug', slug)
  .single()

if (error) {
  console.error('[getStaticProps] Failed to fetch clinic:', { slug, error })
  return { notFound: true }
}

if (!clinic) return { notFound: true }
// Now safe to use clinic
```

### Pagination for large tables
```typescript
// clinics table has 1,172+ rows — always paginate
const PAGE_SIZE = 50

const { data, count } = await supabase
  .from('clinics')
  .select('id, slug, name', { count: 'exact' })
  .eq('is_active', true)
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
```

---

## getStaticPaths — Fetching All Slugs

```typescript
export const getStaticPaths: GetStaticPaths = async () => {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch only the slug column — nothing else needed
  const { data: clinics, error } = await supabaseAdmin
    .from('clinics')
    .select('slug')
    .eq('is_active', true)

  if (error) {
    console.error('[getStaticPaths] Failed to fetch clinic slugs:', error)
    // Return empty paths with blocking fallback — pages will render on demand
    return { paths: [], fallback: 'blocking' }
  }

  const paths = (clinics ?? []).map(c => ({
    params: { clinicSlug: c.slug }
  }))

  return { paths, fallback: 'blocking' }
}
```

---

## RLS Awareness

Row-Level Security is enabled on sensitive tables. Know which client to use:

| Table | Anon Client | Service Role Client |
|-------|------------|-------------------|
| clinics (public data) | ✅ Can read active | ✅ Can read all |
| appointments | ❌ Restricted | ✅ Full access |
| user_roles | ❌ Restricted | ✅ Full access |
| global_settings | ❌ Restricted | ✅ Full access |
| leads | ❌ Restricted | ✅ Full access |

When a query returns unexpectedly empty results, RLS is the first suspect.

---

## Auth Patterns

### Check auth in client components
```typescript
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

const [user, setUser] = useState<User | null>(null)

useEffect(() => {
  supabase.auth.getUser().then(({ data }) => setUser(data.user))
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })
  return () => listener.subscription.unsubscribe()
}, [])
```

### Role checking pattern
```typescript
// Check role from user_roles table
const { data: roleData } = await supabase
  .from('user_roles')
  .select('role')
  .eq('user_id', user.id)
  .single()

const isSuperAdmin = roleData?.role === 'super_admin'
const isSeoTeam = roleData?.role === 'seo_team'
```

---

## Edge Function Calling Pattern

```typescript
// Call Supabase edge function from client
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { param1: value1, param2: value2 }
})

if (error) {
  console.error('[FunctionName] Edge function error:', error)
  throw new Error(`Edge function failed: ${error.message}`)
}
```

### Key Edge Functions Reference
| Function | Purpose |
|----------|---------|
| `send-booking-email` | Booking confirmation + status updates |
| `send-appointment-notification` | SMS via Twilio |
| `admin-send-password-reset` | Password reset email |
| `ai-search` | Natural language clinic search |
| `gmb-import` | Google Business Profile import |
| `content-generation-studio` | AI clinic description generation |
| `stripe-webhook` | Payment events |

---

## Migration Safety Rules

- **Never run raw SQL directly on production** — always create a migration file in `supabase/migrations/`
- Migration filename format: `{timestamp}_{description}.sql`
- Always test migrations on a branch/staging first
- For `ALTER TABLE` on large tables (clinics = 1,172+ rows), be aware of lock duration
- Always add `IF NOT EXISTS` / `IF EXISTS` guards to migrations
- Never drop columns without first confirming no code references them

```sql
-- Safe migration pattern
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS meta_title TEXT;

-- Index with naming convention
CREATE INDEX IF NOT EXISTS idx_clinics_emirate_area
  ON clinics(emirate_slug, area_slug)
  WHERE is_active = TRUE;
```

---

## Performance Rules

- For `getStaticPaths`, always select only the `slug` column — not full rows.
- For listing pages, never fetch more than 100 rows at once without pagination.
- Use `.single()` when you expect exactly one result — it errors correctly on 0 or 2+ results.
- Use `.maybeSingle()` when 0 results is valid and you don't want an error.
- Always add `.eq('is_active', true)` filter on clinics unless you specifically need inactive records.
