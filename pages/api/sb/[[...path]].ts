import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const targetHost = 'eneuthbghipsdvsqilmb.supabase.co';
    const targetIp = '104.18.38.10'; // Stable Cloudflare IP

    // Remove the /api/sb prefix from the URL to get the real Supabase path
    const targetPath = req.url?.replace('/api/sb', '') || '';

    const options: https.RequestOptions = {
        hostname: targetIp,
        port: 443,
        path: targetPath,
        method: req.method,
        headers: {
            // ONLY forward essential Supabase headers
            'apikey': req.headers['apikey'] as string,
            'authorization': req.headers['authorization'] as string,
            'content-type': req.headers['content-type'] as string,
            'accept': req.headers['accept'] as string,
            'x-client-info': req.headers['x-client-info'] as string,
            'host': targetHost,
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        rejectUnauthorized: false,
        servername: targetHost,
    };

    // Remove undefined headers if they weren't in the original request
    Object.keys(options.headers || {}).forEach(key => {
        if (!options.headers?.[key]) delete options.headers[key];
    });

    // Remove headers that can conflict or cause infinite loops
    delete options.headers?.['x-vercel-id'];
    delete options.headers?.['x-vercel-forwarded-for'];
    delete options.headers?.['x-forwarded-for'];
    delete options.headers?.['connection'];
    delete options.headers?.['content-length']; // Streaming handles this

    const proxy = https.request(options, (targetRes) => {
        // Forward the status code
        res.status(targetRes.statusCode || 200);

        // Forward all headers from Supabase to the browser
        Object.entries(targetRes.headers).forEach(([key, value]) => {
            if (value) res.setHeader(key, value);
        });

        // Fast streaming of the response
        targetRes.pipe(res);
    });

    proxy.on('error', (err) => {
        console.error('[Proxy SB Error]', err.message);
        if (!res.headersSent) {
            res.status(502).json({ error: 'Proxy failed', message: err.message });
        }
    });

    // Fast streaming of the request body (important for POST/PATCH)
    req.pipe(proxy);
}

export const config = {
    api: {
        bodyParser: false, // Don't parse the body, just stream it
        externalResolver: true,
    },
};
