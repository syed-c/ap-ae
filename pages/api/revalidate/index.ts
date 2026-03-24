import type { NextApiRequest, NextApiResponse } from 'next';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * On-Demand ISR Revalidation API Route
 * 
 * This endpoint allows triggering ISR revalidation for specific pages
 * when content is updated in Supabase or other data sources.
 * 
 * Usage:
 *   POST /api/revalidate
 *   {
 *     "secret": "REVALIDATION_SECRET",
 *     "paths": ["/clinic/slug/", "/dentist/slug/"],
 *     "tags": ["clinics", "dentists"]
 *   }
 * 
 * OR use query params:
 *   POST /api/revalidate?secret=xxx&path=/clinic/slug/
 * 
 * Security: Requires REVALIDATION_SECRET env var to be set.
 */

interface RevalidateRequest {
  secret?: string;
  paths?: string[];
  tags?: string[];
  path?: string;
  tag?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Get secret from body or query
  const body = req.body as RevalidateRequest;
  const secret = body.secret || req.query.secret;
  const revalidationSecret = process.env.REVALIDATION_SECRET;

  // Validate secret if configured
  if (revalidationSecret && secret !== revalidationSecret) {
    return res.status(401).json({ error: 'Invalid revalidation secret' });
  }

  try {
    const results: { path?: string; tag?: string; success: boolean; error?: string }[] = [];

    // Revalidate paths
    const paths = body.paths || (body.path ? [body.path] : []);
    for (const path of paths) {
      try {
        // Ensure path has trailing slash for Next.js trailingSlash config
        const normalizedPath = path.endsWith('/') ? path : `${path}/`;
        revalidatePath(normalizedPath);
        results.push({ path: normalizedPath, success: true });
      } catch (err) {
        results.push({ path, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    // Revalidate tags
    const tags = body.tags || (body.tag ? [body.tag] : []);
    for (const tag of tags) {
      try {
        revalidateTag(tag);
        results.push({ tag, success: true });
      } catch (err) {
        results.push({ tag, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    // If no paths or tags provided, revalidate homepage
    if (paths.length === 0 && tags.length === 0) {
      revalidatePath('/');
      results.push({ path: '/', success: true });
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Ping Google and Bing after successful revalidation
    if (successCount > 0) {
      const sitemapUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.appointpanda.ae'}/sitemap.xml`;
      await Promise.allSettled([
        fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
        fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`),
      ]).catch(() => { /* Non-critical - don't fail the response */ });
    }

    return res.status(200).json({
      revalidated: true,
      results,
      summary: {
        total: results.length,
        success: successCount,
        failed: failCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[On-Demand ISR] Revalidation failed:', err);
    return res.status(500).json({
      error: 'Revalidation failed',
      detail: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

// Disable body parsing for this route to allow raw body access if needed
export const config = {
  api: {
    bodyParser: true,
  },
};
