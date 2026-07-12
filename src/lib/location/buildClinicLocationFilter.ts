const CITY_ADDRESS_ALIASES: Record<string, string[]> = {
  'business-bay': ['Business Bay'],
  'downtown-dubai': ['Downtown Dubai', 'Downtown'],
  'dubai-marina': ['Dubai Marina', 'Marina'],
  'palm-jumeirah': ['Palm Jumeirah', 'The Palm Jumeirah'],
  'bur-dubai': ['Bur Dubai'],
  'jumeirah-beach-residence': ['Jumeirah Beach Residence', 'JBR'],
  jlt: ['JLT', 'Jumeirah Lakes Towers'],
  jvc: ['JVC', 'Jumeirah Village Circle'],
  jvt: ['JVT', 'Jumeirah Village Triangle'],
  difc: ['DIFC', 'Dubai International Financial Centre'],
  'healthcare-city': ['Healthcare City', 'Dubai Healthcare City'],
  'al-nahda-dubai': ['Al Nahda'],
  'al-nahda-sharjah': ['Al Nahda'],
  'al-mamzar-sharjah': ['Al Mamzar'],
  'al-wahda-sharjah': ['Al Wahda'],
  'al-salamah-uaq': ['Al Salamah'],
  'al-nakheel-rak': ['Al Nakheel'],
};

function sanitizeFilterTerm(value: string): string {
  return value.replace(/[%_,]/g, '').trim();
}

export function getCityAddressTerms(citySlug: string, cityName: string, stateName?: string): string[] {
  const aliases = CITY_ADDRESS_ALIASES[citySlug] || [];

  return Array.from(
    new Set(
      [cityName, ...aliases]
        .map((term) => sanitizeFilterTerm(term))
        .filter(Boolean)
    )
  );
}

export function buildClinicLocationOrFilter({
  cityId,
  citySlug,
  cityName,
  stateName,
}: {
  cityId: string;
  citySlug: string;
  cityName: string;
  stateName?: string;
}): string {
  const stateTerm = sanitizeFilterTerm(stateName || '');
  const addressClauses = getCityAddressTerms(citySlug, cityName, stateName).map((term) =>
    stateTerm
      ? `and(address.ilike.%${term}%,address.ilike.%${stateTerm}%)`
      : `address.ilike.%${term}%`
  );

  return [`city_id.eq.${cityId}`, ...addressClauses].join(',');
}
