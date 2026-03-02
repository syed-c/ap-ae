import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Always use proxy in the browser to bypass DNS poisoning/blocking
const isBrowser = typeof window !== 'undefined';
const supabaseUrl = isBrowser ? `${window.location.origin}/api/sb-proxy/` : rawSupabaseUrl;

if (!rawSupabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env');
}

console.log('Supabase config loaded:', {
  url: supabaseUrl,
  isProxy: isBrowser,
  isLocalhost: isBrowser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'),
  hasKey: !!supabaseKey,
  envKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? 'from env' : 'missing'
});

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
  },
  global: {
    fetch: ((url, options) => {
      // Small optimization: skip tracking calls if they are failing or noisy
      if (typeof url === 'string' && url.includes('track-visitor')) {
        // You could return a dummy response here if desired
      }

      return fetch(url, {
        ...options,
        credentials: 'omit',
      });
    }) as typeof fetch,
  },
});
