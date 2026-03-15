/**
 * CanonicalUrl - Ensures proper canonical URL tags for crawl budget efficiency
 *
 * Uses next/head (SSR-native) instead of react-helmet-async.
 */

import Head from 'next/head';
import { useRouter } from 'next/router';

interface CanonicalUrlProps {
  /** Override the auto-generated canonical URL */
  href?: string;
  /** Base domain (defaults to AppointPanda.ae) */
  baseDomain?: string;
}

const BASE_URL = 'https://www.appointpanda.ae';

export function CanonicalUrl({ href, baseDomain }: CanonicalUrlProps) {
  const router = useRouter();

  // Build canonical URL: strip query params, enforce trailing slash
  const buildCanonical = () => {
    if (href) return href;

    const base = baseDomain || BASE_URL;
    let path = router.pathname;

    // Enforce trailing slash (except root)
    if (path !== '/' && !path.endsWith('/')) {
      path += '/';
    }

    return `${base}${path}`;
  };

  const canonicalUrl = buildCanonical();

  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}

/**
 * Generate hreflang tags for multi-region support
 */
export function HreflangTags({ path }: { path?: string }) {
  const router = useRouter();
  const currentPath = path || router.pathname;

  // Normalize path with trailing slash
  const normalizedPath = currentPath.endsWith('/') || currentPath === '/'
    ? currentPath
    : `${currentPath}/`;

  return (
    <Head>
      <link rel="alternate" hrefLang="en-us" href={`${BASE_URL}${normalizedPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${normalizedPath}`} />
    </Head>
  );
}

export default CanonicalUrl;
