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
      .select('faqs')
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

  const faqsProp = Array.isArray(seoResult.data?.faqs)
    ? seoResult.data.faqs.map((faq: any) => ({
        q: faq.q || faq.question,
        a: faq.a || faq.answer,
      }))
    : [];

  return {
    props: {
      stateSlug: normalizedStateSlug,
      serviceSlug,
      stateName: state.name,
      stateId: state.id,
      treatment,
      faqsProp,
    },
    revalidate: 600,
  };
};
