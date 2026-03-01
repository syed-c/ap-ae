'use client';

/**
 * TrailingSlashRedirect - Disabled
 * 
 * Disabled to prevent an infinite redirect loop with Next.js default routing,
 * which strips trailing slashes by default unless configured otherwise.
 */
export function TrailingSlashRedirect() {
  return null;
}
