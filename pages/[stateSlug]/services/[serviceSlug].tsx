import { GetStaticPaths, GetStaticProps } from 'next';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';
import StateServicePage from '@/pages/StateServicePage';

interface StateServiceRouteProps {
  stateSlug: string;
  serviceSlug: string;
  stateName: string;
  stateId: string;
  treatment: { id: string; name: string; slug: string; description?: string | null };
  faqsProp: { q: string; a: string }[];
  seoContentProp?: any;
  citiesProp?: any[];
  profilesProp?: any[];
  priceRangesProp?: any[];
}

export default function StateServiceRoutePage(props: StateServiceRouteProps) {
  return <StateServicePage {...props} />;
}

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const supabase = createServerSupabaseAdmin();

    if (!supabase) {
      return { paths: [], fallback: 'blocking' };
    }

    const [statesResult, treatmentsResult] = await Promise.all([
      supabase.from('states').select('slug').eq('is_active', true),
      supabase.from('treatments').select('slug').eq('is_active', true),
    ]);

    const states = statesResult.data || [];
    const treatments = treatmentsResult.data || [];

    const paths = states.flatMap((state) =>
      treatments.map((treatment) => ({
        params: {
          stateSlug: state.slug,
          serviceSlug: treatment.slug,
        },
      }))
    );

    return { paths, fallback: 'blocking' };
  } catch (error) {
    console.error('Error generating state service paths:', error);
    return { paths: [], fallback: 'blocking' };
  }
};

export const getStaticProps: GetStaticProps<StateServiceRouteProps> = async ({ params }) => {
  const supabase = createServerSupabaseAdmin();
  const stateSlug = params?.stateSlug as string | undefined;
  const serviceSlug = params?.serviceSlug as string | undefined;
  const normalizedStateSlug = normalizeStateSlug(stateSlug || '');

  if (!normalizedStateSlug || !serviceSlug) {
    return { notFound: true };
  }

  if (normalizedStateSlug !== stateSlug) {
    return {
      redirect: {
        destination: `/${normalizedStateSlug}/services/${serviceSlug}/`,
        permanent: true,
      },
    };
  }

  if (!supabase) {
    return { notFound: true };
  }

  const seoSlug = `${normalizedStateSlug}/${serviceSlug}`;
  const seoSlugWithSlash = `/${seoSlug}`;

  const [stateResult, treatmentResult, seoResult] = await Promise.all([
    supabase
      .from('states')
      .select('id, name, slug')
      .eq('slug', normalizedStateSlug)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('treatments')
      .select('id, name, slug, description')
      .eq('slug', serviceSlug)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('seo_pages')
      .select('*')
      .in('slug', [seoSlug, seoSlugWithSlash])
      .order('is_optimized', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const state = stateResult.data;
  const treatment = treatmentResult.data;

  if (!state || !treatment) {
    return { notFound: true };
  }

  const [citiesResult, priceRangesResult] = await Promise.all([
    supabase
      .from('cities')
      .select('id, name, slug')
      .eq('state_id', state.id)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('service_price_ranges')
      .select(`
        *,
        state:states(id, name, slug, abbreviation),
        treatment:treatments(id, name, slug)
      `)
      .eq('is_active', true)
      .eq('treatment_id', treatment.id)
      .order('price_min'),
  ]);

  const faqsProp = Array.isArray(seoResult.data?.faqs)
    ? seoResult.data.faqs.map((faq: any) => ({
        q: faq.q || faq.question,
        a: faq.a || faq.answer,
      }))
    : [];

  const stateCities = citiesResult.data || [];
  const cityIds = stateCities.map((city) => city.id);
  let profilesProp: any[] = [];

  if (cityIds.length > 0) {
    const [clinicsResult, clinicTreatmentsResult] = await Promise.all([
      supabase
        .from('clinics')
        .select(`
          id, name, slug, description, cover_image_url, rating, review_count,
          address, phone, verification_status, claim_status,
          city:cities(name, slug, state:states(name, abbreviation)),
          city_id
        `)
        .in('city_id', cityIds)
        .eq('is_active', true)
        .order('rating', { ascending: false }),
      supabase
        .from('clinic_treatments')
        .select('clinic_id, treatment_id')
        .eq('treatment_id', treatment.id),
    ]);

    const allowedClinicIds = new Set((clinicTreatmentsResult.data || []).map((item) => item.clinic_id));
    profilesProp = (clinicsResult.data || [])
      .filter((clinic: any) => allowedClinicIds.has(clinic.id))
      .map((clinic: any) => ({
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        type: 'clinic',
        specialty: treatment.name,
        location: clinic.city ? `${clinic.city.name}, ${clinic.city.state?.name || ''}` : '',
        rating: clinic.rating || 0,
        reviewCount: clinic.review_count || 0,
        image: clinic.cover_image_url,
        isVerified: clinic.verification_status === 'verified',
        isClaimed: clinic.claim_status === 'claimed',
        isPinned: false,
      }));
  }

  return {
    props: {
      stateSlug: normalizedStateSlug,
      serviceSlug,
      stateName: state.name,
      stateId: state.id,
      treatment,
      faqsProp,
      seoContentProp: seoResult.data || null,
      citiesProp: stateCities,
      profilesProp,
      priceRangesProp: priceRangesResult.data || [],
    },
    revalidate: 600,
  };
};
