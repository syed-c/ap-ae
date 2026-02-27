import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    prerenderReady: boolean;
  }
}

/**
 * Hook to signal Prerender.io that the page is ready for capture.
 * 
 * CRITICAL FOR SEO: This hook controls when bots can capture the page.
 * Only signal ready when ALL SEO-critical content is rendered:
 * - Page headings and titles
 * - Main content sections
 * - FAQs
 * - Schema markup
 * - Internal links
 * 
 * @param isReady - Boolean indicating if ALL page data is loaded
 * @param options - Optional configuration
 */
interface PrerenderOptions {
  /** Delay in ms before signaling ready (default: 500) */
  delay?: number;
  /** Minimum content length to validate (optional) */
  minContentLength?: number;
}

export function usePrerenderReady(isReady: boolean, options?: PrerenderOptions) {
  const hasSignaled = useRef(false);
  const delay = options?.delay ?? 500;

  useEffect(() => {
    // Only signal once per page load
    if (isReady && !hasSignaled.current) {
      hasSignaled.current = true;
      
      // Delay to ensure React has committed ALL DOM updates
      // including react-helmet-async meta tags and all component content
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          // Validate that content is actually in the DOM
          const hasContent = document.querySelector('h1') && 
                            (document.querySelector('article') || document.querySelector('main'));
          
          if (hasContent) {
            window.prerenderReady = true;
            console.log('[Prerender] Page ready for capture - all data loaded');
          } else {
            // Wait a bit more if content not found
            setTimeout(() => {
              window.prerenderReady = true;
              console.log('[Prerender] Page ready for capture - delayed signal');
            }, 500);
          }
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isReady, delay]);

  // Reset on unmount so new pages can signal again
  useEffect(() => {
    return () => {
      hasSignaled.current = false;
      if (typeof window !== 'undefined') {
        window.prerenderReady = false;
      }
    };
  }, []);
}

export default usePrerenderReady;
