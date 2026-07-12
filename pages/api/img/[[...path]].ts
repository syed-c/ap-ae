import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import dns from 'dns';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.ENABLE_IMAGE_PROXY !== 'true') {
        return res.status(404).json({ error: 'Not found' });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { path: queryPath } = req.query;
    const pathSegments = Array.isArray(queryPath) ? queryPath : [];

    if (pathSegments.length < 2) {
        return res.status(400).json({ error: 'Invalid path format. Expected /api/img/[project-id]/storage/...' });
    }

    const projectId = pathSegments[0];
    const realPathSegments = pathSegments.slice(1);
    const allowedProjectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https?:\/\/([^.]+)\.supabase\.co/i)?.[1];

    if (!allowedProjectId || projectId !== allowedProjectId) {
        return res.status(404).json({ error: 'Not found' });
    }

    const targetHost = `${projectId}.supabase.co`;
    const targetIp = '104.18.38.10'; // Bypasses UAE DNS poisoning
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

    // Build the target path
    const queryString = req.url?.split('?')[1];
    const targetPath = `/${realPathSegments.join('/')}${queryString ? '?' + queryString : ''}`;

    const options: https.RequestOptions = {
        hostname: targetHost,
        port: 443,
        path: targetPath,
        method: 'GET',
        headers: {
            'host': targetHost,
            'apikey': supabaseKey,
            'authorization': req.headers['authorization'] as string,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        lookup: (hostname, lookupOptions, cb) => {
            if (hostname === targetHost) {
                if (lookupOptions.all) {
                    return cb(null, [{ address: targetIp, family: 4 }] as any);
                }
                return cb(null, targetIp, 4);
            }
            dns.lookup(hostname, lookupOptions, (err, address, family) => cb(err, address as any, family as any));
        },
        rejectUnauthorized: true,
    };

    if (!options.headers?.['authorization']) delete options.headers['authorization'];

    const proxy = https.request(options, (targetRes) => {
        res.status(targetRes.statusCode || 200);

        const SAFE_RESPONSE_HEADERS = [
            'content-type', 'content-length', 'cache-control', 'etag', 'last-modified', 'accept-ranges'
        ];

        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (SAFE_RESPONSE_HEADERS.includes(key.toLowerCase()) && value) {
                res.setHeader(key, value);
            }
        });

        if (!res.getHeader('cache-control')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }

        targetRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error(`[Proxy Image Error] GET ${targetHost}${targetPath}:`, err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Image proxy unavailable' });
    });

    proxy.end();
}

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
