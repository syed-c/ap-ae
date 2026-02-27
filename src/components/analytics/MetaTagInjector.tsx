'use client'

/**
 * MetaTagInjector - Dynamically injects meta tags, verification codes,
 * tracking pixels, and custom scripts from global_settings into the document head.
 *
 * Reads these keys from global_settings:
 * - google_search_console: verification_code, verification_code_2
 * - tracking_pixels: facebook_pixel_id
 * - custom_scripts: head_scripts, body_scripts
 */

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SettingsMap {
  google_search_console?: {
    verification_code?: string;
    verification_code_2?: string;
  };
  tracking_pixels?: {
    facebook_pixel_id?: string;
  };
  custom_scripts?: {
    head_scripts?: string;
    body_scripts?: string;
  };
}

export function MetaTagInjector() {
  const { data: settings } = useQuery({
    queryKey: ['meta-tag-injector-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_settings')
        .select('key, value')
        .in('key', ['google_search_console', 'tracking_pixels', 'custom_scripts']);
      if (error) throw error;
      const map: SettingsMap = {};
      for (const row of data || []) {
        (map as any)[row.key] = row.value;
      }
      return map;
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  // Inject Google Search Console verification meta tags
  useEffect(() => {
    if (!settings?.google_search_console) return;

    // Extract just the content value if user pasted full meta tag HTML
    const extractCode = (raw?: string) => {
      if (!raw) return null;
      const match = raw.match(/content="([^"]+)"/);
      return match ? match[1] : raw.trim();
    };

    const codes = [
      extractCode(settings.google_search_console.verification_code),
      extractCode(settings.google_search_console.verification_code_2),
    ].filter(Boolean) as string[];

    const injected: HTMLMetaElement[] = [];

    for (const code of codes) {
      // Skip if already present in static HTML
      const existing = document.querySelector(
        `meta[name="google-site-verification"][content="${code}"]`
      );
      if (existing) continue;

      const meta = document.createElement('meta');
      meta.name = 'google-site-verification';
      meta.content = code;
      meta.setAttribute('data-injected', 'true');
      document.head.appendChild(meta);
      injected.push(meta);
    }

    return () => {
      injected.forEach((el) => el.remove());
    };
  }, [settings?.google_search_console]);

  // Inject Facebook Pixel
  useEffect(() => {
    if (!settings?.tracking_pixels?.facebook_pixel_id) return;
    const pixelId = settings.tracking_pixels.facebook_pixel_id;

    // Skip if already loaded
    if ((window as any).fbq) return;

    const script = document.createElement('script');
    script.setAttribute('data-injected', 'true');
    script.textContent = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${pixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    // Add noscript pixel
    const noscript = document.createElement('noscript');
    noscript.setAttribute('data-injected', 'true');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.head.appendChild(noscript);

    console.log('[MetaTagInjector] Facebook Pixel loaded:', pixelId);

    return () => {
      script.remove();
      noscript.remove();
    };
  }, [settings?.tracking_pixels?.facebook_pixel_id]);

  // Inject custom head scripts
  useEffect(() => {
    if (!settings?.custom_scripts?.head_scripts) return;
    const container = document.createElement('div');
    container.setAttribute('data-injected', 'true');
    container.innerHTML = settings.custom_scripts.head_scripts;

    // Move child nodes into head
    const nodes: Node[] = [];
    while (container.firstChild) {
      const node = container.firstChild;
      document.head.appendChild(node);
      nodes.push(node);
    }

    return () => {
      nodes.forEach((n) => n.parentNode?.removeChild(n));
    };
  }, [settings?.custom_scripts?.head_scripts]);

  // Inject custom body scripts
  useEffect(() => {
    if (!settings?.custom_scripts?.body_scripts) return;
    const container = document.createElement('div');
    container.setAttribute('data-injected', 'true');
    container.innerHTML = settings.custom_scripts.body_scripts;

    const nodes: Node[] = [];
    while (container.firstChild) {
      const node = container.firstChild;
      document.body.appendChild(node);
      nodes.push(node);
    }

    return () => {
      nodes.forEach((n) => n.parentNode?.removeChild(n));
    };
  }, [settings?.custom_scripts?.body_scripts]);

  return null;
}

export default MetaTagInjector;
