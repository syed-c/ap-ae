'use client'

/**
 * CriticalResourceLoader - Phase 8 Technical Performance
 * 
 * Handles:
 * - Idle-time prefetching of critical routes
 * - Third-party script deferral
 * - Connection warming for API endpoints
 */

import { useEffect } from 'react';
import { prefetchCriticalRoutes } from '@/hooks/useRoutePrefetch';

interface CriticalResourceLoaderProps {
  /** Delay before starting idle prefetch (ms) */
  delay?: number;
}

export function CriticalResourceLoader({ delay = 3000 }: CriticalResourceLoaderProps) {
  useEffect(() => {
    // Wait for page to be fully interactive before prefetching
    const timer = setTimeout(() => {
      prefetchCriticalRoutes();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return null;
}

/**
 * DeferredScript - Load third-party scripts after page is interactive
 */
export function DeferredScript({ 
  src, 
  delay = 4000 
}: { 
  src: string; 
  delay?: number;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      document.body.appendChild(script);
    }, delay);

    return () => clearTimeout(timer);
  }, [src, delay]);

  return null;
}

export default CriticalResourceLoader;
