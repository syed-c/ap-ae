/**
 * Active Emirates Configuration (UAE Market)
 * 
 * These are the emirates that are live on the platform.
 * All UI features, content management, and location filters
 * MUST use these emirates.
 */

export const ACTIVE_STATE_SLUGS = ['dubai', 'abu-dhabi', 'sharjah', 'ajman', 'ras-al-khaimah', 'fujairah', 'umm-al-quwain'];
export type ActiveStateSlug = 'dubai' | 'abu-dhabi' | 'sharjah' | 'ajman' | 'ras-al-khaimah' | 'fujairah' | 'umm-al-quwain';

export const ACTIVE_STATES = [
  { name: 'Dubai', slug: 'dubai', abbr: 'DXB', fullSlug: 'dubai' },
  { name: 'Abu Dhabi', slug: 'abu-dhabi', abbr: 'AUH', fullSlug: 'abu-dhabi' },
  { name: 'Sharjah', slug: 'sharjah', abbr: 'SHJ', fullSlug: 'sharjah' },
  { name: 'Ajman', slug: 'ajman', abbr: 'AJM', fullSlug: 'ajman' },
  { name: 'Ras Al Khaimah', slug: 'ras-al-khaimah', abbr: 'RAK', fullSlug: 'ras-al-khaimah' },
  { name: 'Fujairah', slug: 'fujairah', abbr: 'FUJ', fullSlug: 'fujairah' },
  { name: 'Umm Al Quwain', slug: 'umm-al-quwain', abbr: 'UAQ', fullSlug: 'umm-al-quwain' },
] as const;

export type ActiveState = typeof ACTIVE_STATES[number];

/**
 * Check if a slug is in the active emirates list
 */
export function isActiveState(slug: string): boolean {
  const lower = slug.toLowerCase();
  return ACTIVE_STATE_SLUGS.includes(lower) || ACTIVE_STATES.some(s => s.fullSlug === lower);
}

/**
 * Map of abbreviation to full slug for DB queries
 */
const ABBREV_TO_FULL: Record<string, string> = Object.fromEntries(
  ACTIVE_STATES.map(s => [s.abbr.toLowerCase(), s.fullSlug])
);

export function getFullSlug(slug: string): string {
  const lower = slug.toLowerCase();
  return ABBREV_TO_FULL[lower] ?? lower;
}

/**
 * Filter an array of emirates to only include active ones
 */
export function filterActiveStates<T extends { slug?: string | null }>(states: T[]): T[] {
  return states.filter(state => state.slug && isActiveState(state.slug));
}

/**
 * Get emirate info by slug
 */
export function getActiveStateBySlug(slug: string): ActiveState | undefined {
  return ACTIVE_STATES.find(s => s.slug === slug.toLowerCase());
}

/**
 * Check if an SEO page slug belongs to an active emirate.
 */
export function isPageInActiveState(pageSlug: string, pageType?: string): boolean {
  const normalized = pageSlug.replace(/^\/+/, '').toLowerCase();
  
  if (pageType === 'static' || pageType === 'blog' || pageType === 'clinic' || 
      pageType === 'dentist' || pageType === 'treatment') {
    return true;
  }
  
  if (!normalized || normalized === '/') {
    return true;
  }
  
  for (const stateSlug of ACTIVE_STATE_SLUGS) {
    if (normalized === stateSlug || normalized.startsWith(`${stateSlug}/`)) {
      return true;
    }
  }
  
  if (normalized.startsWith('services/') || normalized === 'services') {
    return true;
  }
  
  return false;
}
