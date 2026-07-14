import Head from 'next/head';
import { useRouter } from 'next/router';
import { classifyPath } from '@/config/pageRegistry';

export interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  skipCanonical?: boolean;
  noindex?: boolean;
  ogType?: 'website' | 'article' | 'profile';
  ogImage?: string;
  keywords?: string[];
  author?: string;
  publishedAt?: string;
  modifiedAt?: string;
  currentPath?: string;
}

const SITE_NAME = 'AppointPanda';
const BASE_URL = 'https://www.appointpanda.ae';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

function buildCanonicalUrl(pathOrUrl: string): string {
  const normalizedValue = pathOrUrl.trim();

  if (/^https?:\/\//i.test(normalizedValue)) {
    const absoluteUrl = new URL(normalizedValue);
    absoluteUrl.pathname = absoluteUrl.pathname.replace(/\/+/g, '/');
    return absoluteUrl.toString();
  }

  const pathname = normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`;
  const absoluteUrl = new URL(pathname, BASE_URL);
  absoluteUrl.pathname = absoluteUrl.pathname.replace(/\/+/g, '/');
  return absoluteUrl.toString();
}

export const SEOHead = ({
  title = '',
  description = '',
  canonical,
  skipCanonical = false,
  noindex = false,
  ogType = 'website',
  ogImage,
  keywords,
  author,
  publishedAt,
  modifiedAt,
  currentPath: currentPathProp,
}: SEOHeadProps) => {
  const router = useRouter();
  const currentPath = currentPathProp ?? router.asPath ?? '/';

  // CRITICAL: Strip query params from path for canonical — otherwise pagination/filter URLs
  // create duplicate content issues (Google sees ?page=2 as a different canonical page)
  const pathWithoutQuery = currentPath.split('?')[0].split('#')[0];

  // Ensure we have at least some title
  const safeTitle = title || 'Dental Clinics in UAE';
  // Avoid double branding: if title already contains the site name, use it as-is
  const fullTitle = safeTitle.includes(SITE_NAME) ? safeTitle : `${safeTitle} | ${SITE_NAME}`;
  
  // Ensure description is not empty
  const safeDescription = description || 'Find and book appointments with top-rated dental professionals across the UAE.';

  // CRITICAL: Always generate canonical URL - use provided or derive from current path
  // Don't add trailing slash - Next.js trailingSlash: true handles redirects
  // This prevents 301 redirect loops and duplicate content issues
  const normalizedCanonical = buildCanonicalUrl(canonical || pathWithoutQuery || '/');

  const imageUrl = ogImage || DEFAULT_OG_IMAGE;

  // Respect explicit noindex prop; only override if classification says non-indexable
  const classification = classifyPath(currentPath);
  const effectiveNoindex = noindex || !classification.indexable;

  return (
    <Head>
      {/* Primary Meta Tags - These are CRITICAL for SEO */}
      <title>{fullTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta name="robots" content={effectiveNoindex ? 'noindex, nofollow' : 'index, follow'} />

      {/* Canonical URL - Prevents duplicate content */}
      {!skipCanonical && <link rel="canonical" href={normalizedCanonical} />}

      {/* Sitemap reference */}
      <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />

      {/* Keywords */}
      {keywords && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}

      {/* Author */}
      {author && <meta name="author" content={author} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={normalizedCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_AE" />

      {/* Hreflang for UAE - primary English, alternate Arabic */}
      <link rel="alternate" hrefLang="en-AE" href={normalizedCanonical} />
      <link rel="alternate" hrefLang="x-default" href={normalizedCanonical} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={normalizedCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={imageUrl} />

      {/* Article specific (for blog posts) */}
      {ogType === 'article' && publishedAt && (
        <meta property="article:published_time" content={publishedAt} />
      )}
      {ogType === 'article' && modifiedAt && (
        <meta property="article:modified_time" content={modifiedAt} />
      )}
    </Head>
  );
};

export default SEOHead;
