const fs = require('fs/promises');
const path = require('path');
const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'https://www.appointpanda.ae';
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SITEMAP_FILES = [
  'sitemap.xml',
  'sitemap-static.xml',
  'sitemap-states.xml',
  'sitemap-cities.xml',
  'sitemap-services.xml',
  'sitemap-service-locations.xml',
  'sitemap-profiles.xml',
  'sitemap-posts.xml',
  'sitemap-insurance.xml',
];

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeUrl(routePath) {
  let cleanPath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  cleanPath = cleanPath.replace(/\/+/g, '/');

  if (cleanPath !== '/' && !cleanPath.endsWith('/')) {
    cleanPath = `${cleanPath}/`;
  }

  return `${BASE_URL}${cleanPath}`;
}

function generateSitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

function generateSitemapIndexXml() {
  const today = new Date().toISOString().split('T')[0];
  const sitemapEntries = SITEMAP_FILES.filter((name) => name !== 'sitemap.xml');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map((name) => `  <sitemap>
    <loc>${BASE_URL}/${name}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
}

async function fetchAll(supabase, table, select, filters = {}) {
  const rows = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    let query = supabase.from(table).select(select).range(offset, offset + limit - 1);

    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch ${table}: ${error.message}`);
    }

    if (!data || data.length === 0) {
      break;
    }

    rows.push(...data);

    if (data.length < limit) {
      break;
    }

    offset += limit;
  }

  return rows;
}

function buildStaticUrls() {
  return [
    { loc: normalizeUrl('/'), priority: 1.0, changefreq: 'daily' },
    { loc: normalizeUrl('/services'), priority: 0.9, changefreq: 'weekly' },
    { loc: normalizeUrl('/specialties'), priority: 0.9, changefreq: 'weekly' },
    { loc: normalizeUrl('/emirates'), priority: 0.9, changefreq: 'weekly' },
    { loc: normalizeUrl('/insurance'), priority: 0.8, changefreq: 'weekly' },
    { loc: normalizeUrl('/blog'), priority: 0.8, changefreq: 'daily' },
    { loc: normalizeUrl('/find-clinics'), priority: 0.8, changefreq: 'weekly' },
    { loc: normalizeUrl('/for-clinics'), priority: 0.7, changefreq: 'weekly' },
    { loc: normalizeUrl('/reviews'), priority: 0.7, changefreq: 'weekly' },
    { loc: normalizeUrl('/emergency'), priority: 0.7, changefreq: 'weekly' },
    { loc: normalizeUrl('/about'), priority: 0.5, changefreq: 'monthly' },
    { loc: normalizeUrl('/contact'), priority: 0.5, changefreq: 'monthly' },
    { loc: normalizeUrl('/faq'), priority: 0.6, changefreq: 'monthly' },
    { loc: normalizeUrl('/how-it-works'), priority: 0.6, changefreq: 'monthly' },
    { loc: normalizeUrl('/pricing'), priority: 0.6, changefreq: 'monthly' },
    { loc: normalizeUrl('/sitemap'), priority: 0.4, changefreq: 'weekly' },
    { loc: normalizeUrl('/emergency-dentist'), priority: 0.8, changefreq: 'weekly' },
    { loc: normalizeUrl('/terms'), priority: 0.3, changefreq: 'yearly' },
    { loc: normalizeUrl('/privacy'), priority: 0.3, changefreq: 'yearly' },
    { loc: normalizeUrl('/verification-policy'), priority: 0.3, changefreq: 'yearly' },
    { loc: normalizeUrl('/medical-review-policy'), priority: 0.3, changefreq: 'yearly' },
    { loc: normalizeUrl('/editorial-policy'), priority: 0.3, changefreq: 'yearly' },
  ];
}

async function buildStateUrls(supabase) {
  const states = await fetchAll(supabase, 'states', 'slug, updated_at', { is_active: true });
  return states
    .filter((state) => state.slug)
    .map((state) => ({
      loc: normalizeUrl(`/${state.slug}`),
      lastmod: state.updated_at?.split('T')[0],
      priority: 0.9,
      changefreq: 'weekly',
    }));
}

async function buildCityUrls(supabase) {
  const [states, cities] = await Promise.all([
    fetchAll(supabase, 'states', 'id, slug', { is_active: true }),
    fetchAll(supabase, 'cities', 'id, slug, state_id, updated_at', { is_active: true }),
  ]);
  const stateSlugMap = new Map(states.map((state) => [state.id, state.slug]));

  return cities
    .filter((city) => city.slug && stateSlugMap.get(city.state_id))
    .map((city) => ({
      loc: normalizeUrl(`/${stateSlugMap.get(city.state_id)}/${city.slug}`),
      lastmod: city.updated_at?.split('T')[0],
      priority: 0.85,
      changefreq: 'weekly',
    }));
}

async function buildServiceUrls(supabase) {
  const treatments = await fetchAll(supabase, 'treatments', 'slug, updated_at', { is_active: true });
  return treatments
    .filter((treatment) => treatment.slug)
    .map((treatment) => ({
      loc: normalizeUrl(`/services/${treatment.slug}`),
      lastmod: treatment.updated_at?.split('T')[0],
      priority: 0.8,
      changefreq: 'weekly',
    }));
}

