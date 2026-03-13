import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Use direct Supabase URL for better compatibility
const supabaseUrl = rawSupabaseUrl;

if (!rawSupabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing! Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are set in .env');
}

console.log('Supabase config loaded:', {
  url: supabaseUrl,
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
