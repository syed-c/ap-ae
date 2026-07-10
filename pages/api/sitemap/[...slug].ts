import { promises as fs } from 'fs';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const SITEMAP_FILES = new Set([
  'sitemap.xml',
  'sitemap-static.xml',
  'sitemap-states.xml',
  'sitemap-cities.xml',
  'sitemap-services.xml',
  'sitemap-service-locations.xml',
  'sitemap-posts.xml',
  'sitemap-insurance.xml',
  'sitemap-profiles.xml',
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slug = (req.query.slug as string[])?.join('/') || '';
  if (!SITEMAP_FILES.has(slug)) {
    return res.status(404).send('Not found');
  }

  try {
    const filePath = path.join(process.cwd(), 'public', slug);
    const xml = await fs.readFile(filePath, 'utf8');

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400');
    return res.send(xml);
  } catch {
    return res.status(404).send('Sitemap not generated');
  }
}
