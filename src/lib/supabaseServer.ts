import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getSupabaseAuthTokensFromCookieHeader } from '@/lib/supabaseAuthCookies';

function hasPlaceholderValue(value: string) {
    return value.includes('your-project-ref')
        || value.includes('your-public-anon-key')
        || value.includes('your-service-role-key');
}

function isConfiguredSupabaseEnv(url: string | undefined, key: string | undefined) {
    return Boolean(
        url
        && key
        && url.startsWith('http')
        && !hasPlaceholderValue(url)
        && !hasPlaceholderValue(key)
    );
}

/**
 * Server-side Supabase client for use in getServerSideProps and getStaticProps.
 * Uses the anon key (same as client) — RLS policies still apply.
 * For admin operations, use the service role key instead.
 */
export function createServerSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
             || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!isConfiguredSupabaseEnv(url, key)) {
        console.warn('Supabase env vars are missing or using placeholder values - returning null client');
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

    if (!isConfiguredSupabaseEnv(url, key)) {
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

/**
 * Resolve the authenticated user from the Supabase auth cookie in SSR requests.
 * This avoids assuming that a generic server client is already session-bound.
 */
export async function getServerUserFromCookieHeader(cookieHeader: string) {
    const authTokens = getSupabaseAuthTokensFromCookieHeader(cookieHeader);
    const supabase = createServerSupabase();

    if (!authTokens?.accessToken || !supabase) {
        return null;
    }

    try {
        const { data, error } = await supabase.auth.getUser(authTokens.accessToken);
        if (error) {
            return null;
        }

        return data.user ?? null;
    } catch {
        return null;
    }
}
