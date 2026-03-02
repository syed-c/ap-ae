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

    console.log(`[Proxy SB] ${req.method} ${targetPath}`);

    const options: https.RequestOptions = {
        hostname: targetHost,
        port: 443,
        path: targetPath,
        method: req.method,
        headers: {
            'host': targetHost,
            'user-agent': req.headers['user-agent'] || 'AppointPanda/1.0',
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

    // Forward most headers except sensitive/hop-by-hop ones
    const EXCLUDED_HEADERS = [
        'host', 'connection', 'keep-alive', 'te', 'trailers',
        'transfer-encoding', 'upgrade', 'cookie'
    ];

    Object.entries(req.headers).forEach(([key, value]) => {
        if (!EXCLUDED_HEADERS.includes(key.toLowerCase()) && value) {
            options.headers![key] = value as string;
        }
    });

    // Ensure referer and origin are mapped to the target if they are from our domain
    if (options.headers!['origin']) options.headers!['origin'] = `https://${targetHost}`;
    if (options.headers!['referer']) options.headers!['referer'] = `https://${targetHost}/`;

    const proxy = https.request(options, (targetRes) => {
        res.status(targetRes.statusCode || 200);

        // Copy all response headers except sensitive ones
        const EXCLUDED_RES_HEADERS = [
            'set-cookie', 'access-control-allow-origin', 'access-control-allow-credentials'
        ];

        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (!EXCLUDED_RES_HEADERS.includes(key.toLowerCase()) && value) {
                res.setHeader(key, value);
            }
        });

        // Add CORS headers for safety
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
