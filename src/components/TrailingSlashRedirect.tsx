'use client';
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * TrailingSlashRedirect - Enforces URL consistency
 * 
 * SEO CRITICAL: Ensures all URLs use the same format (WITH trailing slash)
 * This prevents duplicate content issues where /page and /page/ are indexed separately.
 *
 * Uses window.location.replace for a hard redirect (closest to 301 behavior in SPA).
 */
export function TrailingSlashRedirect() {
  const location = useLocation();

  useEffect(() => {
    const { pathname, search, hash } = location;
    
    // Skip if it's the root path or already has a trailing slash
    if (pathname === '/' || pathname.endsWith('/')) {
      return;
    }
    
    // Skip file-like paths (with extensions)
    if (pathname.includes('.')) {
      return;
    }
    
    // Add trailing slash
    const pathWithSlash = pathname + "/";

    // Hard redirect to canonical URL (no history entry)
    window.location.replace(pathWithSlash + search + hash);
  }, [location]);

  return null;
}
