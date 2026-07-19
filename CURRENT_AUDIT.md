# AppointPanda — Current-State Audit (Consolidated)

**Date:** 2026-07-19
**Scope:** Reconciles nine prior audit/fix reports in this repo against the actual current code, verifies which of their findings are still real, and fixes the safe, code-level issues found in the process. This is **not** a full pass through the 50-section rebuild brief — see "What this session did not cover" at the end.

This report supersedes, for accuracy purposes: `AUDIT_REPORT.md`, `SEO-AUDIT-REPORT.md`, `DATABASE_CONTENT_AUDIT.md`, `SEO_FIXES_REPORT.md`, `SSG_MIGRATION_COMPLETE.md`, `CMS_FIX_REPORT.md`, `DATA_FIX_REPORT.md`, and the five reports under `Report ap-ae/`. Those files are left in place as history but should not be treated as current.

---

## 1. Critical — unresolved, needs your direct action

### 1.1 The repo's linked Supabase project does not match the live site's data source

This blocked live-data verification this session and is worth fixing before any further data-dependent work.

- `supabase/config.toml`, `supabase/.temp/project-ref`, `vercel.json`, `next.config.js`, and `pages/_document.tsx` (dns-prefetch) all reference project **`eneuthbghipsdvsqilmb`**.
- Two other project refs were supplied during this session as "the" database (`pgqobeklrxuszbzivsdf`, `fcqnxwsjcyvnlpgddpge`) — both queried directly via their REST API with service-role keys, and **neither matches this codebase's schema**. Both are effectively empty and use different table names than the code ever references (e.g. no `dentists`/`cities`/`states` tables in either).
- Fetching `https://www.appointpanda.ae/` directly and reading the embedded clinic data (public by design — these are `NEXT_PUBLIC_*` values and public image URLs) shows most live `coverImageUrl` values actually resolve to **`apztvwpogywvounohqtk.supabase.co`**, with a minority of legacy rows still pointing at `eneuthbghipsdvsqilmb.supabase.co`.

**Read as:** the project most likely migrated from `eneuthbghipsdvsqilmb` to `apztvwpogywvounohqtk` at some point (or vice versa), and the repo's own config files were never fully updated, and/or some clinic image URLs were never re-pointed after the migration.

**Action needed from you:** check the deployed app's actual `NEXT_PUBLIC_SUPABASE_URL` (Vercel project → Settings → Environment Variables is the source of truth, not any file in this repo) and share the credentials for *that* project. Until then, no further live-data verification, migrations, or the price-comparison data-model work can safely proceed — I won't guess at or run schema changes against an unconfirmed database.

**Fixed regardless of the above (safe either way):**
- `next.config.js` — `images.remotePatterns` only whitelisted `eneuthbghipsdvsqilmb.supabase.co`; changed to a `**.supabase.co` wildcard so `next/image` doesn't throw a "hostname not configured" error against either host.
- `pages/_document.tsx` — added a `dns-prefetch` hint for `apztvwpogywvounohqtk.supabase.co` alongside the existing one, since that's the host actually serving most live clinic images.

---

## 2. Fixed this session

| File | Issue | Fix |
|---|---|---|
| `next.config.js` | Image `remotePatterns` didn't match live image host | Wildcarded to `**.supabase.co` |
| `pages/_document.tsx` | `<html lang="en">` — brief requires UAE-specific locale | Changed to `lang="en-AE"` |
| `pages/_document.tsx` | Stale `dns-prefetch` host only | Added the actually-live storage host alongside it |
| `pages/dentist/[dentistSlug].tsx` | Single-dentist fetch (`getStaticProps`) had no `.eq('is_active', true)` — an inactive/departed dentist's slug could still render a full live profile, even though `getStaticPaths` for the same file already filters on it | Added the filter |
| `pages/blog/[postSlug].tsx` | `getStaticPaths` selected **all** blog post slugs regardless of `status`, so unpublished drafts could get pre-rendered as static paths (the single-post fetch already filtered correctly) | Added `.eq('status', 'published')` to the paths query |
| `pages/search.tsx` | Missing `og:locale` (present on most other templates via the shared `SEOHead` component, but `search.tsx` builds its own `<Head>`) | Added `og:locale: en_AE` |
| `src/lib/site-data.ts` (homepage FAQ, real user-facing content) | Three FAQ answers made claims the code doesn't support: *"every clinic has been verified against UAE regulatory licensing databases"* (overstates a real but tiered verification system), *"starred prices (★) are guaranteed for AppointPanda bookings"* (no such feature exists anywhere in the codebase — the only ★ found is unrelated star-rating UI), *"you can switch to Arabic using the toggle in the top bar... fully bilingual"* (no Arabic route, `hreflang=ar-AE`, or language toggle exists anywhere in the codebase) | Rewrote these three answers to describe what actually exists: tiered verification badges, prices as estimates to confirm with the clinic, and English-only for now |
| `pages/index.tsx` | Homepage has a real, visible FAQ section but no matching `FAQPage` JSON-LD | Added `FAQPage` schema built from the same `faqs` array the UI renders, so markup matches visible content exactly (added *after* fixing the FAQ content above — publishing structured data around the false claims would have made them more visible to search engines, not less) |

