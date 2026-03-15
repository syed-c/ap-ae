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
        fallback: 'blocking' // Generate pages on-demand if not built initially
    };
};

// Convert to Static Site Generation - OPTIMIZED VERSION
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug) {
        return { notFound: true };
    }

    // Only fetch essential data for initial render
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['state', normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('states')
                    .select('id, name, slug, abbreviation')
                    .eq('slug', normalizedStateSlug)
                    .eq('is_active', true)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ["treatments"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("treatments")
                    .select("id, name, slug")
                    .eq("is_active", true)
                    .order("display_order")
                    .limit(8);
                return data || [];
            },
        })
    ]);

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    if (!stateData) {
        return { notFound: true };
    }

    // Fetch SEO content - simplified
    const seoSlug = normalizedStateSlug;
    await queryClient.prefetchQuery({
        queryKey: ['seo-page-content', seoSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from("seo_pages")
                .select("id, slug, meta_title, meta_description, content, is_optimized")
                .or(`slug.eq.${seoSlug},slug.eq./${seoSlug}`)
                .order("is_optimized", { ascending: false })
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            return data || null;
        }
    });

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600, // Revalidate every hour (ISR)
    };
};
