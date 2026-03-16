/**
 * Returns direct Supabase storage URLs for SEO crawlers.
 * 
 * The internal API proxy (/api/img/...) breaks image rendering in:
 * - GSC renderer (can't resolve internal routes)
 * - Social media crawlers (OG images, Twitter cards)
 * - External link previews
 * 
 * Direct Supabase storage URLs are already publicly accessible.
 * 
 * Example:
 *   Input:  https://apztvwpogywvounohqtk.supabase.co/storage/v1/object/public/clinic-assets/foo.jpg
 *   Output: https://apztvwpogywvounohqtk.supabase.co/storage/v1/object/public/clinic-assets/foo.jpg
 */
export function proxyImageUrl(url: string | null | undefined): string | null {
    if (!url) return null;

    // Always return direct URL - the proxy breaks GSC, OG crawlers, and social previews
    return url;
}
