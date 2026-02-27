/**
 * useAreaLocalContent - Provides unique neighborhood context for area pages
 * 
 * Returns localized content hooks (character, demographics, landmarks, narrative)
 * that differentiate each area page's content from others.
 */

// UAE Area Local Context Database
const AREA_LOCAL_CONTEXT: Record<string, {
  character: string;
  demographics: string;
  landmarks: string[];
  narrative: string;
  description: string;
}> = {
  'jumeirah': {
    character: 'upscale beachfront residential',
    demographics: 'affluent families and expat professionals',
    landmarks: ['Jumeirah Mosque', 'Kite Beach', 'La Mer'],
    narrative: 'family-focused wellness',
    description: 'one of Dubai\'s most prestigious beachfront neighborhoods, known for luxury villas and a family-oriented lifestyle',
  },
  'dubai-marina': {
    character: 'cosmopolitan waterfront towers',
    demographics: 'young professionals and international residents',
    landmarks: ['Marina Walk', 'Dubai Marina Mall', 'Ain Dubai'],
    narrative: 'modern lifestyle convenience',
    description: 'a vibrant waterfront community with stunning high-rise living and a cosmopolitan atmosphere',
  },
  'deira': {
    character: 'historic commercial district',
    demographics: 'diverse multicultural community',
    landmarks: ['Gold Souk', 'Deira City Centre', 'Dubai Creek'],
    narrative: 'heritage-meets-accessibility',
    description: 'Dubai\'s historic heart, where traditional souks meet modern commerce along the Creek',
  },
  'business-bay': {
    character: 'modern commercial hub',
    demographics: 'corporate professionals and urban residents',
    landmarks: ['Dubai Canal', 'Bay Avenue', 'Marasi Drive'],
    narrative: 'efficiency-first corporate care',
    description: 'Dubai\'s thriving business district with the iconic Dubai Canal running through its modern towers',
  },
  'downtown-dubai': {
    character: 'premium urban landmark district',
    demographics: 'tourists, luxury residents and business travelers',
    landmarks: ['Burj Khalifa', 'Dubai Mall', 'Dubai Fountain'],
    narrative: 'world-class premium dental',
    description: 'the heart of modern Dubai, home to the Burj Khalifa and some of the world\'s most iconic attractions',
  },
  'al-barsha': {
    character: 'established residential and retail hub',
    demographics: 'families, students and mid-range professionals',
    landmarks: ['Mall of the Emirates', 'Barsha Park'],
    narrative: 'value-driven family dentistry',
    description: 'a well-established residential area anchored by Mall of the Emirates and excellent transport links',
  },
  'healthcare-city': {
    character: 'medical free zone and health hub',
    demographics: 'medical tourists and specialist-seekers',
    landmarks: ['DHCC', 'Mediclinic', 'Al Jalila Foundation'],
    narrative: 'specialist medical destination',
    description: 'the UAE\'s premier healthcare free zone, purpose-built to house world-class medical facilities and specialists',
  },
  'jbr': {
    character: 'beachfront leisure and tourism strip',
    demographics: 'tourists, hotel residents and coastal lifestyle',
    landmarks: ['The Walk', 'Bluewaters Island', 'JBR Beach'],
    narrative: 'resort-style dental experience',
    description: 'a popular beachfront destination with The Walk promenade and stunning views of Ain Dubai',
  },
  'jlt': {
    character: 'mid-range lakeside towers',
    demographics: 'young professionals and small families',
    landmarks: ['JLT Park', 'Cluster towers', 'Dubai Metro'],
    narrative: 'affordable professional care',
    description: 'a well-connected community of lakeside towers popular with young professionals seeking affordability',
  },
  'al-safa': {
    character: 'leafy residential enclave near Jumeirah',
    demographics: 'established families and villa residents',
    landmarks: ['Safa Park', 'City Walk'],
    narrative: 'quiet neighborhood dentistry',
    description: 'a green residential enclave centered around the beloved Safa Park, popular with families',
  },
  'bur-dubai': {
    character: 'vibrant old-town cultural melting pot',
    demographics: 'diverse residents, workers and heritage visitors',
    landmarks: ['Dubai Museum', 'Meena Bazaar', 'Textile Souk'],
    narrative: 'accessible multilingual care',
    description: 'a culturally rich district where Dubai\'s heritage comes alive through historic sites and diverse communities',
  },
  'international-city': {
    character: 'affordable multicultural township',
    demographics: 'budget-conscious residents and new immigrants',
    landmarks: ['Dragon Mart', 'Central Park'],
    narrative: 'budget-friendly community dental',
    description: 'a diverse and affordable community known for Dragon Mart and multicultural living',
  },
  'difc': {
    character: 'premium financial free zone',
    demographics: 'executives, finance professionals and diplomats',
    landmarks: ['Gate Building', 'DIFC Art Nights', 'Gate Avenue'],
    narrative: 'executive concierge dentistry',
    description: 'the Middle East\'s leading financial hub, housing global banks and premium lifestyle offerings',
  },
  'discovery-gardens': {
    character: 'affordable garden-themed community',
    demographics: 'families and mid-income residents',
    landmarks: ['Ibn Battuta Mall', 'Gardens community'],
    narrative: 'community-centered family care',
    description: 'a popular garden-themed residential community near Ibn Battuta Mall',
  },
  'jvc': {
    character: 'emerging family-friendly community',
    demographics: 'young families and first-time homeowners',
    landmarks: ['JVC Park', 'Circle Mall'],
    narrative: 'growing community wellness',
    description: 'a rapidly growing family-friendly community with parks, schools and improving amenities',
  },
  'al-nahda-dubai': {
    character: 'border community shared with Sharjah',
    demographics: 'cross-border commuters and mixed residents',
    landmarks: ['Al Nahda Park', 'Sahara Centre'],
    narrative: 'convenient cross-emirate care',
    description: 'a strategic border community connecting Dubai and Sharjah, popular with commuters',
  },
  'al-quoz': {
    character: 'industrial-turned-creative district',
    demographics: 'artists, gallery-goers and workers',
    landmarks: ['Alserkal Avenue', 'Al Quoz Industrial'],
    narrative: 'creative district healthcare',
    description: 'Dubai\'s creative heartland, home to Alserkal Avenue and a growing arts scene',
  },
  'al-rashidiya': {
    character: 'established residential near airport',
    demographics: 'families, airport workers and long-term residents',
    landmarks: ['Rashidiya Metro', 'DXB Airport'],
    narrative: 'airport-accessible dental care',
    description: 'a well-established residential area near Dubai International Airport with excellent metro connectivity',
  },
  'dubai-hills': {
    character: 'premium master-planned community',
    demographics: 'affluent families and villa owners',
    landmarks: ['Dubai Hills Mall', 'Dubai Hills Park', 'Golf Club'],
    narrative: 'premium suburban wellness',
    description: 'a premium master-planned community featuring parks, a championship golf course and the new Dubai Hills Mall',
  },
  'al-mamzar': {
    character: 'coastal residential near Sharjah border',
    demographics: 'mixed-income families and beachgoers',
    landmarks: ['Al Mamzar Beach Park', 'Mamzar Corniche'],
    narrative: 'seaside community care',
    description: 'a relaxed coastal community known for its sprawling beach park and proximity to Sharjah',
  },
  'al-warqa': {
    character: 'quiet suburban residential area',
    demographics: 'local Emirati families and long-term residents',
    landmarks: ['Al Warqa Park', 'Warqa City Mall'],
    narrative: 'trusted neighborhood dentistry',
    description: 'a quiet residential suburb popular with Emirati families and long-term residents',
  },
};

