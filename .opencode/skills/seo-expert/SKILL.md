---
name: seo-expert
description: Expert SEO for AppointPanda — UAE dental marketplace. Covers SSG/ISR for crawlability, Next.js meta tags, JSON-LD structured data, canonical URLs, sitemap, local SEO for UAE emirates/areas, and bot detection architecture. Load for any SEO or page-visibility task.
license: MIT
compatibility: opencode
metadata:
  project: appointpanda
  market: uae-dental
  domain: appointpanda.ae
---

# SEO Expert — AppointPanda UAE Dental Marketplace

## Project SEO Context

- **Domain:** AppointPanda.ae
- **Market:** UAE — Dubai, Abu Dhabi, Sharjah + 7 Emirates, 69 Areas
- **Business:** Dental clinic directory + appointment booking SaaS
- **Data:** 1,172+ clinics, 250+ dentists, 50+ treatments, 30+ cities, 69 areas
- **Current Architecture:** Migrating from SSR + Prerender.io → pure SSG/ISR
- **Deployment:** Vercel (edge network)

---

## Core SEO Architecture

### The Golden Rule
**Indexable pages MUST always return `index, follow`.** Never serve `noindex` to Googlebot for public clinic, dentist, service, or location pages. This is enforced at multiple levels.

### Indexable Page Types
```
/                          → homepage
/find-dentist              → search page
/clinic/[clinicSlug]       → clinic profiles (1,172+)
/dentist/[dentistSlug]     → dentist profiles
/services/[serviceSlug]    → treatment pages
/[stateSlug]               → emirate pages (Dubai, Abu Dhabi, etc.)
/[stateSlug]/[citySlug]    → area pages (69 areas)
/[stateSlug]/[citySlug]/[serviceSlug] → area+service pages
/blog/[postSlug]           → blog posts
/insurance/[insuranceSlug] → insurance pages
```

### Non-Indexable Pages (must have noindex)
```
/admin/*      → admin dashboard
/dashboard/*  → dentist dashboard
/auth/*       → login/signup
/appointment/[token] → private booking management
/tools/*      → patient tools (confirm with team)
```

---

## Head / Meta Tags Pattern

Every indexable page must implement all of these:

```typescript
import Head from 'next/head'

// In page component
<Head>
  {/* Primary */}
  <title>{pageTitle} | AppointPanda UAE</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={`https://appointpanda.ae${canonicalPath}`} />
  <meta name="robots" content="index, follow" />

  {/* Open Graph */}
  <meta property="og:title" content={pageTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={`https://appointpanda.ae${canonicalPath}`} />
  <meta property="og:type" content="website" />
  <meta property="og:image" content={ogImage ?? 'https://appointpanda.ae/og-default.jpg'} />
  <meta property="og:site_name" content="AppointPanda UAE" />
  <meta property="og:locale" content="en_AE" />

  {/* Twitter */}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={pageTitle} />
  <meta name="twitter:description" content={metaDescription} />
  <meta name="twitter:image" content={ogImage ?? 'https://appointpanda.ae/og-default.jpg'} />
</Head>
```

### Title Formulas by Page Type
```
Clinic:    "[Clinic Name] - Dental Clinic in [Area], [Emirate] | AppointPanda"
Dentist:   "Dr. [Name] - Dentist in [Area], [Emirate] | AppointPanda"
Service:   "[Treatment] in [Area], [Emirate] | Find Dentists | AppointPanda"
Emirate:   "Best Dentists in [Emirate], UAE | AppointPanda"
Area:      "Dentists in [Area], [Emirate] | Book Appointment | AppointPanda"
Homepage:  "Find Dentists in UAE | Book Dental Appointments | AppointPanda"
Blog:      "[Post Title] | AppointPanda Dental Blog"
```

### Description Formulas
- 140-160 characters max
- Include target location (area + emirate)
- Include primary action (book, find, compare)
- Include trust signal (1,172+ clinics, verified, etc.)

```
Clinic:  "Book appointments at [Clinic Name] in [Area], [Emirate]. [Specialty]. View treatments, reviews & availability. Verified on AppointPanda."
Area:    "Find and book dentists in [Area], [Emirate]. Browse [N]+ verified dental clinics. Compare prices, read reviews & book online."
```

---

## JSON-LD Structured Data

### Clinic Page (LocalBusiness + Dentist)
```typescript
const structuredData = {
  "@context": "https://schema.org",
  "@type": ["LocalBusiness", "Dentist"],
  "name": clinic.name,
  "description": clinic.description,
  "url": `https://appointpanda.ae/clinic/${clinic.slug}`,
  "telephone": clinic.phone,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": clinic.address,
    "addressLocality": clinic.area,
    "addressRegion": clinic.emirate,
    "addressCountry": "AE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": clinic.lat,
    "longitude": clinic.lng
  },
  "aggregateRating": clinic.reviewCount > 0 ? {
    "@type": "AggregateRating",
    "ratingValue": clinic.avgRating,
    "reviewCount": clinic.reviewCount
  } : undefined,
  "openingHours": clinic.openingHours,
  "image": clinic.photos?.[0] ?? undefined,
  "priceRange": clinic.priceRange ?? "$$"
}

