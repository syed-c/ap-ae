/**
 * CanonicalUrl - Ensures proper canonical URL tags for crawl budget efficiency
 * 
 * Phase 8: Technical Performance
 * Prevents duplicate content indexing by setting canonical URLs.
 */

import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

interface CanonicalUrlProps {
  /** Override the auto-generated canonical URL */
  href?: string;
  /** Base domain (defaults to appointpanda.com) */
  baseDomain?: string;
}

const BASE_URL = 'https://www.appointpanda.ae';

export function CanonicalUrl({ href, baseDomain }: CanonicalUrlProps) {
  const location = useLocation();

  // Build canonical URL: strip query params, enforce trailing slash
  const buildCanonical = () => {
    if (href) return href;
    
    const base = baseDomain || BASE_URL;
    let path = location.pathname;
    
    // Enforce trailing slash (except root)
    if (path !== '/' && !path.endsWith('/')) {
      path += '/';
    }
    
    return `${base}${path}`;
  };

  const canonicalUrl = buildCanonical();

  return (
    <Helmet>
      <link rel="canonical" href={canonicalUrl} />
    </Helmet>
  );
}

/**
 * Generate hreflang tags for multi-region support
 */
export function HreflangTags({ path }: { path?: string }) {
  const location = useLocation();
  const currentPath = path || location.pathname;
  
  // Normalize path with trailing slash
  const normalizedPath = currentPath.endsWith('/') || currentPath === '/' 
    ? currentPath 
    : `${currentPath}/`;

  return (
    <Helmet>
      <link rel="alternate" hrefLang="en-us" href={`${BASE_URL}${normalizedPath}`} />
      <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${normalizedPath}`} />
    </Helmet>
  );
}

export default CanonicalUrl;
