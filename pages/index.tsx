import { GetStaticProps } from 'next';
import Head from 'next/head';
import IndexPage from '@/pages/Index';
import { supabase } from '@/integrations/supabase/client';
import { ACTIVE_STATE_SLUGS } from '@/lib/constants/activeStates';

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
  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
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
  // Fetch ALL data IN PARALLEL for maximum speed
  const [
    realCountsData,
    statesRes,
    clinicsRes,
    citiesRes,
    treatmentsData,
  ] = await Promise.all([
    (async () => {
      const [statesRes, citiesRes, clinicsRes, dentistsRes, treatmentsRes] = await Promise.all([
        supabase.from('states').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('cities').select('id', { count: 'exact', head: true }).eq('is_active', true).not('state_id', 'is', null),
        supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('dentists').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('treatments').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);
      const activeStateIds = (statesRes.data || []).map((s: any) => s.id);
      return {
        clinics: clinicsRes.count || 0,
        states: activeStateIds.length,
        cities: citiesRes.count || 0,
        dentists: dentistsRes.count || 0,
        treatments: treatmentsRes.count || 0,
      };
    })(),
    supabase.from('states').select('*').eq('is_active', true).in('slug', ACTIVE_STATE_SLUGS).order('display_order'),
    (supabase.from('clinics').select('city_id') as any).eq('is_active', true).eq('is_duplicate', false),
    supabase.from('cities').select('id, state_id').eq('is_active', true),
    supabase.from('treatments').select('id, name, slug').eq('is_active', true).order('display_order'),
  ]);

  // Build statesWithClinics
  const allStates = (statesRes.data || []) as any[];
  const clinics = clinicsRes.data as Array<{ city_id: string | null }> | null;
  const citiesData = (citiesRes.data || []) as Array<{ id: string; state_id: string | null }> | null;
  const cityIds = (clinics || []).map(c => c.city_id).filter((id): id is string => id !== null);
  const cityIdSet = new Set(cityIds);
  const stateIdSet = new Set<string>();
  (citiesData || []).forEach(city => {
    if (cityIdSet.has(city.id) && city.state_id) stateIdSet.add(city.state_id);
  });
  const statesWithClinicsData = allStates
    .filter(s => stateIdSet.has(s.id))
    .map(s => ({ id: s.id, name: s.name, slug: s.slug, abbreviation: s.abbreviation }));

  // Build top profiles
  const activeCityIds = (citiesData || [])
    .filter((c: any) => c.state_id && stateIdSet.has(c.state_id))
    .map((c: any) => c.id);

  const { data: clinicsFull } = await supabase
    .from('clinics')
    .select(`id, name, slug, cover_image_url, rating, review_count, verification_status, claim_status, city_id, area:areas(id, name, slug), city:cities(id, name, slug, state_id)`)
    .eq('is_active', true)
    .in('city_id', activeCityIds)
    .order('rating', { ascending: false });

  const seenLocations = new Set<string>();
  const profiles: HomePageProps['topProfiles'] = [];
  for (const c of (clinicsFull || []) as any[]) {
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
    if (profiles.length >= 30) break;
  }

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
    revalidate: 60, // Revalidate every 60s
  };
};
