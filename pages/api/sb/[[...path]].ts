import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';
import dns from 'dns';

function isAllowedOrigin(origin: string | undefined): boolean {
    if (!origin) return true;

    const allowedOrigins = new Set([
        process.env.NEXT_PUBLIC_SITE_URL,
        'https://www.appointpanda.ae',
        'https://appointpanda.ae',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ].filter(Boolean));

    return allowedOrigins.has(origin);
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (process.env.ENABLE_SUPABASE_PROXY !== 'true') {
        return res.status(404).json({ error: 'Not found' });
    }

    const targetHost = 'eneuthbghipsdvsqilmb.supabase.co';
    const targetIp = '104.18.38.10';

    const { path: queryPath } = req.query;
    const pathSegments = Array.isArray(queryPath) ? queryPath : [];
    const pathStr = pathSegments.join('/') || '';

    const queryString = req.url?.split('?')[1];
    const targetPath = `/${pathStr}${queryString ? '?' + queryString : ''}`;

    if (!isAllowedOrigin(req.headers.origin)) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.appointpanda.ae';
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'authorization,apikey,content-type');
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Max-Age', '86400');
        return res.status(204).end();
    }

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
        rejectUnauthorized: true,
    };

    // 2. Forward Request Headers
    const FORWARD_REQ_HEADERS = [
        'apikey', 'authorization', 'content-type', 'accept',
        'x-client-info', 'prefer', 'range', 'user-agent',
        'x-supabase-api-version'
    ];

    FORWARD_REQ_HEADERS.forEach(h => {
        if (req.headers[h]) options.headers![h] = req.headers[h] as string;
    });

    // 3. Normalize Security Headers for Supabase CSRF
    if (req.headers['origin']) options.headers!['origin'] = `https://${targetHost}`;
    if (req.headers['referer']) options.headers!['referer'] = `https://${targetHost}/`;

    const proxy = https.request(options, (targetRes) => {
        // Suppress automatic header setting by pipe
        res.status(targetRes.statusCode || 200);

        // 4. Surgical Response Header Forwarding
        const FORWARD_RES_HEADERS = [
            'content-type', 'content-length', 'cache-control', 'etag',
            'last-modified', 'content-range', 'x-content-range',
            'preference-applied', 'location', 'sb-gateway-version', 'sb-project-ref',
            'content-encoding', 'link', 'x-total-count'
        ];

        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (FORWARD_RES_HEADERS.includes(key.toLowerCase()) && value) {
                res.setHeader(key, value);
            }
        });

        const origin = req.headers.origin || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.appointpanda.ae';
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');

        targetRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error(`[Proxy SB Deep Error] ${req.method} ${targetPath}:`, err);
        if (!res.headersSent) res.status(502).json({ error: 'Proxy failed' });
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
