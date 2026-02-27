// ============================================================================
// serve-static Edge Function
// Serves pre-rendered HTML to search bots for SEO indexability
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BASE_URL = "https://www.appointpanda.ae";

// IMPORTANT:
// When we call Prerender.io, we must NOT use a bot User-Agent.
// If we do, our Vercel bot rewrite will route Prerender's fetch back to /serve-static,
// causing recursion and incomplete/empty HTML captures.
const BROWSER_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const ASSET_EXTENSIONS = [
  ".js", ".css", ".map", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico",
  ".woff", ".woff2", ".ttf", ".otf", ".eot", ".pdf", ".xml", ".txt", ".json", ".mp4", ".webm",
];

function isAssetPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (lower.startsWith("/assets/")) return true;
  return ASSET_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Page Registry - Inline for edge function (mirrors src/config/pageRegistry.ts)
 */
const INDEXABLE_ROUTE_PATTERNS = [
  { route: '/', pageType: 'home' },
  { route: '/about', pageType: 'static' },
  { route: '/contact', pageType: 'static' },
  { route: '/faq', pageType: 'static' },
  { route: '/how-it-works', pageType: 'static' },
  { route: '/privacy', pageType: 'static' },
  { route: '/terms', pageType: 'static' },
  { route: '/sitemap', pageType: 'static' },
  { route: '/pricing', pageType: 'static' },
  { route: '/services', pageType: 'service' },
  { route: '/blog', pageType: 'blog-index' },
  { route: '/insurance', pageType: 'insurance-index' },
  // IMPORTANT: Specific prefixed routes MUST come before generic wildcard routes
  { route: '/services/:serviceSlug', pageType: 'service' },
  { route: '/clinic/:clinicSlug', pageType: 'clinic' },
  { route: '/dentist/:dentistSlug', pageType: 'dentist' },
  { route: '/blog/:postSlug', pageType: 'blog-post' },
  { route: '/insurance/:insuranceSlug', pageType: 'insurance-detail' },
  { route: '/cost/:serviceSlug', pageType: 'cost-guide' },
  { route: '/compare/:serviceSlug/:comparison', pageType: 'comparison' },
  // Generic wildcard routes LAST (these match any slug)
  { route: '/:stateSlug', pageType: 'state' },
  { route: '/:stateSlug/:citySlug', pageType: 'city' },
  { route: '/:stateSlug/:citySlug/:serviceSlug', pageType: 'service-location' },
];

const PRIVATE_ROUTE_PATTERNS = [
  '/admin', '/dashboard', '/auth', '/onboarding', '/gmb-select',
  '/claim-profile', '/list-your-practice', '/review/', '/rq/',
  '/appointment/', '/form/', '/book/', '/search', '/find-dentist',
];

// Active Emirates (must match database slugs exactly)
const CORE_STATES = [
  { name: 'Dubai', slug: 'dubai' },
  { name: 'Abu Dhabi', slug: 'abu-dhabi' },
  { name: 'Sharjah', slug: 'sharjah' },
  { name: 'Ajman', slug: 'ajman' },
  { name: 'Ras Al Khaimah', slug: 'ras-al-khaimah' },
  { name: 'Fujairah', slug: 'fujairah' },
  { name: 'Umm Al Quwain', slug: 'umm-al-quwain' },
];

// Core services for fallback navigation (must match treatment slugs)
const CORE_SERVICES = [
  { name: 'Teeth Whitening', slug: 'teeth-whitening' },
  { name: 'Dental Implants', slug: 'dental-implants' },
  { name: 'Invisalign', slug: 'invisalign' },
  { name: 'Root Canal', slug: 'root-canal' },
  { name: 'Dental Crowns', slug: 'dental-crowns' },
  { name: 'Dental Veneers', slug: 'dental-veneers' },
  { name: 'Dental Bridges', slug: 'dental-bridges' },
  { name: 'Dentures', slug: 'dentures' },
  { name: 'Cosmetic Dentistry', slug: 'cosmetic-dentistry' },
  { name: 'Emergency Dental Care', slug: 'emergency-dental-care' },
  { name: 'Teeth Cleaning', slug: 'teeth-cleaning' },
  { name: 'Dental Fillings', slug: 'dental-fillings' },
  { name: 'Braces', slug: 'braces' },
  { name: 'Wisdom Teeth Removal', slug: 'wisdom-teeth-removal' },
  { name: 'Dental X-Ray', slug: 'dental-x-ray' },
  { name: 'Gum Treatment', slug: 'gum-treatment' },
  { name: 'Pediatric Dentistry', slug: 'pediatric-dentistry' },
  { name: 'Dental Check-up', slug: 'dental-check-up' },
  { name: 'Tooth Extraction', slug: 'tooth-extraction' },
  { name: 'Smile Makeover', slug: 'smile-makeover' },
  { name: 'Hollywood Smile', slug: 'hollywood-smile' },
];

function matchRoute(routePattern: string, actualPath: string): boolean {
  const routeParts = routePattern.split('/').filter(Boolean);
  const pathParts = actualPath.split('/').filter(Boolean);

  if (routeParts.length !== pathParts.length) return false;

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const pathPart = pathParts[i];
    if (routePart.startsWith(':')) {
      if (!pathPart) return false;
      continue;
    }
    if (routePart !== pathPart) return false;
  }

  return true;
}

function classifyPath(pathname: string): { indexable: boolean; pageType: string | null } {
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');

  for (const pattern of PRIVATE_ROUTE_PATTERNS) {
    if (normalizedPath.startsWith(pattern)) {
      return { indexable: false, pageType: null };
    }
  }

  for (const { route, pageType } of INDEXABLE_ROUTE_PATTERNS) {
    if (matchRoute(route, normalizedPath)) {
      // For /:stateSlug/:citySlug pattern, check if second segment is a service slug
      // If so, reclassify as 'state-service' page (e.g., /dubai/teeth-whitening/)
      if (pageType === 'city') {
        const parts = normalizedPath.split('/').filter(Boolean);
        if (parts.length === 2) {
          const isEmirateSlug = CORE_STATES.some(s => s.slug === parts[0]);
          const isServiceSlug = CORE_SERVICES.some(s => s.slug === parts[1]);
          if (isEmirateSlug && isServiceSlug) {
            return { indexable: true, pageType: 'state-service' };
          }
        }
      }
      return { indexable: true, pageType };
    }
  }

  return { indexable: false, pageType: null };
}

