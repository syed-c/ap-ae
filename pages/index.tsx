import { GetStaticProps } from 'next';
import Head from 'next/head';
import IndexPage from '@/pages/Index';
import { createServerSupabase } from '@/lib/supabaseServer';
import { ACTIVE_STATE_SLUGS } from '@/lib/constants/activeStates';

const BASE_URL = 'https://www.appointpanda.ae';

interface HomePageProps {
  seoData: { title: string; description: string; canonical: string };
  realCounts: { clinics: number; states: number; cities: number; dentists: number; treatments: number } | null;
  topProfiles: {
    id: string;
    name: string;
    slug: string;
    type: 'dentist' | 'clinic';
    specialty: string;
    location: string;
    rating: number;
    reviewCount: number;
    image: string;
    isVerified: boolean;
    clinicName: string;
    clinicId: string;
    areaId: string | null;
    cityId: string;
  }[];
  statesWithClinics: { id: string; name: string; slug: string; abbreviation: string }[];
}

export default function IndexPageWithSEO({
  seoData,
  realCounts,
  topProfiles,
  statesWithClinics,
}: HomePageProps) {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AppointPanda",
    "url": BASE_URL,
    "description": "Find and book appointments with top-rated dental professionals across the UAE.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": [],
  };

  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <link rel="canonical" href={seoData.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
        <meta property="og:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
        <meta name="twitter:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </Head>
      <IndexPage
        seoDataProp={seoData}
        realCountsProp={realCounts}
        topProfilesProp={topProfiles}
        statesWithClinicsProp={statesWithClinics}
      />
    </>
  );
}

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const supabase = createServerSupabase();
  
  // Simplified: only fetch states and a small number of top clinics directly
  const [statesRes, topClinics] = await Promise.all([
    supabase.from('states').select('*').eq('is_active', true).in('slug', ACTIVE_STATE_SLUGS).order('display_order'),
    supabase
      .from('clinics')
      .select(`id, name, slug, cover_image_url, rating, review_count, verification_status, claim_status, city_id, area:areas(id, name, slug), city:cities(id, name, slug, state_id)`)
      .eq('is_active', true)
      .eq('is_duplicate', false)
      .not('cover_image_url', 'is', null)
      .order('rating', { ascending: false })
      .limit(20)
  ]);

  const allStates = (statesRes.data || []) as any[];
  const statesWithClinicsData = allStates.map(s => ({ id: s.id, name: s.name, slug: s.slug, abbreviation: s.abbreviation }));

  const profiles: HomePageProps['topProfiles'] = [];
  const seenLocations = new Set<string>();
  for (const c of (topClinics.data || []) as any[]) {
    if (!c.cover_image_url) continue;
    const locationKey = c.city?.id || c.id;
    if (seenLocations.has(locationKey)) continue;
    seenLocations.add(locationKey);
    profiles.push({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: 'clinic',
      specialty: 'Dental Clinic',
      location: c.area?.name || c.city?.name || 'UAE',
      rating: Number(c.rating) || 0,
      reviewCount: c.review_count || 0,
      image: c.cover_image_url,
      isVerified: c.claim_status === 'claimed' && c.verification_status === 'verified',
      clinicName: c.name,
      clinicId: c.id,
      areaId: c.area?.id || null,
      cityId: c.city?.id,
    });
    if (profiles.length >= 20) break;
  }

  return {
    props: {
      seoData: {
        title: 'AppointPanda - Find & Book Dental Appointments in UAE',
        description: 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.',
        canonical: '/',
      },
      realCounts: null,
      topProfiles: profiles,
      statesWithClinics: statesWithClinicsData,
    },
    revalidate: 300,
  };
};
