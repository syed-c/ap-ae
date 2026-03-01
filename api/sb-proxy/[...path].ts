import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import https from 'https';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path: queryPath } = req.query;
    const pathStr = Array.isArray(queryPath) ? queryPath.join('/') : queryPath;

    // DIRECT IP ACCESS WITH SNI
    const targetUrl = `https://104.18.38.10/${pathStr}${req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

    console.log(`[Proxy SNI] ${req.method} -> ${targetUrl}`);

    try {
        const headers = { ...req.headers };
        delete headers.host;
        delete headers.connection;
        delete headers['content-length'];

        // Supabase needs the host header
        headers['host'] = 'eneuthbghipsdvsqilmb.supabase.co';

        const response = await axios({
            method: req.method as any,
            url: targetUrl,
            data: req.method !== 'GET' ? req.body : undefined,
            headers: headers as any,
            responseType: 'arraybuffer',
            validateStatus: () => true,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // Bypass cert mismatch because we use IP in URL
                servername: 'eneuthbghipsdvsqilmb.supabase.co' // MANDATORY for Cloudflare
            }),
            timeout: 20000,
        });

        console.log(`[Proxy SNI] Response: ${response.status} for ${pathStr}`);

        // Forward headers
        Object.entries(response.headers).forEach(([key, value]) => {
            const lowerKey = key.toLowerCase();
            if (lowerKey !== 'content-encoding' && lowerKey !== 'transfer-encoding' && lowerKey !== 'content-length') {
                res.setHeader(key, value as string);
            }
        });

        res.status(response.status).send(response.data);
    } catch (error: any) {
        console.error('[Proxy SNI Error]', error.message);
        res.status(500).json({
            error: 'Proxy failed',
            message: error.message
        });
    }
}

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
        externalResolver: true,
    },
};
