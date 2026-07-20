import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
               || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Falling back instead of throwing here matters: this module is imported by
// many client components, so Next.js's build-time "collecting page data"
// step (which statically imports every page module, including ones that
// never call `supabase` themselves) would crash the entire build in any
// environment without these exact env vars - e.g. CI, which intentionally
// doesn't carry production credentials. Server-side code already follows
// this same graceful pattern (see src/lib/supabaseServer.ts). Real runtime
// usage in the browser always has the real NEXT_PUBLIC_* values inlined at
// build time by whichever environment actually deploys the app.
if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
  console.warn('Supabase client env vars are missing or invalid - using a placeholder client. Real requests will fail until NEXT_PUBLIC_SUPABASE_URL/NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
  supabaseUrl = 'https://placeholder.supabase.co';
  supabaseKey = 'placeholder-anon-key';
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


