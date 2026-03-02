import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const targetHost = 'eneuthbghipsdvsqilmb.supabase.co';
    const targetIp = '104.18.38.10'; // DIRECT EDGE IP
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

    const targetPath = req.url?.replace('/api/img', '') || '';

    const options: https.RequestOptions = {
        hostname: targetIp,
        port: 443,
        path: targetPath,
        method: 'GET',
        headers: {
            'host': targetHost,
            'apikey': supabaseKey,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        rejectUnauthorized: false,
        servername: targetHost,
    };

    const proxy = https.request(options, (targetRes) => {
        res.status(targetRes.statusCode || 200);

        // STRICT response header whitelist for images
        const SAFE_RESPONSE_HEADERS = [
            'content-type', 'content-length', 'cache-control', 'etag', 'last-modified', 'accept-ranges'
        ];

        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (SAFE_RESPONSE_HEADERS.includes(key.toLowerCase()) && value) {
                res.setHeader(key, value);
            }
        });

        // Add aggressive caching if missing
        if (!res.getHeader('cache-control')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }

        targetRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error(`[Proxy Image Error] GET ${targetPath}:`, err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Image Proxy failed' });
    });

    proxy.end();
}

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
