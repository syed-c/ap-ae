import { GetStaticProps } from 'next';
import Head from 'next/head';
import IndexPage from '@/pages/Index';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';

const BASE_URL = 'https://www.appointpanda.ae';

export interface HomePageData {
  clinicCount: number;
  reviewCount: number;
  avgRating: number;
  clinicsWithImages: number;
  topDentalClinics: {
    id: string;
    name: string;
    slug: string;
    coverImageUrl: string | null;
    rating: number;
    reviewCount: number;
    cityName: string | null;
    stateName: string | null;
  }[];
  statesData: { id: string; name: string; slug: string; clinicCount: number }[];
  treatmentsData: { name: string; slug: string; count: number }[];
  citiesData: { id: string; name: string; slug: string; stateId: string }[];
}

export default function IndexPageWithSEO({ pageData }: { pageData: HomePageData }) {
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
    }
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </Head>
      <IndexPage pageData={pageData} />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const supabase = createServerSupabaseAdmin();
    if (!supabase) return { props: { pageData: null }, revalidate: 3600 };

    const [
      { count: totalClinics },
      { count: totalReviews },
      { data: ratingData },
      { count: clinicsWithImages },
      { data: states },
      { data: treatments },
      { data: cities },
    ] = await Promise.all([
      supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('google_reviews').select('*', { count: 'exact', head: true }),
      supabase.from('clinics').select('average_rating').eq('is_active', true).gt('average_rating', 0),
      supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('is_active', true).not('cover_image_url', 'is', null),
      supabase.from('states').select('id, name, slug').eq('is_active', true).order('display_order'),
      supabase.from('treatments').select('id, name, slug').eq('is_active', true).order('display_order'),
      supabase.from('cities').select('id, name, slug, state_id').eq('is_active', true),
    ]);

    // Get dental clinics with best data for featured section
    const dentalKeywords = ['dental', 'dentist', 'dentistry', 'orthodont', 'smile', 'oral', 'endodont', 'periodont', 'veneers', 'invisalign', 'braces'];
    const { data: topClinics } = await supabase
      .from('clinics')
      .select('id, name, slug, cover_image_url, average_rating, total_reviews, city_id')
      .eq('is_active', true)
      .not('cover_image_url', 'is', null)
      .gt('total_reviews', 10)
      .or(dentalKeywords.map(k => 'name.ilike.%' + k + '%').join(','))
      .order('total_reviews', { ascending: false })
      .limit(12);

    // Build city->state map
    const cityStateMap: Record<string, string> = {};
    const cityNameMap: Record<string, string> = {};
    (cities || []).forEach(c => {
      cityStateMap[c.id] = c.state_id;
      cityNameMap[c.id] = c.name;
    });

    // Build state name map
    const stateNameMap: Record<string, string> = {};
    (states || []).forEach(s => { stateNameMap[s.id] = s.name; });

    // Build state slug map
    const stateSlugMap: Record<string, string> = {};
    (states || []).forEach(s => { stateSlugMap[s.id] = s.slug; });

    // Count clinics per state by joining city -> state
    const { data: allClinicCities } = await supabase
      .from('clinics')
      .select('id, city_id')
      .eq('is_active', true);

    const stateClinicCounts: Record<string, number> = {};
    (allClinicCities || []).forEach(c => {
      const sid = cityStateMap[c.city_id];
      if (sid) stateClinicCounts[sid] = (stateClinicCounts[sid] || 0) + 1;
    });

    // Compute average rating
    const avgR = ratingData?.length
      ? (ratingData.reduce((s: number, r: any) => s + (r.average_rating || 0), 0) / ratingData.length)
      : 4.7;

    const avgRating = Math.round(avgR * 10) / 10;

    // Build top clinics with city/state names
    const topDentalClinics = (topClinics || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      coverImageUrl: c.cover_image_url,
      rating: c.average_rating || 0,
      reviewCount: c.total_reviews || 0,
      cityName: cityNameMap[c.city_id] || null,
      stateName: stateNameMap[cityStateMap[c.city_id]] || null,
    }));

    // Build treatments with counts (approximate from clinic_treatments or use display count)
    const treatmentsData = (treatments || []).map(t => ({
      name: t.name,
      slug: t.slug,
      count: 0, // real count would need clinic_treatments table
    }));

    const statesData = (states || []).map(s => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      clinicCount: stateClinicCounts[s.id] || 0,
    }));

    const citiesData = (cities || []).map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      stateId: c.state_id,
    }));

    const pageData: HomePageData = {
      clinicCount: totalClinics || 0,
      reviewCount: totalReviews || 0,
      avgRating,
      clinicsWithImages: clinicsWithImages || 0,
      topDentalClinics,
      statesData,
      treatmentsData,
      citiesData,
    };

    return {
      props: { pageData },
      revalidate: 3600,
    };
  } catch (e) {
    console.error('Failed to fetch homepage data:', e);
    return { props: { pageData: null }, revalidate: 60 };
  }
};
