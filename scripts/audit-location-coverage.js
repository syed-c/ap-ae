const fs = require('fs/promises');
const path = require('path');
const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

const DUBAI_AREA_SLUGS = [
  'business-bay',
  'jumeirah',
  'palm-jumeirah',
  'dubai-marina',
  'downtown-dubai',
  'deira',
  'al-barsha',
  'jlt',
  'jumeirah-beach-residence',
  'mirdif',
  'bur-dubai',
  'healthcare-city',
  'difc',
  'jvc',
];

const CITY_ADDRESS_ALIASES = {
  'business-bay': ['Business Bay'],
  'downtown-dubai': ['Downtown Dubai', 'Downtown'],
  'dubai-marina': ['Dubai Marina', 'Marina'],
  'palm-jumeirah': ['Palm Jumeirah', 'The Palm Jumeirah'],
  'bur-dubai': ['Bur Dubai'],
  'jumeirah-beach-residence': ['Jumeirah Beach Residence', 'JBR'],
  jlt: ['JLT', 'Jumeirah Lakes Towers'],
  jvc: ['JVC', 'Jumeirah Village Circle'],
  jvt: ['JVT', 'Jumeirah Village Triangle'],
  difc: ['DIFC', 'Dubai International Financial Centre'],
  'healthcare-city': ['Healthcare City', 'Dubai Healthcare City'],
  'al-nahda-dubai': ['Al Nahda'],
  'al-nahda-sharjah': ['Al Nahda'],
  'al-mamzar-sharjah': ['Al Mamzar'],
  'al-wahda-sharjah': ['Al Wahda'],
  'al-salamah-uaq': ['Al Salamah'],
  'al-nakheel-rak': ['Al Nakheel'],
};

function sanitizeFilterTerm(value) {
  return value.replace(/[%_,]/g, '').trim();
}

function getCityAddressTerms(citySlug, cityName) {
  const aliases = CITY_ADDRESS_ALIASES[citySlug] || [];
  return Array.from(new Set([cityName, ...aliases].map(sanitizeFilterTerm).filter(Boolean)));
}

function buildClinicLocationOrFilter({ cityId, citySlug, cityName, stateName }) {
  const stateTerm = sanitizeFilterTerm(stateName || '');
  const addressClauses = getCityAddressTerms(citySlug, cityName).map((term) =>
    stateTerm
      ? `and(address.ilike.%${term}%,address.ilike.%${stateTerm}%)`
      : `address.ilike.%${term}%`
  );

  return [`city_id.eq.${cityId}`, ...addressClauses].join(',');
}