All changes pass `npm run typecheck` and `next lint` on the touched files (verified after `npm ci --ignore-scripts`, since dependencies weren't installed in this environment and the `supabase` package's postinstall tries to download a CLI binary the sandbox network blocks).

---

## 3. Reconciliation of prior audit reports

Spot-checking their "critical"/"warning" items against current code:

**Already fixed (reports are stale on these):**
- `SEO-AUDIT-REPORT.md` Critical #1 (search.tsx no meta tags) — has full SSR meta, canonical, hreflang, OG/Twitter tags now.
- Critical #2 (services/index.tsx no data fetching) — has `getStaticProps`.
- Critical #3/#4 (emergency-dentist.tsx, about.tsx no meta) — both have full meta.
- Warning #1 (find-dentist.tsx client-side redirect) — confirmed still a client-side `router.replace`, **this one is still open**, see below.
- Warning #2 (blog/index.tsx no robots/schema) — has `robots`, canonical, hreflang, OG.
- Warning #3 (index.tsx missing robots meta) — present via the shared `SEOHead` component that `src/pages/Index.tsx` uses (the audit was checking the thin `pages/index.tsx` wrapper, not the component that actually renders `<Head>`).
- Warning #6 (console.logs in production pages) — none found in `pages/` or `src/pages/` this session; also stripped in production builds via `compiler.removeConsole`.
- Warning #11/#12 (no SearchAction/FAQPage schema on homepage) — `WebSite`+`SearchAction` schema already existed on `pages/index.tsx`; `FAQPage` was genuinely missing and is now added (see above).
- `DATABASE_CONTENT_AUDIT.md`'s claims about `cities`/`states` row counts and `seo_page_id` linkage **could not be verified this session** — no working DB credentials (see §1).

**Already fixed (correcting my own first pass):**
- Warning #1 (`find-dentist.tsx` client-side redirect) — re-checked directly: it already uses a `getServerSideProps` permanent redirect, no client-side `router.replace` anywhere in the file. Stale finding.

**Still open (confirmed real, not yet fixed):**
- `pages/[stateSlug]/index.tsx`, `pages/clinic/[clinicSlug].tsx`, `pages/dentist/[dentistSlug].tsx` all query `seo_pages` without a `.eq('is_published', true)` filter — but this is consistent across **every** `seo_pages` query in the codebase, not an isolated bug in one or two files. I did not blindly patch this: `page_content` queries do filter on `is_published` elsewhere, so the omission on `seo_pages` looks like a deliberate (if debatable) design choice rather than an oversight, and I have no way to confirm the column still exists on the live table without DB access. Needs a decision, not a guess.
- Next.js is pinned at `14.2.3`, which `npm install` itself flags as having a known security vulnerability (patched in 14.2.28+). This is a patch-level bump, not a framework change, so it doesn't conflict with "don't change the framework without reason" — but I did not apply it blind, because I have no way to run a full `next build` or click through the app against real data in this session to confirm nothing regressed. Recommend doing this with either real DB credentials or a staging environment available.
- The repo root and `Report ap-ae/` together carry **13 historical audit/fix markdown reports**, several mutually stale or contradictory (e.g. `AUDIT_REPORT.md` says "no critical issues... production-grade," written before several of the fixes in `SEO_FIXES_REPORT.md` and `SSG_MIGRATION_COMPLETE.md` even happened). Recommend consolidating or archiving them so future audits don't re-derive from stale claims — I left them in place rather than deleting anything without being asked.

---

## 4. What this session did not cover

The pasted brief describes a full platform rebuild — structured price-comparison data model, booking flow redesign, admin moderation tooling, Arabic i18n, review system rules, legal/medical content review, component library work, and more. Almost all of that is either:
- **data-dependent** (needs the correct live database to verify real clinic/price/dentist counts before designing anything, per the brief's own rule against inventing data), or
- **a genuine product/business decision** (pricing model shape, verification tiers, legal wording) that isn't mine to make unilaterally.

This session focused on the audit-reconciliation slice you asked for, plus the safe, verifiable fixes that surfaced along the way. Once the correct Supabase project is confirmed, the logical next steps are: (1) a real data audit against it, (2) the structured price-comparison model (currently `clinic_treatments.price_range` is free text, which is the biggest concrete gap versus the brief's price-transparency requirements), and (3) working through the still-open items in §3.
