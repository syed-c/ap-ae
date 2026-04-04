import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';

const BASE_URL = 'https://www.appointpanda.ae';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  priority: number;
  changefreq: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeUrl(path: string): string {
  let cleanPath = path.startsWith('/') ? path : `/${path}`;
  cleanPath = cleanPath.replace(/\/+/g, '/');
  if (cleanPath !== '/' && !cleanPath.endsWith('/')) {
    cleanPath = cleanPath + '/';
  }
  return `${BASE_URL}${cleanPath}`;
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${escapeXml(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
}

async function fetchAll(supabase: any, table: string, select: string, filters: Record<string, any> = {}) {
  const allRows: any[] = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    let query = supabase.from(table).select(select).range(offset, offset + limit - 1);
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query;
    if (error || !data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return allRows;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabaseAdmin();
  if (!supabase) {
    return res.status(500).send('Database error');
  }

  const slug = (req.query.slug as string[])?.join('/') || '';
  console.log('Sitemap request:', slug);
  const today = new Date().toISOString().split('T')[0];

  const sitemapPatterns = [
    'sitemap.xml', 'sitemap-static.xml', 'sitemap-states.xml', 'sitemap-cities.xml',
    'sitemap-services.xml', 'sitemap-service-locations.xml', 'sitemap-posts.xml',
    'sitemap-insurance.xml', 'sitemap-profiles.xml',
  ];

  const isSitemap = sitemapPatterns.includes(slug);
  if (!isSitemap) {
    return res.status(404).send('Not found');
  }

  if (slug === 'sitemap.xml') {
    const sitemaps = [
      'sitemap-static.xml', 'sitemap-states.xml', 'sitemap-cities.xml', 'sitemap-services.xml',
      'sitemap-service-locations.xml', 'sitemap-profiles.xml',
      'sitemap-posts.xml', 'sitemap-insurance.xml',
    ];
    const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${BASE_URL}/${s}</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.send(sitemapIndex);
  }

  let type = '';

  if (slug.startsWith('sitemap-static.xml')) type = 'static';
  else if (slug.startsWith('sitemap-states.xml')) type = 'states';
  else if (slug.startsWith('sitemap-cities')) type = 'cities';
  else if (slug.startsWith('sitemap-services.xml')) type = 'services';
  else if (slug.startsWith('sitemap-service-locations')) type = 'service-locations';
  else if (slug.startsWith('sitemap-profiles')) type = 'profiles';
  else if (slug.startsWith('sitemap-posts.xml')) type = 'posts';
  else if (slug.startsWith('sitemap-insurance.xml')) type = 'insurance';

  console.log('Parsed:', { type, slug });

  if (!type) return res.status(404).send('Not found');

  res.setHeader('Content-Type', 'application/xml');

  if (type === 'static') {
    const urls: SitemapUrl[] = [
      { loc: normalizeUrl('/'), priority: 1.0, changefreq: 'daily' },
      { loc: normalizeUrl('/services'), priority: 0.9, changefreq: 'weekly' },
      { loc: normalizeUrl('/insurance'), priority: 0.8, changefreq: 'weekly' },
      { loc: normalizeUrl('/blog'), priority: 0.8, changefreq: 'daily' },
      { loc: normalizeUrl('/about'), priority: 0.5, changefreq: 'monthly' },
      { loc: normalizeUrl('/contact'), priority: 0.5, changefreq: 'monthly' },
      { loc: normalizeUrl('/faq'), priority: 0.6, changefreq: 'monthly' },
      { loc: normalizeUrl('/how-it-works'), priority: 0.6, changefreq: 'monthly' },
      { loc: normalizeUrl('/pricing'), priority: 0.6, changefreq: 'monthly' },
      { loc: normalizeUrl('/sitemap'), priority: 0.4, changefreq: 'weekly' },
      { loc: normalizeUrl('/emergency-dentist'), priority: 0.8, changefreq: 'weekly' },
      { loc: normalizeUrl('/terms'), priority: 0.3, changefreq: 'yearly' },
      { loc: normalizeUrl('/privacy'), priority: 0.3, changefreq: 'yearly' },
    ];
    return res.send(generateSitemapXml(urls));
  }

  if (type === 'states') {
    const states = await fetchAll(supabase, 'states', 'slug, updated_at', { is_active: true });
    const urls = states.filter(s => s.slug).map(s => ({ loc: normalizeUrl(`/${s.slug}`), lastmod: s.updated_at?.split('T')[0], priority: 0.9, changefreq: 'weekly' }));
    return res.send(generateSitemapXml(urls));
  }

  if (type === 'cities') {
    const states = await fetchAll(supabase, 'states', 'id, slug', { is_active: true });
    const cities = await fetchAll(supabase, 'cities', 'id, slug, state_id, updated_at', { is_active: true });
    const stateSlugMap = new Map(states.map(s => [s.id, s.slug]));
    const urls = cities.filter(c => c.slug && stateSlugMap.get(c.state_id)).map(c => ({ 
      loc: normalizeUrl(`/${stateSlugMap.get(c.state_id)}/${c.slug}`), 
      lastmod: c.updated_at?.split('T')[0], 
      priority: 0.85, 
      changefreq: 'weekly' 
    }));
    return res.send(generateSitemapXml(urls));
  }

  if (type === 'services') {
    const treatments = await fetchAll(supabase, 'treatments', 'slug, updated_at', { is_active: true });
    const urls = treatments.filter(t => t.slug).flatMap(t => [
      { loc: normalizeUrl(`/services/${t.slug}`), lastmod: t.updated_at?.split('T')[0], priority: 0.8, changefreq: 'weekly' },
      { loc: normalizeUrl(`/cost/${t.slug}`), lastmod: t.updated_at?.split('T')[0], priority: 0.7, changefreq: 'monthly' },
    ]);
    return res.send(generateSitemapXml(urls));
  }

  if (type === 'service-locations') {
    // Get states and cities separately to avoid join issues
    const states = await fetchAll(supabase, 'states', 'id, slug', { is_active: true });
    const cities = await fetchAll(supabase, 'cities', 'id, slug, state_id', { is_active: true });
    const treatments = await fetchAll(supabase, 'treatments', 'id, slug', { is_active: true });
    
    const stateSlugMap = new Map(states.map(s => [s.id, s.slug]));
    
    const urls: SitemapUrl[] = [];
    for (const city of cities) {
      const stateSlug = stateSlugMap.get(city.state_id);
      if (!city.slug || !stateSlug) continue;
      for (const treatment of treatments) {
        if (!treatment.slug) continue;
        urls.push({ loc: normalizeUrl(`/${stateSlug}/${city.slug}/${treatment.slug}`), priority: 0.7, changefreq: 'weekly' });
      }
    }
    return res.send(generateSitemapXml(urls));
  }

  if (type === 'profiles') {
    const clinics = await fetchAll(supabase, 'clinics', 'slug, updated_at', { is_active: true, is_duplicate: false });
    const urls = clinics.filter(c => c.slug).map(c => ({ loc: normalizeUrl(`/clinic/${c.slug}`), lastmod: c.updated_at?.split('T')[0], priority: 0.7, changefreq: 'weekly' }));
    return res.send(generateSitemapXml(urls));
  }

  if (type === 'posts') {
    const posts = await fetchAll(supabase, 'blog_posts', 'slug, updated_at', { status: 'published' });
    const urls = posts.filter(p => p.slug).map(p => ({ loc: normalizeUrl(`/blog/${p.slug}`), lastmod: p.updated_at?.split('T')[0], priority: 0.7, changefreq: 'monthly' }));
    return res.send(generateSitemapXml(urls));
  }

  if (type === 'insurance') {
    const insurances = await fetchAll(supabase, 'insurances', 'slug, updated_at', { is_active: true });
    const urls = insurances.filter(i => i.slug).map(i => ({ loc: normalizeUrl(`/insurance/${i.slug}`), lastmod: i.updated_at?.split('T')[0], priority: 0.7, changefreq: 'monthly' }));
    return res.send(generateSitemapXml(urls));
  }

  return res.status(404).send('Not found');
}