export interface AreaLocalContent {
  character: string;
  demographics: string;
  landmarks: string[];
  narrative: string;
  description: string;
  hasLocalContext: boolean;
}

export function useAreaLocalContent(areaSlug: string | undefined): AreaLocalContent {
  if (!areaSlug) {
    return {
      character: '',
      demographics: '',
      landmarks: [],
      narrative: '',
      description: '',
      hasLocalContext: false,
    };
  }

  const context = AREA_LOCAL_CONTEXT[areaSlug];
  if (!context) {
    return {
      character: '',
      demographics: '',
      landmarks: [],
      narrative: '',
      description: '',
      hasLocalContext: false,
    };
  }

  return {
    ...context,
    hasLocalContext: true,
  };
}

/**
 * Generate a unique intro paragraph for an area page using local context
 */
export function generateAreaIntro(
  areaName: string,
  emirateName: string,
  clinicCount: number,
  localContent: AreaLocalContent
): string {
  if (!localContent.hasLocalContext) {
    return `Explore ${clinicCount}+ dental clinics in ${areaName}, ${emirateName}. Compare verified professionals, read patient reviews, and book your appointment today.`;
  }

  const landmarkMention = localContent.landmarks.length > 0
    ? ` near ${localContent.landmarks[0]}`
    : '';

  return `${areaName} is ${localContent.description}. With ${clinicCount}+ dental clinics serving ${localContent.demographics}${landmarkMention}, finding the right dentist for your needs has never been easier. Whether you need a routine check-up or specialized treatment, ${areaName}'s dental professionals understand the unique needs of this ${localContent.character} community.`;
}
