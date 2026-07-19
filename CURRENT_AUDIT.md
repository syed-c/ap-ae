# AppointPanda — Current-State Audit (Consolidated)

**Date:** 2026-07-19
**Scope:** Reconciles nine prior audit/fix reports in this repo against the actual current code, verifies which of their findings are still real, and fixes the safe, code-level issues found in the process. Section 0 adds a real audit against the live production database (`eneuthbghipsdvsqilmb.supabase.co`, confirmed correct — see §1), plus the specific data fixes and a dental-relevance search filter implemented after checking each one with the site owner (§0.7). This is **not** a full pass through the 50-section rebuild brief — see "What this session did not cover" at the end.

---

## 0. Live database audit — critical findings

Initially read-only queries against the real database via its REST API with the service-role key. After you confirmed direction on three items, I made the specific writes described in **§0.7** below — everything else in this section remains observation only.

### 0.1 RESOLVED — Most listed "clinics" were not dental businesses

The core positioning ("AppointPanda is a UAE **dental** directory... not a dental clinic... helps users find **dentists and dental clinics**") did not match the underlying data:

- **785 of 1,301 active "clinics" (60%) didn't even have "dent" in their name.** Spot-checked sample: *Aster Clinic, Al Barsha* (its own description says "Internal Medicine, Pediatrics, Dermatology, Dentistry, Orthopedics" — dentistry is one of five departments), *King's Mudon Medical Centre*, *Al Sham Medical Center*, *American Academy of Cosmetic Surgery Hospital*, *Health Call Medical and Aesthetic Center*, *LMC Sharjah*. These read as general medical centers and hospitals pulled from a broad Google Business Profile scrape (`source: "gmb"`, `gmb_data.types` includes `medical_clinic`, `doctor`, `health`), not curated dental practices.
- The homepage's displayed clinic count (`pages/index.tsx` → `clinics` count where `is_active = true`) still has **no dental filter** — that specific number was explicitly left out of scope (see §0.7) and still counts all 1,301.
- This was exactly the failure mode the brief itself warns against ("do not publish empty categories," "do not present itself as a healthcare provider" it isn't, "do not invent clinics"). It wasn't that data was invented — a general-medical GMB scrape was being presented as a dental directory without a dental-relevance filter.

**Fixed:** added `clinics.is_likely_dental` (combined name-keyword + Google category-tag heuristic, 943 flagged dental / 358 flagged non-dental) and wired it into every public search/listing query. Full detail in §0.7. The homepage's numeric "clinics" stat and the sitemap were deliberately left unfiltered — your call, not mine, and not yet made.

### 0.2 CRITICAL — The core price-comparison feature has no underlying data

- `clinic_treatments` (the per-clinic treatment+price junction table) — **0 rows**, despite 1,301 clinics existing.
- `service_price_ranges` — **0 rows**.
- The `clinics` table itself has no treatment/price columns at all (checked its full 46-column schema).
- The only price data anywhere is `seo_pages.price_min/max/currency/note` — page-level, editorial/estimated figures for **76 of 203** SEO pages (e.g. an aggregate "dental implant prices in Dubai" page), not sourced from real per-clinic quotes.

**In short: there is currently no clinic-level, sourced pricing data behind the platform's headline "compare treatment prices" promise.** The brief's price-comparison requirements (§12) — fixed/range/per-unit types, inclusions, last-confirmed dates, per-clinic offers — have nowhere to attach today. This is the single biggest gap versus the brief and needs a real data-sourcing plan (getting clinics to submit prices, or a structured import) before any UI work on price comparison is worth doing.

### 0.3 CRITICAL — Dentist profiles are almost entirely test data

- The `dentists` table has **2 rows total**, both look like test records: "Dr. Syed Rayyan" (`contact@syedrayyan.com`) and "**Dr. Tester**" (`syedrayyan7117@gmail.com`). No bio, specializations, languages, qualifications, or license number populated on either.
- Every dentist-specific feature in the brief (dentist profiles, dentist verification, dentist-level booking) has essentially no real content behind it right now — the platform's real inventory is almost entirely clinic-level (1,301 rows, scraped from Google), not dentist-level.

### 0.4 RESOLVED — Test/dummy record live in production

2 active clinics matched a "test" name search. Checked both in full before touching anything: **"Test #6"** (`source: "list-your-practice"`, zero leads, created via the public onboarding form) was genuine dummy data and has been deactivated (`is_active = false`). **"800DOCTOR - Dubai | Home Nursing, Home IV Infusion, Home Blood Test"** was a false positive — a real (non-dental) GMB listing whose name happens to contain the word "Test" — left untouched; it's now excluded from dental search surfaces by §0.1's fix instead.

### 0.5 RESOLVED — The location-linkage bug from the April `DATABASE_CONTENT_AUDIT.md` was never actually fixed

That report recommended SQL to link `cities`/`states` to `seo_pages` and backfill `clinic_count`/`dentist_count`. Checked directly: **still 0 of 68 cities showed `dentist_count`/`seo_page_id` set, and 0 of 7 states showed `clinic_count > 0`**, months later — the recommendation was written but never applied, and its assumptions were partly wrong (`cities` has no `clinic_count` column at all, only `dentist_count`; the linkage isn't a slug-match as suggested — `seo_pages.city_id`/`state_id` exist as columns but are entirely unpopulated, so I matched on `seo_pages.slug` directly against `{state.slug}/{city.slug}` instead). Backfilled properly this time — see §0.7 for the real numbers, which surfaced a much bigger finding (§0.5b).

### 0.5b CRITICAL (new) — Clinic data is almost entirely Dubai/Sharjah; the other 5 emirates are essentially uncovered

Once real counts existed, the geographic imbalance became stark: **Dubai 1,136 clinics, Sharjah 144, Ajman 2, Abu Dhabi 0, Fujairah 0, Ras Al Khaimah 0, Umm Al Quwain 0.** Abu Dhabi does have real clinics in the dataset (confirmed at least 3, e.g. "Dentacare Centre (Dental & Orthodontics) Hamdan," "Boston Dental Center") but they — along with 15 others — have `city_id = NULL`, so they're geographically orphaned and invisible on any city/emirate page or filtered search. I did not attempt to re-assign these 18 orphaned clinics to cities by parsing their addresses; that's a real data-engineering task, not something to guess at via string matching. A `reassign_clinic_to_nearest_city` RPC already exists in the database (probably built for exactly this) — worth having your team run it or review what it does.

### 0.6 Confirmed accurate / already fine

- `treatments` (35 rows) — legitimate, real dental treatment taxonomy (general dentistry, teeth cleaning, root canal, wisdom teeth removal, etc.), matches the brief's expected list well.
- `google_reviews` — 5,671 real rows, looks properly populated.
- `insurances` (40), `subscription_plans` (4), `blog_posts` (37) — all populated, non-trivially.
- `clinics.claim_status` / `verification_status` — the tiered verification system I described honestly in the FAQ fix (§2) is real and populated (`unclaimed`/`unverified` is in fact the default/common state), confirming that fix was the right call.

### 0.7 Actions taken this session (all confirmed with you first)

1. **Deactivated** the one genuine test clinic record (`Test #6`, `is_active = false`). Reversible.
2. **Added `clinics.is_likely_dental`** (boolean column + partial index, DDL run by you via the SQL Editor since these API keys don't carry schema privileges). Backfilled via a combined heuristic — name contains one of `dent/orthodont/veneer/braces/implant/oral surg/invisalign/root canal/hollywood smile`, OR Google's own `dental_clinic`/`dentist` category tag is present in the imported `gmb_data.types`. Result: **943 flagged dental, 358 flagged non-dental**, out of 1,301 total. Wired into every public search/listing query (main search SSR + client-side, emirate pages, city pages, service-location pages, state-service pages, treatment pages, insurance clinic finder) — see the commit for the full file list. Deliberately **not** wired into the homepage's numeric clinic count, the sitemap, or individual clinic profile pages, per your explicit scope choice.
3. **Backfilled `cities.dentist_count`, `cities.seo_page_id`, `states.dentist_count`, `states.clinic_count`, `states.seo_page_id`** from real current data (real `clinics`/`dentists` counts grouped by location; `seo_page_id` matched by exact slug against the `city`-type rows in `seo_pages`). 46 of 68 cities got a `seo_page_id` match (the other 22 have no corresponding SEO page yet — that's accurate, not a bug). All 7 states matched.

None of these were guessed at — each was confirmed with you before running, and the heuristic/backfill logic and resulting counts are documented here so they're auditable.

This report supersedes, for accuracy purposes: `AUDIT_REPORT.md`, `SEO-AUDIT-REPORT.md`, `DATABASE_CONTENT_AUDIT.md`, `SEO_FIXES_REPORT.md`, `SSG_MIGRATION_COMPLETE.md`, `CMS_FIX_REPORT.md`, `DATA_FIX_REPORT.md`, and the five reports under `Report ap-ae/`. Those files are left in place as history but should not be treated as current.

---

## 1. RESOLVED — Supabase project confirmed

Two prior project refs supplied earlier in this process (`pgqobeklrxuszbzivsdf`, `fcqnxwsjcyvnlpgddpge`) were queried directly and ruled out — both effectively empty, neither matching this codebase's schema. **`eneuthbghipsdvsqilmb`** was then confirmed as correct: it matches every config file in the repo (`supabase/config.toml`, `vercel.json`, `next.config.js`) and its live 127-table schema matches every table the code references (`dentists`, `cities`, `states`, `seo_pages`, `service_price_ranges`, etc.). All of §0's findings and §0.7's actions were run against this project.

One loose end from earlier investigation, not fully explained: the live homepage's embedded clinic image URLs mostly resolve to a *different* host, `apztvwpogywvounohqtk.supabase.co`, with a minority on `eneuthbghipsdvsqilmb.supabase.co`. Possible explanation: storage (images) may live on a separate Supabase project from the database, or this is a leftover from a past migration — either way it doesn't affect data correctness, only image hosting. Not investigated further since it's cosmetic, not a data-integrity issue.

**Fixed regardless:**
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
