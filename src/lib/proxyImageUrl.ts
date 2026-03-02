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

    // Always use proxy in the browser to bypass DNS poisoning/blocking
    if (typeof window === 'undefined') return url;

    // Match any Supabase storage URL
    const match = url.match(/https?:\/\/[a-z0-9]+\.supabase\.co\/(storage\/.*)/);
    if (match) {
        return `/api/img-proxy/${match[1]}`;
    }

    return url;
}
