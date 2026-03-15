import { GetStaticProps, GetStaticPaths } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import StatePageComponent from '@/pages/StatePage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

export default StatePageComponent;

// Generate static paths for all emirates at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: states } = await supabase
        .from('states')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (states || []).map(state => ({
        params: { stateSlug: state.slug }
    }));
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Static Site Generation - minimal prefetch for SEO
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug) {
        return { notFound: true };
    }

    // Prefetch state and SEO content (critical for SEO)
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['state', normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('states')
                    .select('*')
                    .eq('slug', normalizedStateSlug)
                    .eq('is_active', true)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ['seo-page-content', normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("seo_pages")
                    .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
                    .or(`slug.eq.${normalizedStateSlug},slug.eq./${normalizedStateSlug}`)
                    .order("is_optimized", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return data || null;
            }
        })
    ]);

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    if (!stateData) {
        return { notFound: true };
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600,
    };
};