// In <Head>:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
/>
```

### Location/Area Page (BreadcrumbList + ItemList)
```typescript
const breadcrumbData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://appointpanda.ae" },
    { "@type": "ListItem", "position": 2, "name": emirateName, "item": `https://appointpanda.ae/${emirateSlug}` },
    { "@type": "ListItem", "position": 3, "name": areaName, "item": `https://appointpanda.ae/${emirateSlug}/${areaSlug}` }
  ]
}
```

---

## Canonical URL Rules

- Every page has exactly one canonical URL.
- Canonical always uses `https://appointpanda.ae` (no www).
- For paginated listings: canonical points to page 1 (no `?page=2` in canonical).
- No trailing slashes in canonical except homepage.
- For filtered/sorted views: canonical is the base URL without query params.

```typescript
// Build canonical correctly
const canonical = `https://appointpanda.ae/clinic/${clinic.slug}`
// NOT: https://www.appointpanda.ae/clinic/...
// NOT: https://appointpanda.ae/clinic/${slug}?ref=search
// NOT: https://appointpanda.ae/clinic/${slug}/
```

---

## UAE Local SEO Rules

### Emirate/Area Naming
- Use "Emirates" in UI, not "States" (ongoing migration)
- Use "Areas" in UI, not "Cities"
- DB columns remain as `state_slug`, `city_slug` — do NOT rename them
- Display names: "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"

### Geo Targeting
- All clinic pages must include UAE country code `"AE"` in schema
- Phone numbers in schema should use `+971` format
- Currency reference: `AED` if price info included

### Location Page Strategy
- Each of the 69 areas gets its own indexed page at `/[emirateSlug]/[areaSlug]`
- Each area + treatment combination gets `/[emirateSlug]/[areaSlug]/[serviceSlug]`
- These are high-value local SEO pages — they must all have unique meta descriptions

---

## Sitemap Rules

- `public/sitemap.xml` or dynamic via `/pages/sitemap.xml.tsx` using `getServerSideProps`
- Include: all clinic pages, all area pages, all service pages, all blog posts
- Exclude: /admin, /dashboard, /auth, /appointment
- Set `<changefreq>weekly</changefreq>` for clinic pages, `monthly` for static pages
- Set `<priority>0.9</priority>` for clinic pages, `0.7` for area pages, `0.5` for blog

---

## robots.txt Rules

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /dashboard
Disallow: /auth
Disallow: /appointment
Sitemap: https://appointpanda.ae/sitemap.xml
```

---

## SSG for SEO — Critical Rules

1. **Never return a loading state for bot-visible content.** All clinic data must be in HTML from `getStaticProps`, not fetched client-side.
2. **`fallback: 'blocking'`** — new clinics render on first request and are cached. No blank pages ever.
3. **`revalidate: 3600`** — clinic pages revalidate every hour. Balance freshness vs build cost.
4. **Remove `usePrerenderReady`** during SSG migration — it is no longer needed when using `getStaticProps`.
5. **Test with `curl -A Googlebot [url]`** to verify HTML contains full content, not a loading shell.

---

## SEO Anti-Patterns to Avoid

- Never add `noindex` to public clinic/dentist/service/location pages
- Never use client-side routing for the initial page title/description (must be in SSG output)
- Never duplicate meta descriptions across pages — each must be unique
- Never leave `<title>` as the app default on all pages
- Never omit canonical links — duplicate content risk is real with area+service combos
- Never put session-dependent content (user name, login state) in `getStaticProps`
