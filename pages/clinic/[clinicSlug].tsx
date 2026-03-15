import { GetStaticProps, GetStaticPaths } from 'next';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import ClinicPageComponent from '@/pages/ClinicPage';

export default ClinicPageComponent;

// Generate static paths for all clinic pages at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: clinics } = await supabase
        .from('clinics')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (clinics || []).map(clinic => ({
        params: { clinicSlug: clinic.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} clinic page paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Static Site Generation - prefetch ALL critical data for SEO
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const clinicSlug = ctx.params?.clinicSlug as string;

    if (!clinicSlug) {
        return { notFound: true };
    }

    const seoSlug = `clinic/${clinicSlug}`;

    // Prefetch clinic and SEO content (critical for SEO)
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['clinic', clinicSlug],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from("clinics")
                    .select("*, city:cities(name, slug, state:states(name, slug, abbreviation)), area:areas(name, slug)")
                    .eq("slug", clinicSlug)
                    .maybeSingle();
                if (error) throw error;
                return data;
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
        }),
        // Also prefetch dentists, treatments, reviews for complete SSR
        queryClient.prefetchQuery({
            queryKey: ["clinic-dentists-by-slug", clinicSlug],
            queryFn: async () => {
                // First get clinic ID
                const { data: clinic } = await supabase
                    .from("clinics")
                    .select("id")
                    .eq("slug", clinicSlug)
                    .maybeSingle();
                if (!clinic) return [];
                
                const { data } = await supabase
                    .from("dentists")
                    .select("*")
                    .eq("clinic_id", clinic.id)
                    .eq("is_active", true)
                    .order("is_primary", { ascending: false })
                    .order("name");
                return data || [];
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ["clinic-treatments-by-slug", clinicSlug],
            queryFn: async () => {
                const { data: clinic } = await supabase
                    .from("clinics")
                    .select("id")
                    .eq("slug", clinicSlug)
                    .maybeSingle();
                if (!clinic) return [];
                
                const { data } = await supabase
                    .from("clinic_treatments")
                    .select("*, treatment:treatments(*)")
                    .eq("clinic_id", clinic.id);
                return data || [];
            }
        })
    ]);

    const clinic = queryClient.getQueryData<any>(['clinic', clinicSlug]);
    if (!clinic) {
        return { notFound: true };
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            // Also pass data directly as props for immediate access
            clinicSlug,
        },
        revalidate: 3600,
    };
};
