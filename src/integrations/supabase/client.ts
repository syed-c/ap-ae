import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                 || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (!supabaseUrl.startsWith('http')) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: ((url, options) => {
      if (typeof url === 'string' && url.includes('track-visitor')) {
        return fetch(url, {
          ...options,
          credentials: 'omit',
        });
      }
      return fetch(url, options);
    }) as typeof fetch,
  },
});