async function buildServiceLocationUrls(supabase) {
  const [states, cities, treatments, clinicCombinations] = await Promise.all([
    fetchAll(supabase, 'states', 'id, slug', { is_active: true }),
    fetchAll(supabase, 'cities', 'id, slug, state_id, updated_at', { is_active: true }),
    fetchAll(supabase, 'treatments', 'id, slug, updated_at', { is_active: true }),
    fetchAll(
      supabase,
      'clinic_treatments',
      'clinic:clinics!inner(city_id), treatment_id',
      { 'clinic.is_active': true }
    ),
  ]);

  const stateSlugMap = new Map(states.map((state) => [state.id, state.slug]));
  const validCombos = new Set();

  for (const combo of clinicCombinations) {
    if (combo.clinic?.city_id && combo.treatment_id) {
      validCombos.add(`${combo.clinic.city_id}-${combo.treatment_id}`);
    }
  }

  const urls = [];
  for (const city of cities) {
    const stateSlug = stateSlugMap.get(city.state_id);
    if (!city.slug || !stateSlug) {
      continue;
    }

    for (const treatment of treatments) {
      if (!treatment.slug || !validCombos.has(`${city.id}-${treatment.id}`)) {
        continue;
      }

      urls.push({
        loc: normalizeUrl(`/${stateSlug}/${city.slug}/${treatment.slug}`),
        lastmod: (city.updated_at || treatment.updated_at)?.split('T')[0],
        priority: 0.7,
        changefreq: 'weekly',
      });
    }
  }

  return urls;
}

async function buildProfileUrls(supabase) {
  const clinics = await fetchAll(supabase, 'clinics', 'slug, updated_at', {
    is_active: true,
    is_duplicate: false,
  });

  return clinics
    .filter((clinic) => clinic.slug)
    .map((clinic) => ({
      loc: normalizeUrl(`/clinic/${clinic.slug}`),
      lastmod: clinic.updated_at?.split('T')[0],
      priority: 0.9,
      changefreq: 'weekly',
    }));
}

async function buildPostUrls(supabase) {
  const posts = await fetchAll(supabase, 'blog_posts', 'slug, updated_at', { status: 'published' });
  return posts
    .filter((post) => post.slug)
    .map((post) => ({
      loc: normalizeUrl(`/blog/${post.slug}`),
      lastmod: post.updated_at?.split('T')[0],
      priority: 0.7,
      changefreq: 'monthly',
    }));
}

async function buildInsuranceUrls(supabase) {
  const insurances = await fetchAll(supabase, 'insurances', 'slug, updated_at', { is_active: true });
  return insurances
    .filter((insurance) => insurance.slug)
    .map((insurance) => ({
      loc: normalizeUrl(`/insurance/${insurance.slug}`),
      lastmod: insurance.updated_at?.split('T')[0],
      priority: 0.7,
      changefreq: 'monthly',
    }));
}

function createSupabaseClient() {
  loadEnvConfig(process.cwd());

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const key = adminKey || anonKey;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables required for sitemap generation.');
  }

  if (!adminKey) {
    console.warn('[generate-sitemaps] SUPABASE_SERVICE_ROLE_KEY missing, falling back to anon key.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function writeSitemap(filename, xml) {
  await fs.writeFile(path.join(PUBLIC_DIR, filename), `${xml}\n`, 'utf8');
}

async function main() {
  const supabase = createSupabaseClient();

  const [stateUrls, cityUrls, serviceUrls, serviceLocationUrls, profileUrls, postUrls, insuranceUrls] = await Promise.all([
    buildStateUrls(supabase),
    buildCityUrls(supabase),
    buildServiceUrls(supabase),
    buildServiceLocationUrls(supabase),
    buildProfileUrls(supabase),
    buildPostUrls(supabase),
    buildInsuranceUrls(supabase),
  ]);

  const sitemapXmlByFile = {
    'sitemap.xml': generateSitemapIndexXml(),
    'sitemap-static.xml': generateSitemapXml(buildStaticUrls()),
    'sitemap-states.xml': generateSitemapXml(stateUrls),
    'sitemap-cities.xml': generateSitemapXml(cityUrls),
    'sitemap-services.xml': generateSitemapXml(serviceUrls),
    'sitemap-service-locations.xml': generateSitemapXml(serviceLocationUrls),
    'sitemap-profiles.xml': generateSitemapXml(profileUrls),
    'sitemap-posts.xml': generateSitemapXml(postUrls),
    'sitemap-insurance.xml': generateSitemapXml(insuranceUrls),
  };

  await Promise.all(
    Object.entries(sitemapXmlByFile).map(([filename, xml]) => writeSitemap(filename, xml))
  );

  console.log(`[generate-sitemaps] Generated ${Object.keys(sitemapXmlByFile).length} sitemap files.`);
}

main().catch((error) => {
  console.error('[generate-sitemaps] Failed to generate sitemaps:', error);
  process.exit(1);
});
