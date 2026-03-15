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

// Static Site Generation - minimal prefetch for SEO
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const serviceSlug = ctx.params?.serviceSlug as string;

    if (!serviceSlug) {
        return { notFound: true };
    }

    const seoSlug = `services/${serviceSlug}`;

    // Prefetch treatment and SEO content (critical for SEO)
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['treatment', serviceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('treatments')
                    .select('*')
                    .eq('slug', serviceSlug)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ['seo-page-content', seoSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("seo_pages")
                    .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
                    .or(`slug.eq.${seoSlug},slug.eq./${seoSlug}`)
                    .order("is_optimized", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return data || null;
            }
        })
    ]);

    const treatment = queryClient.getQueryData<any>(['treatment', serviceSlug]);
    if (!treatment) {
        return { notFound: true };
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600,
    };
};