/**
 * Extract path segments for generating contextual content
 */
function extractPathInfo(path: string): { stateSlug?: string; citySlug?: string; serviceSlug?: string; clinicSlug?: string; dentistSlug?: string } {
  const parts = path.replace(/\/+$/, '').split('/').filter(Boolean);

  if (parts[0] === 'services' && parts[1]) {
    return { serviceSlug: parts[1] };
  }

  if (parts[0] === 'clinic' && parts[1]) {
    return { clinicSlug: parts[1] };
  }

  if (parts[0] === 'dentist' && parts[1]) {
    return { dentistSlug: parts[1] };
  }

  if (parts[0] === 'cost' && parts[1]) {
    return { serviceSlug: parts[1] };
  }

  if (parts[0] === 'compare' && parts[1]) {
    return { serviceSlug: parts[1] };
  }

  if (parts.length === 1 && !['blog', 'insurance', 'services', 'about', 'contact', 'faq', 'privacy', 'terms', 'pricing', 'sitemap', 'how-it-works', 'cost', 'compare'].includes(parts[0])) {
    return { stateSlug: parts[0] };
  }

  if (parts.length === 2) {
    // Check if second part is a service (state-service page)
    const isServiceSlug = CORE_SERVICES.some(s => s.slug === parts[1]);
    if (isServiceSlug && CORE_STATES.some(s => s.slug === parts[0])) {
      return { stateSlug: parts[0], serviceSlug: parts[1] };
    }
    return { stateSlug: parts[0], citySlug: parts[1] };
  }

  if (parts.length === 3) {
    return { stateSlug: parts[0], citySlug: parts[1], serviceSlug: parts[2] };
  }

  return {};
}

function formatSlugToName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Fetch real SEO content from database for the fallback HTML
 */
async function fetchSeoContent(supabase: any, path: string): Promise<{
  h1?: string;
  meta_title?: string;
  meta_description?: string;
  content?: string;
  faqs?: { question: string; answer: string }[];
} | null> {
  try {
    // Try multiple slug formats
    const normalizedPath = path.replace(/^\/|\/$/g, '');
    const candidates = [
      normalizedPath,
      `/${normalizedPath}`,
      `/${normalizedPath}/`,
      normalizedPath.replace(/\/$/, ''),
    ];

    const { data } = await supabase
      .from('seo_pages')
      .select('h1, meta_title, meta_description, content, faqs')
      .in('slug', candidates)
      .limit(1)
      .maybeSingle();

    // Parse FAQs from content if faqs column is empty
    if (data && !data.faqs && data.content) {
      const faqs = parseFaqsFromContent(data.content);
      data.faqs = faqs;
    }

    return data;
  } catch (err) {
    console.log('Failed to fetch SEO content:', err);
    return null;
  }
}

/**
 * Parse FAQs from markdown content
 */
