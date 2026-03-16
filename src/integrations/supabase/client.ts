import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                 || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

// Use direct Supabase URL for better compatibility
const supabaseUrl = rawSupabaseUrl;

if (!rawSupabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing! Build will continue but SSG pages may not pre-render');
}

// Only create client if we have valid credentials, otherwise use a placeholder
const isValidConfig = rawSupabaseUrl && supabaseKey && rawSupabaseUrl.startsWith('http');

export const supabase: SupabaseClient<Database> = isValidConfig
  ? createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: true,
      },
      global: {
        fetch: ((url, options) => {
          if (typeof url === 'string' && url.includes('track-visitor')) {
            // Skip tracking calls
          }
          return fetch(url, {
            ...options,
            credentials: 'omit',
          });
        }) as typeof fetch,
      },
    })
  : createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false }
    });
