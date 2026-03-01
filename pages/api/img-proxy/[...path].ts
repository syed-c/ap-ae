import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

/**
 * Image proxy for Supabase Storage URLs.
 * 
 * Usage: /api/img-proxy/storage/v1/object/public/clinic-assets/...
 * 
 * This proxies requests to apztvwpogywvounohqtk.supabase.co
 * using direct IP + SNI to bypass DNS poisoning.
 */

const STORAGE_HOST = 'apztvwpogywvounohqtk.supabase.co';
// Cloudflare IP for Supabase storage (same CDN)
const STORAGE_IP = '104.18.38.10';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path: queryPath } = req.query;
    const pathStr = Array.isArray(queryPath) ? queryPath.join('/') : queryPath || '';

    const targetUrl = `https://${STORAGE_IP}/${pathStr}`;

    try {
        const axios = (await import('axios')).default;

        const response = await axios({
            method: 'GET',
            url: targetUrl,
            headers: {
                'host': STORAGE_HOST,
            },
            responseType: 'arraybuffer',
            validateStatus: () => true,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                servername: STORAGE_HOST,
            }),
            timeout: 15000,
        });

        // Forward content-type for images
        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.status(response.status).send(response.data);
    } catch (error: any) {
        console.error('[Image Proxy Error]', error.message);
        res.status(502).json({ error: 'Image proxy failed' });
    }
}

export const config = {
    api: {
        responseLimit: '10mb',
    },
};
