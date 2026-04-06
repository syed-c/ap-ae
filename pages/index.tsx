import { GetStaticProps } from 'next';
import Head from 'next/head';
import IndexPage from '@/pages/Index';
import { createServerSupabase } from '@/lib/supabaseServer';
import { ACTIVE_STATE_SLUGS } from '@/lib/constants/activeStates';

const BASE_URL = 'https://www.appointpanda.ae';

interface HomePageProps {
  seoData: { title: string; description: string };
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
    "sameAs": [
      "https://www.facebook.com/appointpanda/",
      "https://www.instagram.com/appointpanda/",
      "https://www.linkedin.com/company/appointpanda/",
      // Add Google Business Profile URL when claimed
      // "https://maps.google.com/?cid=XXXXXXXXXXXXXXXXX",
    ],
  };

  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <link rel="canonical" href={`${BASE_URL}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/`} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/`} />
        <meta name="twitter:title" content={seoData.title} />
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

  if (!supabase) {
    return {
      props: {
        seoData: {
          title: 'AppointPanda - Find & Book Dental Appointments in UAE',
          description: 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.',
        },
        realCounts: null,
        topProfiles: [],
        statesWithClinics: [],
      },
      revalidate: 300,
    };
  }
  
  try {
    // Fetch states
    const { data: statesData } = await supabase
      .from('states')
      .select('*')
      .eq('is_active', true)
      .in('slug', ACTIVE_STATE_SLUGS)
      .order('display_order');

    // Fetch counts using Promise.all for parallel execution
    const [clinicsRes, dentistsRes, citiesRes, treatmentsRes] = await Promise.all([
      supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('dentists').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('cities').select('id', { count: 'exact', head: true }).eq('is_active', true).not('state_id', 'is', null),
      supabase.from('treatments').select('id', { count: 'exact', head: true }).eq('is_active', true),
    ]);

    const realCountsData = {
      clinics: clinicsRes.count || 0,
      states: (statesData || []).length,
      cities: citiesRes.count || 0,
      dentists: dentistsRes.count || 0,
      treatments: treatmentsRes.count || 0,
    };

    // Fetch top clinics with related data
    const { data: clinicsData } = await supabase
      .from('clinics')
      .select('id, name, slug, cover_image_url, rating, review_count, verification_status, claim_status, city_id, area:areas(id, name, slug), city:cities(id, name, slug, state_id)')
      .eq('is_active', true)
      .eq('is_duplicate', false)
      .not('cover_image_url', 'is', null)
      .order('rating', { ascending: false })
      .limit(30);

    const profiles: HomePageProps['topProfiles'] = [];
    const seenLocations = new Set<string>();
    
    for (const c of (clinicsData || []) as any[]) {
      if (!c.cover_image_url) continue;
      const locationKey = c.city?.id || c.id;
      if (seenLocations.has(locationKey)) continue;
      seenLocations.add(locationKey);
      
      profiles.push({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: 'clinic' as const,
        specialty: 'Dental Clinic',
        location: c.area?.name || c.city?.name || 'UAE',
        rating: Number(c.rating) || 0,
        reviewCount: c.review_count || 0,
        image: c.cover_image_url,
        isVerified: c.claim_status === 'claimed' && c.verification_status === 'verified',
        clinicName: c.name,
        clinicId: c.id,
        areaId: c.area?.id || null,
        cityId: c.city?.id || '',
      });
      
      if (profiles.length >= 20) break;
    }

    const statesWithClinicsData = (statesData || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      abbreviation: s.abbreviation,
    }));

    return {
      props: {
        seoData: {
          title: 'AppointPanda - Find & Book Dental Appointments in UAE',
          description: 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.',
        },
        realCounts: realCountsData,
        topProfiles: profiles,
        statesWithClinics: statesWithClinicsData,
      },
      revalidate: 300,
    };
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    return {
      props: {
        seoData: {
          title: 'AppointPanda - Find & Book Dental Appointments in UAE',
          description: 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.',
        },
        realCounts: null,
        topProfiles: [],
        statesWithClinics: [],
      },
      revalidate: 300,
    };
  }
};