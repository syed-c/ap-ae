import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';

const BASE_URL = 'https://www.appointpanda.ae';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerSupabase();

  const urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
  }> = [];

  // INDEXABLE Static pages only - matches pageRegistry INDEXABLE_PAGES
  // NON-INDEXABLE pages (search, find-dentist, auth, admin, etc.) are NOT included
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'daily' },
    { loc: '/blog/', priority: '0.9', changefreq: 'weekly' },
    { loc: '/services/', priority: '0.9', changefreq: 'weekly' },
    { loc: '/insurance/', priority: '0.8', changefreq: 'monthly' },
    { loc: '/faq/', priority: '0.7', changefreq: 'monthly' },
    { loc: '/contact/', priority: '0.6', changefreq: 'yearly' },
    { loc: '/about/', priority: '0.6', changefreq: 'yearly' },
    { loc: '/pricing/', priority: '0.7', changefreq: 'monthly' },
    { loc: '/how-it-works/', priority: '0.7', changefreq: 'monthly' },
    { loc: '/terms/', priority: '0.5', changefreq: 'yearly' },
    { loc: '/privacy/', priority: '0.5', changefreq: 'yearly' },
    { loc: '/emergency-dentist/', priority: '0.8', changefreq: 'weekly' },
    { loc: '/sitemap/', priority: '0.4', changefreq: 'weekly' },
    { loc: '/sitemap-page/', priority: '0.4', changefreq: 'weekly' },
    { loc: '/editorial-policy/', priority: '0.3', changefreq: 'yearly' },
    { loc: '/medical-review-policy/', priority: '0.3', changefreq: 'yearly' },
    { loc: '/verification-policy/', priority: '0.3', changefreq: 'yearly' },
  ];

  const today = new Date().toISOString().split('T')[0];

  staticPages.forEach(p => {
    urls.push({
      loc: `${BASE_URL}${p.loc}`,
      priority: p.priority,
      changefreq: p.changefreq,
      lastmod: today,
    });
  });

  // States/emirates
  try {
    const { data: states } = await supabase
      .from('states')
      .select('slug')
      .eq('is_active', true);

    (states || []).forEach((s: any) => {
      urls.push({
        loc: `${BASE_URL}/${s.slug}/`,
        priority: '0.9',
        changefreq: 'weekly',
        lastmod: today,
      });
    });

    // Cities for each state
    const { data: cities } = await supabase
      .from('cities')
      .select('slug, state:states(slug)')
      .eq('is_active', true)
      .limit(500);

    (cities || []).forEach((c: any) => {
      if (c.state?.slug) {
        urls.push({
          loc: `${BASE_URL}/${c.state.slug}/${c.slug}/`,
          priority: '0.8',
          changefreq: 'weekly',
          lastmod: today,
        });
      }
    });
  } catch (e) { /* ignore */ }

  // Clinics
  try {
    const { data: clinics } = await supabase
      .from('clinics')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(500);

    (clinics || []).forEach((c: any) => {
      urls.push({
        loc: `${BASE_URL}/clinic/${c.slug}/`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: c.updated_at ? c.updated_at.split('T')[0] : today,
      });
    });
  } catch (e) { /* ignore */ }

  // Dentists
  try {
    const { data: dentists } = await supabase
      .from('dentists')
      .select('slug, updated_at')
      .eq('is_active', true)
      .limit(500);

    (dentists || []).forEach((d: any) => {
      urls.push({
        loc: `${BASE_URL}/dentist/${d.slug}/`,
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: d.updated_at ? d.updated_at.split('T')[0] : today,
      });
    });
  } catch (e) { /* ignore */ }

  // Services/treatments
  try {
    const { data: treatments } = await supabase
      .from('treatments')
      .select('slug')
      .eq('is_active', true);

    (treatments || []).forEach((t: any) => {
      urls.push({
        loc: `${BASE_URL}/services/${t.slug}/`,
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: today,
      });
      // Also add cost pages
      urls.push({
        loc: `${BASE_URL}/cost/${t.slug}/`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: today,
      });
    });
  } catch (e) { /* ignore */ }

  // Compare pages (emirates comparison)
  try {
    const { data: states } = await supabase
      .from('states')
      .select('slug')
      .eq('is_active', true);

    (states || []).forEach((s: any) => {
      urls.push({
        loc: `${BASE_URL}/compare/${s.slug}/`,
        priority: '0.6',
        changefreq: 'monthly',
        lastmod: today,
      });
    });
  } catch (e) { /* ignore */ }

  // Blog posts
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published');

    (posts || []).forEach((p: any) => {
      urls.push({
        loc: `${BASE_URL}/blog/${p.slug}/`,
        priority: '0.7',
        changefreq: 'monthly',
        lastmod: p.updated_at ? p.updated_at.split('T')[0] : today,
      });
    });
  } catch (e) { /* ignore */ }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''}${u.priority ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.write(xml);
  res.end();
}
