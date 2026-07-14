type CookieLike = {
  name: string;
  value: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};

const SUPABASE_AUTH_COOKIE_PATTERN = /^sb-[a-z0-9]+-auth-token(?:\.(\d+))?$/i;
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

function decodeBase64Value(value: string): string | null {
  const normalized = value.replace(/^base64-/, '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);

  try {
    if (typeof atob === 'function') {
      return atob(padded);
    }
  } catch {
    // Ignore and fall through.
  }

  try {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(padded, 'base64').toString('utf8');
    }
  } catch {
    // Ignore and return null below.
  }

  return null;
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function extractTokensFromParsedValue(parsed: unknown): AuthTokens | null {
  if (!parsed) {
    return null;
  }

  if (typeof parsed === 'string') {
    return JWT_PATTERN.test(parsed) ? { accessToken: parsed } : null;
  }

  if (Array.isArray(parsed)) {
    const [first, second] = parsed;

    if (typeof first === 'string' && JWT_PATTERN.test(first)) {
      return {
        accessToken: first,
        refreshToken: typeof second === 'string' ? second : undefined,
      };
    }

    if (typeof first === 'object') {
      return extractTokensFromParsedValue(first);
    }

    return null;
  }

  if (typeof parsed === 'object') {
    const record = parsed as Record<string, unknown>;

    if (typeof record.access_token === 'string' && JWT_PATTERN.test(record.access_token)) {
      return {
        accessToken: record.access_token,
        refreshToken: typeof record.refresh_token === 'string' ? record.refresh_token : undefined,
      };
    }

    if (record.currentSession) {
      return extractTokensFromParsedValue(record.currentSession);
    }

    if (record.session) {
      return extractTokensFromParsedValue(record.session);
    }
  }

  return null;
}

function extractTokensFromCookieValue(cookieValue: string): AuthTokens | null {
  const candidates = new Set<string>();
  const decodedValue = safeDecodeURIComponent(cookieValue);

  candidates.add(cookieValue);
  if (decodedValue) {
    candidates.add(decodedValue);
  }

  for (const candidate of [...candidates]) {
    const base64Decoded = decodeBase64Value(candidate);
    if (base64Decoded) {
      candidates.add(base64Decoded);
    }
  }

  for (const candidate of candidates) {
    const directMatch = extractTokensFromParsedValue(candidate);
    if (directMatch) {
      return directMatch;
    }

    try {
      const parsed = JSON.parse(candidate);
      const parsedMatch = extractTokensFromParsedValue(parsed);
      if (parsedMatch) {
        return parsedMatch;
      }
    } catch {
      // Ignore invalid JSON candidates.
    }
  }

  return null;
}

function collectSupabaseAuthCookieValue(cookies: CookieLike[]): string | null {
  const authCookies = cookies
    .map((cookie) => {
      const match = cookie.name.match(SUPABASE_AUTH_COOKIE_PATTERN);
      if (!match) {
        return null;
      }

      return {
        value: cookie.value,
        chunkIndex: match[1] ? Number(match[1]) : -1,
      };
    })
    .filter((cookie): cookie is { value: string; chunkIndex: number } => Boolean(cookie));

  if (authCookies.length === 0) {
    return null;
  }

  const unchunkedCookie = authCookies.find((cookie) => cookie.chunkIndex === -1);
  if (unchunkedCookie) {
    return unchunkedCookie.value;
  }

  return authCookies
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .map((cookie) => cookie.value)
    .join('');
}

export function parseCookieHeader(cookieHeader: string): CookieLike[] {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader
    .split(';')
    .map((part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) {
        return null;
      }

      return {
        name: part.slice(0, separatorIndex).trim(),
        value: part.slice(separatorIndex + 1).trim(),
      };
    })
    .filter((cookie): cookie is CookieLike => Boolean(cookie));
}

export function getSupabaseAuthTokensFromCookies(cookies: CookieLike[]): AuthTokens | null {
  const cookieValue = collectSupabaseAuthCookieValue(cookies);
  if (!cookieValue) {
    return null;
  }

  return extractTokensFromCookieValue(cookieValue);
}

export function getSupabaseAuthTokensFromCookieHeader(cookieHeader: string): AuthTokens | null {
  return getSupabaseAuthTokensFromCookies(parseCookieHeader(cookieHeader));
}
