import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

/**
 * Server-side Supabase client for use in getServerSideProps and getStaticProps.
 * Uses the anon key (same as client) — RLS policies still apply.
 * For admin operations, use the service role key instead.
 */
export function createServerSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
             || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
        console.warn('Missing Supabase env vars - returning null client');
        return null;
    }

    if (!url.startsWith('http')) {
        console.warn('Invalid Supabase URL - returning null client');
        return null;
    }

    return createClient<Database>(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}

/**
 * Admin server-side Supabase client for build-time data fetching.
 * Uses service role key to bypass RLS - faster for SSG builds.
 */
export function createServerSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.warn('Missing Supabase service role key - falling back to anon');
        return createServerSupabase();
    }

    return createClient<Database>(url, key, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    });
}
