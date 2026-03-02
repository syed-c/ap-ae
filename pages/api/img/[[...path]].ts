import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

const STORAGE_HOST = 'eneuthbghipsdvsqilmb.supabase.co';
const STORAGE_IP = '104.18.38.10';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { path: queryPath } = req.query;
    const pathSegments = Array.isArray(queryPath) ? queryPath : [];
    const pathStr = pathSegments.join('/') || '';

    const targetUrl = `https://${STORAGE_IP}/${pathStr}${req.url?.includes('?') ? '?' + req.url.split('?')[1] : ''}`;

    try {
        const axios = (await import('axios')).default;

        const response = await axios({
            method: 'GET',
            url: targetUrl,
            headers: {
                'host': STORAGE_HOST,
            },
            responseType: 'arraybuffer',
            validateStatus: () => true,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false,
                servername: STORAGE_HOST,
            }),
            timeout: 20000,
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.status(response.status).send(response.data);
    } catch (error: any) {
        console.error('[Image Proxy Error]', error.message);
        res.status(502).json({ error: 'Image proxy failed' });
    }
}

export const config = {
    api: {
        responseLimit: '10mb',
    },
};
