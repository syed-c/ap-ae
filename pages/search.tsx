import { GetServerSideProps } from 'next';
import Head from 'next/head';
import SearchPageComponent from '@/pages/SearchPage';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';

const BASE_URL = 'https://www.appointpanda.ae';

interface SearchPageSSRProps {
  emirates: { id: string; name: string; slug: string }[];
  treatments: { id: string; name: string; slug: string }[];
  insurances: { id: string; name: string }[];
  initialResults: {
    results: {
      id: string;
      name: string;
      slug: string;
      type: 'dentist' | 'clinic';
      title?: string;
      rating: number;
      reviewCount: number;
      image?: string;
      isVerified: boolean;
      clinicName?: string;
      emirateName?: string;
      areaName?: string;
      languages?: string[];
      gender?: string;
      specializations?: string[];
    }[];
    total: number;
  };
  seoData: { title: string; description: string; canonical: string };
}

const SearchPageWithSEO = ({ emirates, treatments, insurances, initialResults, seoData }: SearchPageSSRProps) => {
  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <link rel="canonical" href={`${BASE_URL}${seoData.canonical}`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
        <meta property="og:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
        <meta name="twitter:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}${seoData.canonical}`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${seoData.canonical}`} />
      </Head>
      <SearchPageComponent
        emiratesProp={emirates}
        treatmentsProp={treatments}
        insurancesProp={insurances}
        initialResultsProp={initialResults}
      />
    </>
  );
};

export default SearchPageWithSEO;

export const getServerSideProps: GetServerSideProps<SearchPageSSRProps> = async () => {
  const supabase = createServerSupabaseAdmin();

  if (!supabase) {
    return {
      props: {
        emirates: [],
        treatments: [],
        insurances: [],
        initialResults: { results: [], total: 0 },
        seoData: {
          title: 'Search Dentists & Clinics in UAE | AppointPanda',
          description: 'Find and book appointments with top-rated dental professionals across the UAE. Filter by location, treatment, insurance, and verified reviews.',
          canonical: '/search/',
        },
      },
    };
  }

  try {
    const [emiratesRes, treatmentsRes, insurancesRes, topClinicsRes] = await Promise.all([
      supabase
        .from('states')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order'),
      supabase
        .from('treatments')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(30),
      supabase
        .from('insurances')
        .select('id, name')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('clinics')
        .select(`
          id, name, slug, cover_image_url, rating, review_count,
          verification_status, claim_status,
          city:cities(name, slug, state_id, state:states(name, slug)),
          area:areas(name, slug)
        `)
        .eq('is_active', true)
        .eq('is_duplicate', false)
        .order('rating', { ascending: false })
        .limit(24),
    ]);

    const emirates = emiratesRes.data || [];
    const treatments = treatmentsRes.data || [];
    const insurances = insurancesRes.data || [];

    const initialResults = {
      results: (topClinicsRes.data || []).map((clinic: any) => ({
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        type: 'clinic' as const,
        title: 'Dental Clinic',
        rating: Number(clinic.rating) || 0,
        reviewCount: clinic.review_count || 0,
        image: clinic.cover_image_url || undefined,
        isVerified: clinic.claim_status === 'claimed' && clinic.verification_status === 'verified',
        clinicName: clinic.name,
        emirateName: clinic.city?.state?.name,
        areaName: clinic.area?.name || clinic.city?.name,
      })),
      total: topClinicsRes.count || (topClinicsRes.data?.length || 0),
    };

    return {
      props: {
        emirates,
        treatments,
        insurances,
        initialResults,
        seoData: {
          title: 'Search Dentists & Clinics in UAE | AppointPanda',
          description: 'Find and book appointments with top-rated dental professionals across the UAE. Filter by location, treatment, insurance, and verified reviews.',
          canonical: '/search/',
        },
      },
    };
  } catch (error) {
    console.error('Search page SSR error:', error);
    return {
      props: {
        emirates: [],
        treatments: [],
        insurances: [],
        initialResults: { results: [], total: 0 },
        seoData: {
          title: 'Search Dentists & Clinics in UAE | AppointPanda',
          description: 'Find and book appointments with top-rated dental professionals across the UAE.',
          canonical: '/search/',
        },
      },
    };
  }
};
