'use client'

/**
 * GoogleAnalytics - GA4 Script Loader Component
 * 
 * Loads gtag.js and initializes GA4 tracking.
 * Uses measurement ID from environment/settings.
 * 
 * IMPORTANT: This component MUST be inside BrowserRouter for useLocation to work.
 */

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Extend Window interface for gtag and dataLayer
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const location = useLocation();
  const scriptLoadedRef = useRef(false);
  const initializedRef = useRef(false);

  // Load GA4 script on mount - only once
  useEffect(() => {
    if (!measurementId || typeof window === 'undefined') return;
    if (scriptLoadedRef.current) return;

    // Check if already loaded by another instance
    const existingScript = document.querySelector(`script[src*="gtag/js?id=${measurementId}"]`);
    if (existingScript) {
      scriptLoadedRef.current = true;
      console.log('[GA4] Script already loaded');
      return;
    }

    scriptLoadedRef.current = true;

    // Initialize dataLayer BEFORE loading the script
    window.dataLayer = window.dataLayer || [];
    
    // Define gtag function - must be before script loads
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;

    // Initialize with timestamp and config
    gtag('js', new Date());
    gtag('config', measurementId, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
      page_location: window.location.href,
      page_path: window.location.pathname,
    });

    initializedRef.current = true;

    // Add meta tag for verification panel to detect
    let meta = document.querySelector('meta[name="ga-measurement-id"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'ga-measurement-id');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', measurementId);

    // Load gtag.js script AFTER initializing dataLayer and gtag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.onload = () => {
      console.log('[GA4] gtag.js loaded successfully');
    };
    script.onerror = () => {
      console.error('[GA4] Failed to load gtag.js');
    };
    document.head.appendChild(script);

    console.log('[GA4] Initialized with measurement ID:', measurementId);
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    if (!measurementId || typeof window === 'undefined') return;
    if (!window.gtag || !initializedRef.current) return;

    // Small delay to ensure page title is updated
    const timeoutId = setTimeout(() => {
      window.gtag('config', measurementId, {
        page_path: location.pathname + location.search,
        page_title: document.title,
        page_location: window.location.href,
      });
      console.log('[GA4] Page view:', location.pathname);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, location.search, measurementId]);

  return null;
}

export default GoogleAnalytics;
