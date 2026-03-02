import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import dns from 'dns';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const targetHost = 'eneuthbghipsdvsqilmb.supabase.co';
    const targetIp = '104.18.38.10';

    const { path: queryPath } = req.query;
    const pathSegments = Array.isArray(queryPath) ? queryPath : [];
    const pathStr = pathSegments.join('/') || '';

    const queryString = req.url?.split('?')[1];
    const targetPath = `/${pathStr}${queryString ? '?' + queryString : ''}`;

    const options: https.RequestOptions = {
        hostname: targetHost,
        port: 443,
        path: targetPath,
        method: req.method,
        headers: {
            'host': targetHost,
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

    // Forward ONLY necessary request headers
    const FORWARD_REQ_HEADERS = [
        'apikey', 'authorization', 'content-type', 'accept',
        'x-client-info', 'prefer', 'range', 'user-agent'
    ];

    FORWARD_REQ_HEADERS.forEach(h => {
        if (req.headers[h]) options.headers![h] = req.headers[h] as string;
    });

    const proxy = https.request(options, (targetRes) => {
        res.status(targetRes.statusCode || 200);

        // Copy ONLY necessary response headers to avoid Vercel/Cloudflare conflicts
        const FORWARD_RES_HEADERS = [
            'content-type', 'content-length', 'cache-control', 'etag',
            'last-modified', 'content-range', 'x-content-range',
            'preference-applied', 'location', 'sb-gateway-version', 'sb-project-ref'
        ];

        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (FORWARD_RES_HEADERS.includes(key.toLowerCase()) && value) {
                res.setHeader(key, value);
            }
        });

        // Add standard CORS headers (same-origin, but helps with browser quirks)
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        targetRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error(`[Proxy SB Deep Error] ${req.method} ${targetPath}:`, err);
        if (!res.headersSent) res.status(502).json({ error: 'Proxy failed', detail: err.message });
    });

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
        req.pipe(proxy);
    } else {
        proxy.end();
    }
}

export const config = {
    api: {
        bodyParser: false,
        externalResolver: true,
    },
};
