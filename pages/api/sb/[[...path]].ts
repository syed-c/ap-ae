import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const targetHost = 'eneuthbghipsdvsqilmb.supabase.co';

    // Remove the /api/sb prefix from the URL
    const targetPath = req.url?.replace('/api/sb', '') || '';

    const options: https.RequestOptions = {
        hostname: targetHost, // Use domain name directly (relies on next.config.js hack for IP)
        port: 443,
        path: targetPath,
        method: req.method,
        headers: {
            'apikey': req.headers['apikey'] as string,
            'authorization': req.headers['authorization'] as string,
            'content-type': req.headers['content-type'] as string,
            'accept': req.headers['accept'] as string,
            'x-client-info': req.headers['x-client-info'] as string,
            'prefer': req.headers['prefer'] as string,
            'range': req.headers['range'] as string,
            'host': targetHost,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        rejectUnauthorized: false,
        servername: targetHost,
    };

    // Clean up undefined headers
    Object.keys(options.headers || {}).forEach(key => {
        if (!options.headers?.[key]) delete options.headers![key];
    });

    const proxy = https.request(options, (targetRes) => {
        res.status(targetRes.statusCode || 200);

        // Whitelist safe response headers to prevent cookie/protocol conflicts
        const SAFE_RESPONSE_HEADERS = [
            'content-type', 'content-length', 'cache-control', 'etag',
            'last-modified', 'content-range', 'x-content-range', 'accept-ranges',
            'access-control-allow-origin', 'preference-applied', 'timing-allow-origin'
        ];

        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (SAFE_RESPONSE_HEADERS.includes(key.toLowerCase()) && value) {
                res.setHeader(key, value);
            }
        });

        targetRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error('[Proxy SB Error]', err.message);
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
