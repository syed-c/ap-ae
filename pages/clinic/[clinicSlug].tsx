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

// Convert to Static Site Generation - FULL DATA PREFETCH FOR SEO
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const clinicSlug = ctx.params?.clinicSlug as string;

    if (!clinicSlug) {
        return { notFound: true };
    }

    // Fetch clinic data
    await queryClient.prefetchQuery({
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
    });

    const clinic = queryClient.getQueryData<any>(['clinic', clinicSlug]);
    if (!clinic) {
        return { notFound: true };
    }

    // Fetch SEO content
    const seoSlug = `clinic/${clinicSlug}`;
    await queryClient.prefetchQuery({
        queryKey: ['seo-page-content', seoSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from("seo_pages")
                .select("*")
                .or(`slug.eq.${seoSlug},slug.eq./${seoSlug}`)
                .order("is_optimized", { ascending: false })
                .order("updated_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            return data || null;
        }
    });

    // Fetch dentists, treatments, and reviews IN PARALLEL
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["clinic-dentists", clinic.id],
            queryFn: async () => {
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
            queryKey: ["clinic-treatments", clinic.id],
            queryFn: async () => {
                const { data } = await supabase
                    .from("clinic_treatments")
                    .select("*, treatment:treatments(*)")
                    .eq("clinic_id", clinic.id);
                return data || [];
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ["clinic-reviews", clinic.id],
            queryFn: async () => {
                const { data } = await supabase
                    .from("review_funnel_events")
                    .select("*")
                    .eq("clinic_id", clinic.id)
                    .eq("event_type", "rating_submitted")
                    .order("created_at", { ascending: false })
                    .limit(20);
                return (data || []).map((r: any) => ({
                    id: r.id,
                    patient_name: r.visitor_id || 'Anonymous',
                    rating: r.rating || 5,
                    content: r.comment || '',
                    created_at: r.created_at,
                    source: 'internal' as const,
                }));
            }
        })
    ]);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
        },
        revalidate: 3600,
    };
};
