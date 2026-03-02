import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import dns from 'dns';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const targetHost = 'eneuthbghipsdvsqilmb.supabase.co';
    const targetIp = '104.18.38.10';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

    const { path: queryPath } = req.query;
    const pathSegments = Array.isArray(queryPath) ? queryPath : [];
    const pathStr = pathSegments.join('/') || '';

    const queryString = req.url?.split('?')[1];
    const targetPath = `/${pathStr}${queryString ? '?' + queryString : ''}`;

    console.log(`[Proxy Image] GET ${targetPath}`);

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
        rejectUnauthorized: false,
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
        console.error(`[Proxy Image Error] GET ${targetPath}:`, err.message);
        if (!res.headersSent) res.status(502).json({ error: 'Image proxy failed' });
    });

    proxy.end();
}

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
