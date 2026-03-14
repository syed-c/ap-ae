# SSG Migration Plan

## Files to Modify:

### Dynamic Routes (Convert SSR → SSG):
1. `/pages/[stateSlug]/index.tsx` - Emirate pages
2. `/pages/[stateSlug]/[citySlug]/index.tsx` - Area pages  
3. `/pages/[stateSlug]/[citySlug]/[serviceSlug].tsx` - Area-service pages
4. `/pages/services/[serviceSlug].tsx` - Service pages
5. `/pages/clinic/[clinicSlug].tsx` - Clinic pages
6. `/pages/blog/[postSlug].tsx` - Blog posts

### Remove Prerender References:
- `/src/hooks/usePrerenderReady.ts` - DELETE
- `/supabase/functions/serve-static/index.ts` - Remove prerender logic
- All page components using `usePrerenderReady` - Remove hook calls

### Update Terminology:
- Display "Emirates" instead of "States"
- Display "Areas" instead of "Cities"
- DB columns stay the same

## Implementation Strategy:

For each dynamic route:
```typescript
// Add getStaticPaths to generate all possible paths at build time
export async function getStaticPaths() {
  // Fetch all possible values from DB
  // Return paths array
  return {
    paths: [...],
    fallback: 'blocking' // or false for stricter control
  }
}

// Convert getServerSideProps to getStaticProps
export async function getStaticProps(context) {
  // Same data fetching logic
  // Add revalidate for ISR
  return {
    props: { ... },
    revalidate: 3600 // 1 hour
  }
}
```

## Key Benefits:
- No more "Loading..." states indexed
- All pages pre-generated at build time
- Instant page loads
- No Prerender.io costs
- Full control over what gets indexed