function parseFaqsFromContent(content: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const lines = content.split('\n');
  let inFaqSection = false;
  let currentQuestion = '';
  let currentAnswer = '';

  for (const line of lines) {
    if (line.toLowerCase().includes('frequently asked') || line.toLowerCase().includes('faq')) {
      inFaqSection = true;
      continue;
    }

    if (inFaqSection) {
      // Match Q: or **Q:** or ### Question patterns
      const questionMatch = line.match(/^(?:\*\*)?(?:Q:|Question:|\d+\.)?\s*(.+?)(?:\*\*)?$/);
      if (line.startsWith('### ') || line.startsWith('**Q:') || line.match(/^\d+\.\s+\*\*/)) {
        if (currentQuestion && currentAnswer) {
          faqs.push({ question: currentQuestion.trim(), answer: currentAnswer.trim() });
        }
        currentQuestion = line.replace(/^#{1,3}\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^\d+\.\s*/, '');
        currentAnswer = '';
      } else if (line.startsWith('A:') || line.startsWith('**A:')) {
        currentAnswer = line.replace(/^(?:\*\*)?A:\s*/, '').replace(/\*\*$/, '');
      } else if (currentQuestion && line.trim()) {
        currentAnswer += ' ' + line.trim();
      }
    }
  }

  if (currentQuestion && currentAnswer) {
    faqs.push({ question: currentQuestion.trim(), answer: currentAnswer.trim() });
  }

  return faqs.slice(0, 5); // Limit to 5 FAQs
}

/**
 * Fetch nearby cities for internal linking
 */
async function fetchNearbyCities(supabase: any, stateSlug: string): Promise<{ name: string; slug: string }[]> {
  try {
    const { data: state } = await supabase
      .from('states')
      .select('id')
      .or(`slug.eq.${stateSlug},abbreviation.ilike.${stateSlug}`)
      .limit(1)
      .maybeSingle();

    if (!state) return [];

    const { data: cities } = await supabase
      .from('cities')
      .select('name, slug')
      .eq('state_id', state.id)
      .eq('is_active', true)
      .order('dentist_count', { ascending: false })
      .limit(8);

    return cities || [];
  } catch (err) {
    return [];
  }
}

/**
 * Fetch clinic listings for a city
 */
async function fetchCityListings(supabase: any, stateSlug: string, citySlug: string): Promise<{
  clinics: { name: string; slug: string; rating: number; address: string }[];
  count: number;
}> {
  try {
    const { data: city } = await supabase
      .from('cities')
      .select('id, state:states!inner(slug, abbreviation)')
      .eq('slug', citySlug)
      .limit(1)
      .maybeSingle();

    if (!city) return { clinics: [], count: 0 };

    const { data: clinics, count } = await supabase
      .from('clinics')
      .select('name, slug, rating, address', { count: 'exact' })
      .eq('city_id', city.id)
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .limit(10);

    return {
      clinics: (clinics || []).map((c: any) => ({
        name: c.name,
        slug: c.slug,
        rating: c.rating || 0,
        address: c.address || ''
      })),
      count: count || 0
    };
  } catch (err) {
    return { clinics: [], count: 0 };
  }
}

/**
 * Fetch clinic profile for clinic pages
 */
async function fetchClinicProfile(supabase: any, clinicSlug: string): Promise<{
  name: string;
  description: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  services: string[];
  cityName: string;
  stateName: string;
  stateSlug: string;
} | null> {
  try {
    const { data: clinic } = await supabase
      .from('clinics')
      .select(`
        name, description, address, phone, rating, review_count,
        city:cities(name, slug, state:states(name, slug, abbreviation))
      `)
      .eq('slug', clinicSlug)
      .eq('is_active', true)
      .maybeSingle();

    if (!clinic) return null;

    // Fetch services
    const { data: treatments } = await supabase
      .from('clinic_treatments')
      .select('treatment:treatments(name)')
      .eq('clinic_id', clinic.id)
      .limit(8);

    return {
      name: clinic.name,
      description: clinic.description || '',
      address: clinic.address || '',
      phone: clinic.phone || '',
      rating: clinic.rating || 0,
      reviewCount: clinic.review_count || 0,
      services: (treatments || []).map((t: any) => t.treatment?.name).filter(Boolean),
      cityName: clinic.city?.name || '',
      stateName: clinic.city?.state?.name || '',
      stateSlug: clinic.city?.state?.slug || '',
    };
  } catch (err) {
    return null;
  }
}

/**
 * Generate SEO-friendly HTML with complete content and navigation
 * This is served to bots and must contain all SEO-critical content
 */
async function generateMinimalHtmlWithContent(
  supabase: any,
  path: string,
  pageType: string
): Promise<string> {
  const pathInfo = extractPathInfo(path);
  const { stateSlug, citySlug, serviceSlug, clinicSlug, dentistSlug } = pathInfo;

  // Fetch real SEO content from database
  const seoContent = await fetchSeoContent(supabase, path);

  // Build contextual title and description
  // IMPORTANT: Generate page-type-specific defaults FIRST, then override with seo_pages data
  let title = 'AppointPanda - Find Your Perfect Dentist in UAE';
  let h1 = 'Find Top-Rated Dentists in UAE';
  let description = 'AppointPanda helps you find and book appointments with trusted dental professionals across the UAE. Compare verified clinics in Dubai, Sharjah, Abu Dhabi with transparent AED pricing.';
  let contentHtml = '';
  let faqHtml = '';
  let listingsHtml = '';
  let clinicProfileHtml = '';

  // Generate page-type-specific defaults based on URL structure
  // These apply regardless of whether seo_pages has data
  if (pageType === 'state' && stateSlug) {
    const stateName = CORE_STATES.find(s => s.slug === stateSlug)?.name || formatSlugToName(stateSlug);
    title = `Dentists in ${stateName}, UAE | AppointPanda`;
    h1 = `Find Dentists in ${stateName}`;
    description = `Discover top-rated dental clinics and dentists in ${stateName}, UAE. Book appointments online with DHA-aligned dental professionals. Transparent AED pricing.`;
  } else if (pageType === 'city' && stateSlug && citySlug) {
    const stateName = CORE_STATES.find(s => s.slug === stateSlug)?.name || formatSlugToName(stateSlug);
    const cityName = formatSlugToName(citySlug);
    title = `Dentists in ${cityName}, ${stateName} | AppointPanda`;
    h1 = `Find Dentists in ${cityName}, ${stateName}`;
    description = `Book appointments with top-rated dentists in ${cityName}, ${stateName}, UAE. Browse verified reviews, compare AED pricing, and find the perfect dental care provider.`;
  } else if (pageType === 'service-location' && stateSlug && citySlug && serviceSlug) {
    const stateName = CORE_STATES.find(s => s.slug === stateSlug)?.name || formatSlugToName(stateSlug);
    const cityName = formatSlugToName(citySlug);
    const serviceName = formatSlugToName(serviceSlug);
    title = `${serviceName} in ${cityName}, ${stateName} | AppointPanda`;
    h1 = `${serviceName} Dentists in ${cityName}, ${stateName}`;
    description = `Find the best ${serviceName.toLowerCase()} specialists in ${cityName}, ${stateName}, UAE. Compare dentists, read reviews, check AED pricing, and book online.`;
  } else if (pageType === 'state-service' && stateSlug && serviceSlug) {
    const stateName = CORE_STATES.find(s => s.slug === stateSlug)?.name || formatSlugToName(stateSlug);
    const serviceName = CORE_SERVICES.find(s => s.slug === serviceSlug)?.name || formatSlugToName(serviceSlug);
    title = `${serviceName} in ${stateName} - Best Clinics & Prices (AED) | AppointPanda`;
    h1 = `${serviceName} in ${stateName}`;
    description = `Find the best ${serviceName.toLowerCase()} clinics in ${stateName}, UAE. Compare verified providers, prices in AED, and book appointments online.`;
  } else if (pageType === 'cost-guide' && serviceSlug) {
    const serviceName = CORE_SERVICES.find(s => s.slug === serviceSlug)?.name || formatSlugToName(serviceSlug);
    title = `${serviceName} Cost in UAE - Prices by Emirate | AppointPanda`;
    h1 = `${serviceName} Cost in UAE`;
    description = `How much does ${serviceName.toLowerCase()} cost in the UAE? Compare AED prices across all 7 Emirates and find the best value.`;
  } else if (pageType === 'comparison' && serviceSlug) {
    const serviceName = CORE_SERVICES.find(s => s.slug === serviceSlug)?.name || formatSlugToName(serviceSlug);
    title = `${serviceName} Price Comparison | AppointPanda`;
    h1 = `${serviceName} Price Comparison`;
    description = `Compare ${serviceName.toLowerCase()} prices across UAE Emirates. See side-by-side pricing in AED and find the best value.`;
  } else if (pageType === 'service' && serviceSlug) {
    const serviceName = formatSlugToName(serviceSlug);
    title = `${serviceName} Dentists in UAE | AppointPanda`;
    h1 = `Find ${serviceName} Specialists in UAE`;
    description = `Discover top-rated ${serviceName.toLowerCase()} dentists across the UAE. Compare providers in Dubai, Abu Dhabi, Sharjah and book appointments online.`;
  } else if (pageType === 'blog-index') {
    title = `Dental Health Blog | Tips & Guides | AppointPanda`;
    h1 = `Dental Health Blog`;
    description = `Expert dental health articles, tips, and guides. Learn about dental treatments, costs in AED, and find the best dental care advice for UAE residents.`;
  } else if (pageType === 'blog-post') {
    // Blog posts get their title from the DB below
  } else if (pageType === 'clinic' && clinicSlug) {
    const clinicName = formatSlugToName(clinicSlug);
    title = `${clinicName} | Dental Clinic in UAE | AppointPanda`;
    h1 = clinicName;
    description = `View ${clinicName} profile on AppointPanda. See services, reviews, AED pricing, and book an appointment.`;
  } else if (pageType === 'dentist' && dentistSlug) {
    const dentistName = formatSlugToName(dentistSlug);
    title = `${dentistName} | Dentist in UAE | AppointPanda`;
    h1 = dentistName;
    description = `View ${dentistName} profile on AppointPanda. See qualifications, reviews, and book an appointment.`;
  } else if (pageType === 'insurance-index') {
    title = `Dental Insurance Providers in UAE | AppointPanda`;
    h1 = `Dental Insurance Providers`;
    description = `Compare dental insurance providers in the UAE. Find clinics that accept your insurance plan — Daman, AXA, Cigna, MetLife and more.`;
  } else if (pageType === 'insurance-detail') {
    const insuranceName = formatSlugToName(path.replace(/^\/insurance\//, '').replace(/\/$/, ''));
    title = `${insuranceName} Dental Coverage in UAE | AppointPanda`;
    h1 = `${insuranceName} Dental Insurance`;
    description = `Find dental clinics in the UAE that accept ${insuranceName} insurance. Compare providers, check coverage, and book appointments.`;
  } else if (pageType === 'home') {
    title = `Find the Best Dentists in Dubai & UAE | AppointPanda`;
    h1 = `Find Your Perfect Dentist in the UAE`;
    description = `AppointPanda is the UAE's leading dental directory. Find, compare, and book appointments with 6,600+ verified dental clinics across all 7 Emirates.`;
  }

  // Override with seo_pages data if available (DB content takes priority)
  if (seoContent?.meta_title) title = seoContent.meta_title;
  if (seoContent?.h1) h1 = seoContent.h1;
  if (seoContent?.meta_description) description = seoContent.meta_description;

  // Parse content into semantic HTML sections
  if (seoContent?.content) {
    const contentLines = seoContent.content.split('\n').filter((l: string) => l.trim());
    const sections: { heading?: string; paragraphs: string[] }[] = [];
    let currentSection: { heading?: string; paragraphs: string[] } = { paragraphs: [] };

    for (const line of contentLines) {
      if (line.startsWith('## ')) {
        if (currentSection.paragraphs.length > 0 || currentSection.heading) {
          sections.push(currentSection);
        }
        currentSection = { heading: line.replace('## ', ''), paragraphs: [] };
      } else if (line.startsWith('### ')) {
        if (currentSection.paragraphs.length > 0 || currentSection.heading) {
          sections.push(currentSection);
        }
        currentSection = { heading: line.replace('### ', ''), paragraphs: [] };
      } else if (line.trim() && !line.toLowerCase().includes('frequently asked') && !line.toLowerCase().includes('faq')) {
        currentSection.paragraphs.push(line);
      }
    }
    if (currentSection.paragraphs.length > 0 || currentSection.heading) {
      sections.push(currentSection);
    }

    // Generate semantic HTML from sections (limit to 6 sections for performance)
    contentHtml = sections.slice(0, 6).map(section => {
      const paragraphsHtml = section.paragraphs.map(p => `<p>${p}</p>`).join('\n        ');
      if (section.heading) {
        return `<section>
        <h2>${section.heading}</h2>
        ${paragraphsHtml}
      </section>`;
      }
      return paragraphsHtml;
    }).join('\n      ');
  }

  // Generate FAQ HTML (critical for SEO)
  const faqs = seoContent?.faqs || [];
  if (faqs.length > 0) {
    faqHtml = `
    <section itemscope itemtype="https://schema.org/FAQPage">
      <h2>Frequently Asked Questions</h2>
      <dl>
        ${faqs.map(faq => `
        <div itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
          <dt itemprop="name">${faq.question}</dt>
          <dd itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
            <span itemprop="text">${faq.answer}</span>
          </dd>
        </div>
        `).join('')}
      </dl>
    </section>`;
  }

  // Fetch and render clinic listings for city/service-location pages
  if ((pageType === 'city' || pageType === 'service-location') && stateSlug && citySlug) {
    const listings = await fetchCityListings(supabase, stateSlug, citySlug);
    if (listings.clinics.length > 0) {
      listingsHtml = `
    <section itemscope itemtype="https://schema.org/ItemList">
      <h2>Top Dental Clinics in ${formatSlugToName(citySlug)}</h2>
      <meta itemprop="numberOfItems" content="${listings.count}" />
      <ol class="clinic-list">
        ${listings.clinics.map((clinic, idx) => `
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <meta itemprop="position" content="${idx + 1}" />
          <article itemscope itemprop="item" itemtype="https://schema.org/Dentist">
            <h3 itemprop="name"><a href="${BASE_URL}/clinic/${clinic.slug}/" itemprop="url">${clinic.name}</a></h3>
            ${clinic.rating > 0 ? `<div class="rating"><span itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating"><span itemprop="ratingValue">${clinic.rating.toFixed(1)}</span>/5 stars</span></div>` : ''}
            ${clinic.address ? `<p itemprop="address">${clinic.address}</p>` : ''}
          </article>
        </li>
        `).join('')}
      </ol>
      ${listings.count > 10 ? `<p><a href="${BASE_URL}${path}">View all ${listings.count} dental clinics →</a></p>` : ''}
    </section>`;
    }
  }

  // Fetch clinic profile for clinic pages
  if (pageType === 'clinic' && clinicSlug) {
    const profile = await fetchClinicProfile(supabase, clinicSlug);
    if (profile) {
      title = `${profile.name} | Dentist in ${profile.cityName} | AppointPanda`;
      h1 = profile.name;
      description = profile.description || `${profile.name} is a dental clinic in ${profile.cityName}, ${profile.stateName}. Book your appointment online.`;

      clinicProfileHtml = `
    <section itemscope itemtype="https://schema.org/Dentist">
      <meta itemprop="name" content="${profile.name}" />
      ${profile.address ? `<p itemprop="address">${profile.address}</p>` : ''}
      ${profile.phone ? `<p>Phone: <a href="tel:${profile.phone}" itemprop="telephone">${profile.phone}</a></p>` : ''}
      ${profile.rating > 0 ? `<div class="rating" itemprop="aggregateRating" itemscope itemtype="https://schema.org/AggregateRating">
        <span itemprop="ratingValue">${profile.rating.toFixed(1)}</span>/5 stars
        ${profile.reviewCount > 0 ? `(<span itemprop="reviewCount">${profile.reviewCount}</span> reviews)` : ''}
      </div>` : ''}
      ${profile.description ? `<p itemprop="description">${profile.description}</p>` : ''}
      ${profile.services.length > 0 ? `
      <div>
        <h3>Services Offered</h3>
        <ul>
          ${profile.services.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      <p><a href="${BASE_URL}/${profile.stateSlug}">Browse more dentists in ${profile.stateName}</a></p>
    </section>`;
    }
  }

  // Generate fallback body content when no seo_pages content exists
  if (!seoContent?.content) {
    if (pageType === 'state-service' && stateSlug && serviceSlug) {
      const stateName = CORE_STATES.find(s => s.slug === stateSlug)?.name || formatSlugToName(stateSlug);
      const serviceName = CORE_SERVICES.find(s => s.slug === serviceSlug)?.name || formatSlugToName(serviceSlug);
      contentHtml = `<section>
        <h2>${serviceName} in ${stateName}</h2>
        <p>Looking for ${serviceName.toLowerCase()} in ${stateName}? AppointPanda lists verified dental clinics across ${stateName} offering professional ${serviceName.toLowerCase()} services with transparent AED pricing.</p>
        <p>Compare clinics, read patient reviews, and book your ${serviceName.toLowerCase()} appointment online. All practitioners are licensed by the ${stateName} health authority.</p>
      </section>`;
    } else if (pageType === 'cost-guide' && serviceSlug) {
      const serviceName = CORE_SERVICES.find(s => s.slug === serviceSlug)?.name || formatSlugToName(serviceSlug);
      contentHtml = `<section>
        <h2>${serviceName} Cost in UAE</h2>
        <p>${serviceName} prices in the UAE vary by emirate, clinic, and complexity. Dubai tends to have higher prices, while Sharjah and Ajman are often more affordable.</p>
        <p>AppointPanda provides transparent AED pricing so you can compare costs across all 7 Emirates and find the best value for your ${serviceName.toLowerCase()} treatment.</p>
      </section>`;
    } else if (pageType === 'comparison') {
      contentHtml = `<section>
        <h2>Price Comparison</h2>
        <p>Compare dental treatment prices across UAE Emirates. See side-by-side AED pricing, insurance compatibility, and clinic ratings to make an informed decision.</p>
      </section>`;
    } else if (pageType === 'state' && stateSlug) {
      const stateName = CORE_STATES.find(s => s.slug === stateSlug)?.name || formatSlugToName(stateSlug);
      contentHtml = `<section>
        <h2>Dental Care in ${stateName}</h2>
        <p>${stateName} is home to hundreds of dental professionals offering comprehensive oral health services. From routine cleanings to advanced cosmetic procedures, you'll find qualified, DHA-aligned dentists ready to help you achieve your best smile.</p>
        <p>AppointPanda makes it easy to compare dentists in ${stateName}, read verified patient reviews, check AED pricing, and book appointments online.</p>
      </section>`;
    } else if (pageType === 'city' && stateSlug && citySlug) {
      const cityName = formatSlugToName(citySlug);
      const stateName = CORE_STATES.find(s => s.slug === stateSlug)?.name || formatSlugToName(stateSlug);
      contentHtml = `<section>
        <h2>About Dental Care in ${cityName}</h2>
        <p>Looking for a dentist in ${cityName}? Our directory features verified dental clinics offering services from general dentistry to specialized treatments like dental implants, orthodontics, and cosmetic procedures.</p>
        <p>Whether you need a routine checkup or emergency dental care, you can find and book appointments with trusted professionals in ${cityName}, ${stateName}.</p>
      </section>`;
    } else if (pageType === 'service-location' && stateSlug && citySlug && serviceSlug) {
      const cityName = formatSlugToName(citySlug);
      const serviceName = formatSlugToName(serviceSlug);
      contentHtml = `<section>
        <h2>About ${serviceName} in ${cityName}</h2>
        <p>Find experienced ${serviceName.toLowerCase()} specialists in ${cityName}. Our directory features verified dentists with expertise in ${serviceName.toLowerCase()} procedures, patient reviews, and online booking.</p>
        <p>Compare providers, view their qualifications, and schedule your ${serviceName.toLowerCase()} consultation today.</p>
      </section>`;
    } else if (pageType === 'service' && serviceSlug) {
      const serviceName = formatSlugToName(serviceSlug);
      contentHtml = `<section>
        <h2>About ${serviceName} in UAE</h2>
        <p>${serviceName} is a dental procedure that helps patients achieve better oral health and a more confident smile. Our directory connects you with qualified specialists across the UAE.</p>
        <p>Browse ${serviceName.toLowerCase()} providers, read patient reviews, check AED pricing, and book your consultation online.</p>
      </section>`;
    } else if (pageType === 'home') {
      contentHtml = `<section>
        <h2>UAE's Leading Dental Directory</h2>
        <p>AppointPanda connects patients with 6,600+ verified dental clinics across all 7 Emirates. Find DHA, DOH & MOHAP licensed professionals with transparent AED pricing.</p>
        <p>Search by location, treatment type, or insurance provider. Read verified patient reviews and book appointments online.</p>
      </section>`;
    } else if (pageType === 'blog-index') {
      contentHtml = `<section>
        <h2>Latest Dental Health Articles</h2>
        <p>Stay informed with expert dental health tips, treatment guides, and cost breakdowns for UAE residents. Our blog covers everything from routine care to advanced procedures.</p>
      </section>`;
    }
  }

  // Fetch nearby cities for internal linking
  const nearbyCities = stateSlug ? await fetchNearbyCities(supabase, stateSlug) : [];

  // Build navigation links - CRITICAL for crawl discovery and internal linking
  // CANONICAL: All links use trailing slash (except root /)
  const stateLinks = CORE_STATES.map(s =>
    `<li><a href="${BASE_URL}/${s.slug}/">Dentists in ${s.name}, UAE</a></li>`
  ).join('\n            ');

  const serviceLinks = CORE_SERVICES.map(s =>
    `<li><a href="${BASE_URL}/services/${s.slug}/">${s.name}</a></li>`
  ).join('\n            ');

  // Dynamic nearby city links (filtered to exclude current city)
  const nearbyCityLinks = nearbyCities.length > 0
    ? nearbyCities
      .filter(c => c.slug !== citySlug)
      .map(c => `<li><a href="${BASE_URL}/${stateSlug}/${c.slug}/">Dentists in ${c.name}</a></li>`)
      .join('\n            ')
    : '';

  // Service-location links for cities
  const serviceLocationLinks = (citySlug && stateSlug)
    ? CORE_SERVICES.slice(0, 6).map(s =>
      `<li><a href="${BASE_URL}/${stateSlug}/${citySlug}/${s.slug}/">${s.name} in ${formatSlugToName(citySlug)}</a></li>`
    ).join('\n            ')
    : '';

  const mainNavLinks = `
    <li><a href="${BASE_URL}/">Home</a></li>
    <li><a href="${BASE_URL}/services/">All Dental Services</a></li>
    <li><a href="${BASE_URL}/blog/">Dental Health Blog</a></li>
    <li><a href="${BASE_URL}/about/">About Us</a></li>
    <li><a href="${BASE_URL}/contact/">Contact</a></li>
    <li><a href="${BASE_URL}/sitemap/">Sitemap</a></li>
  `;

  // Contextual breadcrumbs (trailing slashes)
  let breadcrumbNav = `<a href="${BASE_URL}/">Home</a>`;
  const breadcrumbItems = [{ name: 'Home', url: `${BASE_URL}/` }];

  if (stateSlug) {
    const stateName = formatSlugToName(stateSlug);
    breadcrumbNav += ` → <a href="${BASE_URL}/${stateSlug}/">${stateName}</a>`;
    breadcrumbItems.push({ name: stateName, url: `${BASE_URL}/${stateSlug}/` });
    if (citySlug) {
      const cityName = formatSlugToName(citySlug);
      breadcrumbNav += ` → <a href="${BASE_URL}/${stateSlug}/${citySlug}/">${cityName}</a>`;
      breadcrumbItems.push({ name: cityName, url: `${BASE_URL}/${stateSlug}/${citySlug}/` });
      if (serviceSlug) {
        const serviceName = formatSlugToName(serviceSlug);
        breadcrumbNav += ` → <span>${serviceName}</span>`;
        breadcrumbItems.push({ name: serviceName, url: `${BASE_URL}/${stateSlug}/${citySlug}/${serviceSlug}/` });
      }
    }
  } else if (serviceSlug) {
    breadcrumbNav += ` → <a href="${BASE_URL}/services/">Services</a>`;
    breadcrumbItems.push({ name: 'Services', url: `${BASE_URL}/services/` });
    breadcrumbNav += ` → <span>${formatSlugToName(serviceSlug)}</span>`;
    breadcrumbItems.push({ name: formatSlugToName(serviceSlug), url: `${BASE_URL}/services/${serviceSlug}/` });
  } else if (clinicSlug) {
    breadcrumbNav += ` → <a href="${BASE_URL}/sitemap/">Clinics</a>`;
    breadcrumbNav += ` → <span>Clinic Profile</span>`;
  } else if (dentistSlug) {
    breadcrumbNav += ` → <a href="${BASE_URL}/sitemap/">Dentists</a>`;
    breadcrumbNav += ` → <span>Dentist Profile</span>`;
  }

  // Generate JSON-LD structured data
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AppointPanda',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    description: 'Find and book appointments with top-rated dental professionals across the UAE. Compare verified clinics in Dubai, Abu Dhabi, Sharjah with transparent AED pricing.',
  };

  // FAQ schema (if FAQs exist)
  const faqSchema = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${BASE_URL}${path}">
  
  <!-- AppointPanda Favicon -->
  <link rel="icon" type="image/png" href="${BASE_URL}/favicon.png?v=5">
  <link rel="apple-touch-icon" href="${BASE_URL}/favicon.png?v=5">
  
  <!-- Open Graph -->
  <meta property="og:url" content="${BASE_URL}${path}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:site_name" content="AppointPanda">
  <meta property="og:image" content="${BASE_URL}/og-image.png">
  
  <!-- JSON-LD Structured Data (synchronous, in head) -->
  <script type="application/ld+json">${JSON.stringify(organizationSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  ${faqSchema ? `<script type="application/ld+json">${JSON.stringify(faqSchema)}</script>` : ''}
  
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.7; max-width: 1200px; margin: 0 auto; padding: 20px; color: #222; }
    header { border-bottom: 1px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 24px; }
    nav ul { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 16px; }
    nav a { color: #0066cc; text-decoration: none; font-weight: 500; }
    nav a:hover { text-decoration: underline; }
    h1 { color: #111; margin-bottom: 12px; font-size: 2rem; }
    h2 { color: #222; margin-top: 32px; border-bottom: 2px solid #e0e0e0; padding-bottom: 8px; font-size: 1.5rem; }
    h3 { color: #333; margin-top: 24px; font-size: 1.2rem; }
    .breadcrumb { font-size: 14px; color: #555; margin-bottom: 20px; }
    .breadcrumb a { color: #0066cc; }
    .description { font-size: 1.1rem; color: #444; margin-bottom: 28px; line-height: 1.8; }
    section { margin-bottom: 36px; }
    section p { margin-bottom: 16px; }
    .link-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; padding: 0; list-style: none; margin-top: 16px; }
    .link-grid li { list-style: none; }
    .link-grid a { display: block; padding: 12px 16px; background: #f7f7f7; border-radius: 8px; color: #0066cc; text-decoration: none; font-weight: 500; transition: background 0.2s; }
    .link-grid a:hover { background: #e8e8e8; }
    .clinic-list { list-style: none; padding: 0; }
    .clinic-list li { margin-bottom: 20px; padding: 16px; background: #fafafa; border-radius: 8px; border: 1px solid #e8e8e8; }
    .clinic-list h3 { margin: 0 0 8px 0; font-size: 1.1rem; }
    .clinic-list h3 a { color: #0066cc; text-decoration: none; }
    .clinic-list h3 a:hover { text-decoration: underline; }
    .clinic-list .rating { color: #f5a623; font-weight: 600; margin-bottom: 4px; }
    .clinic-list p { margin: 4px 0; color: #555; font-size: 0.95rem; }
    dl { margin: 0; }
    dl > div { margin-bottom: 20px; padding: 16px; background: #f9f9f9; border-radius: 8px; }
    dt { font-weight: 600; color: #222; margin-bottom: 8px; }
    dd { margin: 0; color: #444; line-height: 1.7; }
    footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #e0e0e0; color: #555; font-size: 14px; }
    footer a { color: #0066cc; text-decoration: none; margin: 0 8px; }
    .cta { display: inline-block; padding: 14px 28px; background: #0066cc; color: white; border-radius: 8px; text-decoration: none; margin-top: 24px; font-weight: 600; transition: background 0.2s; }
    .cta:hover { background: #0052a3; }
    @media (max-width: 768px) {
      h1 { font-size: 1.5rem; }
      h2 { font-size: 1.25rem; }
      .link-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <a href="${BASE_URL}/" aria-label="AppointPanda Home">
      <strong>AppointPanda</strong> - Find Your Perfect Dentist in UAE
    </a>
    <nav aria-label="Main navigation">
      <ul>
        ${mainNavLinks}
      </ul>
    </nav>
  </header>
  
  <main>
    <nav class="breadcrumb" aria-label="Breadcrumb">
      ${breadcrumbNav}
    </nav>
    
    <article>
      <h1>${h1}</h1>
      <p class="description">${description}</p>
      
      ${clinicProfileHtml}
      
      ${contentHtml ? `<div class="content-area">${contentHtml}</div>` : ''}
      
      ${listingsHtml}
      
      ${faqHtml}
      
      <a href="${BASE_URL}${path}" class="cta">View Full Page & Book Online</a>
    </article>
    
    ${nearbyCityLinks ? `
    <section>
      <h2>Nearby Cities</h2>
      <ul class="link-grid">
        ${nearbyCityLinks}
      </ul>
    </section>
    ` : ''}
    
    ${serviceLocationLinks ? `
    <section>
      <h2>Dental Services in ${formatSlugToName(citySlug || '')}</h2>
      <ul class="link-grid">
        ${serviceLocationLinks}
      </ul>
    </section>
    ` : ''}
    
    <section>
      <h2>Browse Dentists by Emirate</h2>
      <ul class="link-grid">
        ${stateLinks}
      </ul>
    </section>
    
    <section>
      <h2>Popular Dental Services</h2>
      <ul class="link-grid">
        ${serviceLinks}
      </ul>
    </section>
  </main>
  
  <footer>
    <p>&copy; ${new Date().getFullYear()} AppointPanda. All rights reserved.</p>
    <nav aria-label="Footer navigation">
      <a href="${BASE_URL}/privacy/">Privacy Policy</a> |
      <a href="${BASE_URL}/terms/">Terms of Service</a> |
      <a href="${BASE_URL}/contact/">Contact Us</a> |
      <a href="${BASE_URL}/sitemap/">Sitemap</a>
    </nav>
  </footer>
</body>
</html>`;
}

function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

/**
 * Fetch with retry and exponential backoff
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Success or client error (don't retry 4xx)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response;
      }

      // Server error - retry
      if (response.status >= 500) {
        console.log(`Attempt ${attempt}/${maxRetries} failed with ${response.status}, retrying...`);
        lastError = new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.log(`Attempt ${attempt}/${maxRetries} failed with error, retrying...`);
      lastError = err as Error;
    }

    // Exponential backoff: 1s, 2s, 4s
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('All retries failed');
}

/**
 * Prerender a page using Prerender.io with retry logic
 */
async function prerenderAndCache(
  supabase: any,
  path: string,
  pageType: string,
  prerenderToken: string,
  forceRecache: boolean = true
): Promise<{ html: string; cached: boolean }> {
  const targetUrl = `${BASE_URL}${path}`;
  const prerenderUrl = `https://service.prerender.io/${targetUrl}`;

  console.log(`Prerendering on-demand: ${path} (forceRecache: ${forceRecache})`);

  try {
    const headers: Record<string, string> = {
      "X-Prerender-Token": prerenderToken,
      "User-Agent": BROWSER_USER_AGENT,
      "X-Prerender-Render-Delay": "4000", // Increased for full page hydration
    };

    if (forceRecache) {
      headers['X-Prerender-Recache'] = 'true';
    }

    const response = await fetchWithRetry(prerenderUrl, { headers }, 3);

    if (!response.ok) {
      console.error(`Prerender failed for ${path}: ${response.status}`);
      const fallbackHtml = await generateMinimalHtmlWithContent(supabase, path, pageType);
      return { html: fallbackHtml, cached: false };
    }

    let html = await response.text();

    // Validate we got meaningful content (not empty or error page)
    if (!html || html.length < 500 || html.includes('Prerender Error')) {
      console.error(`Prerender returned invalid content for ${path}`);
      const fallbackHtml = await generateMinimalHtmlWithContent(supabase, path, pageType);
      return { html: fallbackHtml, cached: false };
    }

    // Ensure no noindex in prerendered content for indexable pages
    html = html.replace(
      /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex[^"']*["']\s*\/?>/gi,
      '<meta name="robots" content="index, follow">'
    );

    // Generate a storage path
    const contentHash = hashContent(html);
    const storagePath = `${pageType}${path.replace(/\//g, '_')}${contentHash}.html`;

    // Try to upload and cache (best effort)
    try {
      await supabase.storage
        .from('static-pages')
        .upload(storagePath, html, {
          contentType: 'text/html',
          upsert: true
        });

      const cachePath = path.endsWith('/') ? path : path + '/';

      await supabase
        .from('static_page_cache')
        .upsert({
          path: cachePath,
          page_type: pageType,
          storage_path: storagePath,
          content_hash: contentHash,
          generated_at: new Date().toISOString(),
          is_stale: false
        }, { onConflict: 'path' });

      console.log(`Cached prerendered page: ${path}`);
      return { html, cached: true };
    } catch (cacheErr) {
      console.error(`Failed to cache ${path}:`, cacheErr);
      return { html, cached: false };
    }
  } catch (err) {
    console.error(`Prerender error for ${path}:`, err);
    const fallbackHtml = await generateMinimalHtmlWithContent(supabase, path, pageType);
    return { html: fallbackHtml, cached: false };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const prerenderToken = Deno.env.get("PRERENDER_TOKEN");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    let requestedPath = url.searchParams.get('path') || url.pathname.replace('/serve-static', '');
    const isTestMode = url.searchParams.get('test') === '1';

    if (!requestedPath.startsWith('/')) {
      requestedPath = '/' + requestedPath;
    }

    // Handle sitemap XML requests
    if (requestedPath.match(/^\/sitemap.*\.xml$/i)) {
      const sitemapUrl = `${supabaseUrl}/functions/v1/sitemap`;
      let sitemapType = '';

      const typeMatch = requestedPath.match(/sitemap-([^.]+)\.xml/);
      if (typeMatch) {
        const typePart = typeMatch[1];
        // Handle chunked sitemaps like sitemap-clinics-1.xml
        const chunkMatch = typePart.match(/^(.+)-(\d+)$/);
        if (chunkMatch) {
          sitemapType = `?type=${chunkMatch[1]}&chunk=${chunkMatch[2]}`;
        } else {
          sitemapType = `?type=${typePart}`;
        }
      }

      console.log(`Redirecting sitemap request ${requestedPath} to sitemap function`);

      const response = await fetch(`${sitemapUrl}${sitemapType}`, {
        headers: { 'Authorization': `Bearer ${supabaseKey}` }
      });

      const xml = await response.text();
      return new Response(xml, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // Handle robots.txt and llms.txt
    if (requestedPath === '/robots.txt' || requestedPath.match(/^\/llms.*\.txt$/i)) {
      const fileUrl = `${BASE_URL}${requestedPath}`;
      const response = await fetch(fileUrl, {
        headers: { 'User-Agent': BROWSER_USER_AGENT }
      });
      const text = await response.text();
      return new Response(text, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // CANONICAL: Enforce trailing slash (except root /)
    // 301 redirect non-trailing slash URLs to trailing slash version
    if (requestedPath !== '/' && !requestedPath.endsWith('/') && !requestedPath.includes('.')) {
      const pathWithSlash = requestedPath + '/';
      console.log(`301 Redirect: ${requestedPath} -> ${pathWithSlash} (adding trailing slash)`);
      return new Response(null, {
        status: 301,
        headers: {
          ...corsHeaders,
          'Location': `${BASE_URL}${pathWithSlash}`,
          'Cache-Control': 'public, max-age=31536000', // Cache redirect permanently
        },
      });
    }

    // Normalize: ensure trailing slash for internal processing (except root)
    if (requestedPath !== '/' && !requestedPath.endsWith('/')) {
      requestedPath = requestedPath + '/';
    }

    // (Legacy US malformed slug redirects removed - UAE market uses clean slugs)

    console.log(`Serving static page for path: ${requestedPath} (test mode: ${isTestMode})`);

    // Proxy static assets
    if (isAssetPath(requestedPath)) {
      const assetUrl = `${BASE_URL}${requestedPath}`;
      const upstream = await fetch(assetUrl, {
        headers: {
          "User-Agent": BROWSER_USER_AGENT,
          Accept: "*/*",
        },
      });

      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("x-static-cache", "asset-proxy");
      for (const [k, v] of Object.entries(corsHeaders)) headers.set(k, v);

      return new Response(upstream.body, { status: upstream.status, headers });
    }

    // Classify the path
    const classification = classifyPath(requestedPath);

    // Non-indexable pages: check if it's a private route or a 404
    if (!classification.indexable) {
      // Check if it's a known private route (these should not redirect)
      const isKnownPrivate = PRIVATE_ROUTE_PATTERNS.some(pattern =>
        requestedPath.startsWith(pattern)
      );

      if (isKnownPrivate) {
        console.log(`Path ${requestedPath} is a private/utility page`);
        return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <title>Private Page - AppointPanda</title>
</head>
<body>
  <p>This is a private page.</p>
</body>
</html>`, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'x-static-cache': 'private',
          },
        });
      }

      // Not a known indexable route and not a private route = 404
      // IMPORTANT: Do NOT redirect 404s to homepage. Keep users/bots on the 404 URL.
      console.log(`404 Not Found: ${requestedPath}`);
      return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex, nofollow">
  <title>404 - Page Not Found</title>
</head>
<body>
  <h1>Page Not Found</h1>
  <p>The requested page does not exist.</p>
  <p><a href="${BASE_URL}/">Go to homepage</a></p>
</body>
</html>`, {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300',
          'x-static-cache': '404',
        },
      });
    }

    // Look up in cache first
    const { data: cacheEntry, error: cacheError } = await supabase
      .from('static_page_cache')
      .select('storage_path, generated_at, is_stale')
      .eq('path', requestedPath)
      .single();

    // CACHE HIT
    if (!cacheError && cacheEntry) {
      // If stale, re-prerender
      if (cacheEntry.is_stale && prerenderToken && classification.pageType) {
        console.log(`Stale cache for ${requestedPath} - triggering fresh prerender`);
        const { html, cached } = await prerenderAndCache(
          supabase,
          requestedPath,
          classification.pageType,
          prerenderToken
        );

        return new Response(html, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'x-static-cache': cached ? 'refreshed' : 'prerendered',
            'x-generated-at': new Date().toISOString(),
          },
        });
      }

      // Serve cached content
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('static-pages')
        .download(cacheEntry.storage_path);

      if (!downloadError && fileData) {
        const html = await fileData.text();
        console.log(`Served cached page for ${requestedPath} (generated: ${cacheEntry.generated_at})`);

        return new Response(html, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
            'x-static-cache': 'hit',
            'x-generated-at': cacheEntry.generated_at,
          },
        });
      }
    }

    // CACHE MISS - Prerender on-demand
    console.log(`Cache miss for indexable page: ${requestedPath}`);

    if (prerenderToken && classification.pageType) {
      const { html, cached } = await prerenderAndCache(
        supabase,
        requestedPath,
        classification.pageType,
        prerenderToken
      );

      return new Response(html, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=300, s-maxage=600',
          'x-static-cache': cached ? 'prerendered-cached' : 'prerendered',
          'x-generated-at': new Date().toISOString(),
        },
      });
    }

    // No prerender token - return minimal HTML with full content structure
    const minimalHtml = classification.pageType
      ? await generateMinimalHtmlWithContent(supabase, requestedPath, classification.pageType)
      : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="index, follow">
  <title>AppointPanda - Find Your Dentist</title>
  <link rel="canonical" href="${BASE_URL}${requestedPath}">
</head>
<body>
  <h1>AppointPanda</h1>
  <p>Find and book appointments with top-rated dentists.</p>
  <p><a href="${BASE_URL}${requestedPath}">Visit this page</a></p>
</body>
</html>`;

    return new Response(minimalHtml, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'x-static-cache': 'miss-fallback',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (err) {
    const error = err as Error;
    console.error("Serve static error:", error);
    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="robots" content="noindex">
  <title>Error - AppointPanda</title>
</head>
<body>
  <p>An error occurred. <a href="${BASE_URL}">Go to homepage</a></p>
</body>
</html>`, {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/html' },
    });
  }
});
