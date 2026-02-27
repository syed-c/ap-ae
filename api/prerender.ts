// Vercel Edge Function for Prerendering
// Proxies bot requests to Prerender.io for fully-rendered HTML

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  const url = new URL(request.url);

  // When invoked via Vercel rewrite, the original path is passed as ?path=/original
  // (otherwise pathname will be /api/prerender).
  const requestedPathRaw = url.searchParams.get('path') || url.pathname;
  const requestedPath = requestedPathRaw.startsWith('/') ? requestedPathRaw : `/${requestedPathRaw}`;

  // Skip static assets (based on the ORIGINAL requested path)
  const IGNORE_EXTENSIONS = [
    '.js', '.css', '.xml', '.png', '.jpg', '.jpeg', '.gif', '.pdf',
    '.ico', '.svg', '.webp', '.woff', '.woff2', '.ttf', '.mp4', '.webm'
  ];

  if (IGNORE_EXTENSIONS.some(ext => requestedPath.endsWith(ext))) {
    return new Response(null, { status: 200 });
  }

  const prerenderToken = process.env.PRERENDER_TOKEN;

  if (!prerenderToken) {
    console.error('PRERENDER_TOKEN not configured - bot will see SPA shell');
    return new Response(null, {
      status: 200,
      headers: { 'x-prerender': 'no-token' }
    });
  }

  // Preserve original query params, excluding our internal "path" param.
  const forwardedParams = new URLSearchParams(url.searchParams);
  forwardedParams.delete('path');
  const forwardedQuery = forwardedParams.toString();

  try {
    // Build the full URL for prerendering
    const targetUrl = `https://www.appointpanda.com${requestedPath}${forwardedQuery ? `?${forwardedQuery}` : ''}`;
    const prerenderUrl = `https://service.prerender.io/${targetUrl}`;

    console.log(`Prerendering for bot: ${targetUrl}`);
    console.log(`Prerendering for bot: ${targetUrl}`);

    const response = await fetch(prerenderUrl, {
      headers: {
        'X-Prerender-Token': prerenderToken,
        // CRITICAL: Use a browser UA so Prerender fetches the real SPA,
        // not our bot-only /serve-static output (prevents recursion).
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-Prerender-Render-Delay': '3000',
        'X-Prerender-Recache': 'true',
      },
    });

    if (!response.ok) {
      console.error(`Prerender.io returned ${response.status}`);
      return new Response(null, { 
        status: 200,
        headers: { 'x-prerender': 'failed' }
      });
    }

    const html = await response.text();

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'x-prerender': 'hit',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error) {
    console.error('Prerender error:', error);
    return new Response(null, { 
      status: 200,
      headers: { 'x-prerender': 'error' }
    });
  }
}
