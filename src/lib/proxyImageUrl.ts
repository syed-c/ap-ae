/**
 * Rewrites Supabase storage URLs to go through the local image proxy.
 * This bypasses DNS poisoning that blocks direct access to *.supabase.co domains.
 * 
 * Example:
 *   Input:  https://apztvwpogywvounohqtk.supabase.co/storage/v1/object/public/clinic-assets/foo.jpg
 *   Output: /api/img-proxy/storage/v1/object/public/clinic-assets/foo.jpg
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // We ONLY need to proxy images if we are on localhost to bypass local DNS poisoning
    const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    if (!isLocalhost) return url;

    // Match any Supabase storage URL
    const match = url.match(/https?:\/\/[a-z0-9]+\.supabase\.co\/(storage\/.*)/);
    if (match) {
        return `/api/img-proxy/${match[1]}`;
    }

    return url;
}
