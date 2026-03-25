import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * Server-side Supabase client for use in getServerSideProps.
 * Uses the anon key (same as client) — RLS policies still apply.
 * For admin operations, use the service role key instead.
 */
export function createServerSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
             || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }

    if (!url.startsWith('http')) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL must be a valid URL');
    }

    return createClient<Database>(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