function createSupabaseClient() {
  loadEnvConfig(process.cwd());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const key = adminKey || anonKey;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables required for location audit.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function auditTopDubaiAreas(supabase) {
  const { data: state } = await supabase
    .from('states')
    .select('id, name, slug')
    .eq('slug', 'dubai')
    .maybeSingle();

  if (!state) {
    throw new Error('Dubai state not found.');
  }

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name, slug')
    .eq('state_id', state.id)
    .in('slug', DUBAI_AREA_SLUGS)
    .order('name');

  const rows = [];
  for (const city of cities || []) {
    const filter = buildClinicLocationOrFilter({
      cityId: city.id,
      citySlug: city.slug,
      cityName: city.name,
      stateName: state.name,
    });

    const [directClinicCount, recoveredClinicCount, pageContentRes, seoRes, serviceSeoRes] = await Promise.all([
      supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('city_id', city.id).eq('is_active', true),
      supabase.from('clinics').select('id', { count: 'exact', head: true }).or(filter).eq('is_active', true),
      supabase
        .from('page_content')
        .select('id, h1, hero_intro, section_1_title, section_2_title, section_3_title')
        .eq('page_type', 'city')
        .in('page_slug', [city.slug, `/${city.slug}`, `dubai/${city.slug}`, `/dubai/${city.slug}`])
        .eq('is_published', true)
        .maybeSingle(),
      supabase
        .from('seo_pages')
        .select('id, h1, page_intro')
        .eq('slug', `dubai/${city.slug}`)
        .order('is_optimized', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('seo_pages')
        .select('slug', { count: 'exact' })
        .eq('page_type', 'service-location')
        .or(`slug.like.%/dubai/${city.slug}/%,slug.like.dubai/${city.slug}/%,slug.like./dubai/${city.slug}/%`)
        .eq('is_published', true),
    ]);

    rows.push({
      slug: city.slug,
      name: city.name,
      directClinicCount: directClinicCount.count || 0,
      recoveredClinicCount: recoveredClinicCount.count || 0,
      fallbackRecovered: (recoveredClinicCount.count || 0) > (directClinicCount.count || 0),
      hasPageContent: !!pageContentRes.data,
      hasSeoPage: !!seoRes.data,
      heroIntro: !!(pageContentRes.data?.hero_intro || seoRes.data?.page_intro),
      bodySectionCount: [pageContentRes.data?.section_1_title, pageContentRes.data?.section_2_title, pageContentRes.data?.section_3_title].filter(Boolean).length,
      serviceLocationSeoCount: serviceSeoRes.count || 0,
      addressTerms: getCityAddressTerms(city.slug, city.name),
    });
  }

  return rows.sort((left, right) => right.recoveredClinicCount - left.recoveredClinicCount);
}

async function buildGlobalSummary(supabase) {
  const [statesRes, clinicsRes, clinicTreatmentsRes] = await Promise.all([
    supabase.from('states').select('id, name, slug').eq('is_active', true).order('name'),
    supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('clinic_treatments').select('id', { count: 'exact', head: true }),
  ]);

  return {
    activeStates: statesRes.data || [],
    activeClinicCount: clinicsRes.count || 0,
    clinicTreatmentRowCount: clinicTreatmentsRes.count || 0,
  };
}

function renderMarkdown({ generatedAt, summary, dubaiAreas }) {
  const summaryLines = [
    '# Location Coverage Report',
    '',
    `Generated: ${generatedAt}`,
    '',
    '## Summary',
    '',
    `- Active emirates: ${summary.activeStates.length}`,
    `- Active clinics: ${summary.activeClinicCount}`,
    `- clinic_treatments rows: ${summary.clinicTreatmentRowCount}`,
    `- Top Dubai areas audited: ${dubaiAreas.length}`,
    '',
    '## Key Findings',
    '',
    `- ${dubaiAreas.filter((row) => row.fallbackRecovered).length} of the audited Dubai areas rely on address fallback recovery beyond direct city_id assignment.`,
    `- ${dubaiAreas.filter((row) => row.serviceLocationSeoCount === 0).length} of the audited Dubai areas have zero published service-location SEO pages in the database.`,
    `- ${dubaiAreas.filter((row) => !row.hasPageContent).length} of the audited Dubai areas are missing published page_content rows.`,
    '',
    '## Top Dubai Areas',
    '',
    '| Area | Direct Clinics | Recovered Clinics | Fallback Needed | Page Content | SEO Page | Hero Intro | Body Sections | Service SEO Pages | Address Terms |',
    '| --- | ---: | ---: | --- | --- | --- | --- | ---: | ---: | --- |',
    ...dubaiAreas.map((row) => `| ${row.name} | ${row.directClinicCount} | ${row.recoveredClinicCount} | ${row.fallbackRecovered ? 'Yes' : 'No'} | ${row.hasPageContent ? 'Yes' : 'No'} | ${row.hasSeoPage ? 'Yes' : 'No'} | ${row.heroIntro ? 'Yes' : 'No'} | ${row.bodySectionCount} | ${row.serviceLocationSeoCount} | ${row.addressTerms.join(', ')} |`),
    '',
    '## Remaining True Gaps',
    '',
    '- `clinic_treatments` is still effectively unavailable for real service-to-clinic accuracy in this environment.',
    '- Most major Dubai area pages currently rely on page_content rather than dedicated seo_pages rows.',
    '- Several high-value Dubai areas still have zero published service-location SEO pages, so city pages must fall back to generic treatment-link generation.',
  ];

  return `${summaryLines.join('\n')}\n`;
}

async function main() {
  const supabase = createSupabaseClient();
  const generatedAt = new Date().toISOString();
  const [summary, dubaiAreas] = await Promise.all([
    buildGlobalSummary(supabase),
    auditTopDubaiAreas(supabase),
  ]);

  const markdown = renderMarkdown({ generatedAt, summary, dubaiAreas });
  const outputPath = path.join(process.cwd(), 'docs', 'location-coverage-report.md');
  await fs.writeFile(outputPath, markdown, 'utf8');
  console.log(`[audit-location-coverage] Wrote report to ${outputPath}`);
}

main().catch((error) => {
  console.error('[audit-location-coverage] Failed:', error);
  process.exit(1);
});
