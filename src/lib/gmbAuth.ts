import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Centralized helpers for Google Business (GMB) OAuth token persistence.
//
// Why this exists:
// - Supabase provider_token is often only available right after the OAuth exchange.
// - We keep a best-effort in-memory browser copy for the current tab only.
// - Long-lived persistence is handled server-side via gmb-store-token.
//
// IMPORTANT: When a logged-in user syncs GMB with a DIFFERENT Google account,
// we need to capture the GMB token but NOT replace their auth session.
// The original Supabase session is stored server-side behind a one-time restore token.

const SESSION_TOKEN_KEY = 'gmb_provider_token';
const GMB_LISTING_FLOW_KEY = 'gmb_listing_flow';
const GMB_RELINK_FLOW_KEY = 'gmb_relink_flow';
const GMB_PENDING_KEY = 'gmb_pending';
const GMB_RESTORE_SESSION_KEY = 'gmb_restore_session';
const GMB_LINK_TOKEN_KEY = 'gmb_link_token';

type StoredToken = {
  token: string;
  expiresAt: number; // epoch ms
};

type RestoredSession = {
  accessToken: string;
  refreshToken: string;
  userId: string;
};

type GmbFlowFlag = 'listing' | 'relink' | 'pending' | 'restoreSession';

const FLOW_FLAG_KEYS: Record<GmbFlowFlag, string> = {
  listing: GMB_LISTING_FLOW_KEY,
  relink: GMB_RELINK_FLOW_KEY,
  pending: GMB_PENDING_KEY,
  restoreSession: GMB_RESTORE_SESSION_KEY,
};

function getSessionStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function getLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function readSessionItem(key: string): string | null {
  try {
    return getSessionStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeSessionItem(key: string, value: string) {
  try {
    getSessionStorage()?.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeSessionItem(key: string) {
  try {
    getSessionStorage()?.removeItem(key);
  } catch {
    // ignore
  }
}

export function setGmbProviderToken(token: string, ttlMinutes = 55) {
  try {
    const meta: StoredToken = {
      token,
      expiresAt: Date.now() + ttlMinutes * 60_000,
    };
    writeSessionItem(SESSION_TOKEN_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

export function getGmbProviderToken(): string | null {
  try {
    const raw = readSessionItem(SESSION_TOKEN_KEY);
    if (!raw) return null;

    const meta = JSON.parse(raw) as StoredToken;
    if (!meta?.token || !meta?.expiresAt) {
      removeSessionItem(SESSION_TOKEN_KEY);
      return null;
    }

    if (Date.now() > meta.expiresAt) {
      removeSessionItem(SESSION_TOKEN_KEY);
      return null;
    }

    return meta.token;
  } catch {
    return null;
  }
}

export function clearGmbProviderToken() {
  removeSessionItem(SESSION_TOKEN_KEY);
}

export async function createAuthRestoreState(session: Session, flow: 'gmb' | 'relink') {
  const refreshToken = session.refresh_token;
  if (!refreshToken) {
    throw new Error('Missing refresh token for the current session. Please sign in again.');
  }

  const { data, error } = await supabase.functions.invoke('create-auth-restore', {
    headers: { Authorization: `Bearer ${session.access_token}` },
    body: {
      accessToken: session.access_token,
      refreshToken,
      flow,
    },
  });

  if (error) {
    throw error;
  }

  if (!data?.restoreToken) {
    throw new Error('Failed to create an auth restore state.');
  }

  return data.restoreToken as string;
}

export async function consumeAuthRestoreState(currentAccessToken: string, restoreToken: string) {
  const { data, error } = await supabase.functions.invoke('consume-auth-restore', {
    headers: { Authorization: `Bearer ${currentAccessToken}` },
    body: { restoreToken },
  });

  if (error) {
    throw error;
  }

  const restoredSession = data as RestoredSession | null;
  if (!restoredSession?.accessToken || !restoredSession?.refreshToken || !restoredSession?.userId) {
    throw new Error('Auth restore state was missing required session data.');
  }

  return restoredSession;
}

export function setGmbFlowFlag(flag: GmbFlowFlag, enabled: boolean) {
  const key = FLOW_FLAG_KEYS[flag];
  if (enabled) {
    writeSessionItem(key, 'true');
    return;
  }

  removeSessionItem(key);
}

export function getGmbFlowFlag(flag: GmbFlowFlag): boolean {
  return readSessionItem(FLOW_FLAG_KEYS[flag]) === 'true';
}

export function setGmbLinkToken(token: string) {
  writeSessionItem(GMB_LINK_TOKEN_KEY, token);
}

export function getGmbLinkToken(): string | null {
  return readSessionItem(GMB_LINK_TOKEN_KEY);
}

export function clearGmbLinkToken() {
  removeSessionItem(GMB_LINK_TOKEN_KEY);
}

export function clearGmbFlowState() {
  removeSessionItem(GMB_LISTING_FLOW_KEY);
  removeSessionItem(GMB_RELINK_FLOW_KEY);
  removeSessionItem(GMB_PENDING_KEY);
  removeSessionItem(GMB_RESTORE_SESSION_KEY);
  removeSessionItem(GMB_LINK_TOKEN_KEY);
}

export function hasActiveGmbFlow() {
  return getGmbFlowFlag('listing')
    || getGmbFlowFlag('relink')
    || getGmbFlowFlag('pending')
    || getGmbFlowFlag('restoreSession');
}

export function buildGmbAuthCallbackUrl(query?: string | URLSearchParams) {
  if (typeof window === 'undefined') {
    return '/auth/callback';
  }

  const callbackUrl = new URL('/auth/callback', window.location.origin);

  if (typeof query === 'string') {
    const params = new URLSearchParams(query.startsWith('?') ? query.slice(1) : query);
    params.forEach((value, key) => callbackUrl.searchParams.set(key, value));
  } else if (query instanceof URLSearchParams) {
    query.forEach((value, key) => callbackUrl.searchParams.set(key, value));
  }

  return callbackUrl.toString();
}

/**
 * Clear ALL GMB-related cache and tokens.
 * Use this when switching OAuth credentials or troubleshooting auth issues.
 */
export function clearAllGmbCache() {
  // Clear provider tokens
  clearGmbProviderToken();

  // Clear any flow markers and old legacy localStorage remnants.
  clearGmbFlowState();

  try {
    const legacyLocalStorage = getLocalStorage();
    legacyLocalStorage?.removeItem(GMB_LISTING_FLOW_KEY);
    legacyLocalStorage?.removeItem(GMB_RELINK_FLOW_KEY);
    legacyLocalStorage?.removeItem(GMB_PENDING_KEY);
    legacyLocalStorage?.removeItem(GMB_RESTORE_SESSION_KEY);
    legacyLocalStorage?.removeItem(GMB_LINK_TOKEN_KEY);
    legacyLocalStorage?.removeItem('gmb_original_session_v1');
    legacyLocalStorage?.removeItem('gmb_original_user_id');
  } catch {
    // ignore
  }
}
