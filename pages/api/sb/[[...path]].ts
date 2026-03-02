import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const targetHost = 'eneuthbghipsdvsqilmb.supabase.co';
    const targetIp = '104.18.38.10'; // DIRECT EDGE IP

    const targetPath = req.url?.replace('/api/sb', '') || '';

    // Explicitly whitelist ONLY what Supabase needs
    const headers: Record<string, string> = {
        'host': targetHost,
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    };

    if (req.headers['apikey']) headers['apikey'] = req.headers['apikey'] as string;
    if (req.headers['authorization']) headers['authorization'] = req.headers['authorization'] as string;
    if (req.headers['content-type']) headers['content-type'] = req.headers['content-type'] as string;
    if (req.headers['accept']) headers['accept'] = req.headers['accept'] as string;
    if (req.headers['prefer']) headers['prefer'] = req.headers['prefer'] as string;
    if (req.headers['range']) headers['range'] = req.headers['range'] as string;

    const options: https.RequestOptions = {
        hostname: targetIp,
        port: 443,
        path: targetPath,
        method: req.method,
        headers,
        rejectUnauthorized: false,
        servername: targetHost, // SNI is required
    };

    const proxy = https.request(options, (targetRes) => {
        res.status(targetRes.statusCode || 200);

        // Strip ALL potentially conflicting headers from the source (Set-Cookie, Transfer-Encoding, etc.)
        const SAFE_RESPONSE_HEADERS = [
            'content-type', 'content-length', 'cache-control', 'etag',
            'last-modified', 'content-range', 'x-content-range',
            'access-control-allow-origin', 'preference-applied'
        ];

        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (SAFE_RESPONSE_HEADERS.includes(key.toLowerCase()) && value) {
                res.setHeader(key, value);
            }
        });

        targetRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error(`[Proxy SB Error] ${req.method} ${targetPath}:`, err.message);
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
