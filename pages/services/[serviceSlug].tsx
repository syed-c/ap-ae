import { GetStaticProps, GetStaticPaths } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import ServicePageComponent from '@/pages/ServicePage';

export default ServicePageComponent;

// Generate static paths for all service pages at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: treatments } = await supabase
        .from('treatments')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (treatments || []).map(treatment => ({
        params: { serviceSlug: treatment.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} service page paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Convert to Static Site Generation - OPTIMIZED VERSION
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const serviceSlug = ctx.params?.serviceSlug as string;

    if (!serviceSlug) {
        return { notFound: true };
    }

    // Only fetch essential data for initial render
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['treatment', serviceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('treatments')
                    .select('id, name, slug, description')
                    .eq('slug', serviceSlug)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ["related-treatments", serviceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("treatments")
                    .select("id, name, slug")
                    .eq("is_active", true)
                    .neq("slug", serviceSlug)
                    .order("display_order")
                    .limit(6);
                return data || [];
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ["states"],
            queryFn: async () => {
                const { data } = await supabase
                    .from("states")
                    .select("id, name, slug, abbreviation")
                    .eq("is_active", true)
                    .order("display_order");
                return data || [];
            },
        })
    ]);

    const treatment = queryClient.getQueryData<any>(['treatment', serviceSlug]);
    if (!treatment) {
        return { notFound: true };
    }

    // Fetch SEO content - simplified
    const seoSlug = `services/${serviceSlug}`;
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
