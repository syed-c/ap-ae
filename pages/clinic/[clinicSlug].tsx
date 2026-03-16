import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import ClinicPageComponent from '@/pages/ClinicPage';

export default ClinicPageComponent;

// Limit pre-rendered pages to prevent long build times
// Rest will be generated on-demand with ISR
const TOP_CLINICS_LIMIT = 20;

export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    // Only pre-render top clinics by rating/review count
    const { data: clinics } = await supabase
        .from('clinics')
        .select('slug, rating, review_count')
        .eq('is_active', true)
        .eq('is_duplicate', false)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(TOP_CLINICS_LIMIT);
    
    const paths = (clinics || []).map(clinic => ({
        params: { clinicSlug: clinic.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} clinic page paths (limited to top ${TOP_CLINICS_LIMIT})`);
    
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

    // Only prefetch what's needed for SEO - let client fetch the rest
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
        })
    ]);
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

    const seoContent = queryClient.getQueryData<any>(['seo-page-content', seoSlug]);
    
    const cityName = clinic.city?.name || 'UAE';
    const stateAbbrev = clinic.city?.state?.abbreviation || 'UAE';
    const metaTitle = seoContent?.meta_title || `${clinic.name} - Dental Clinic in ${cityName}`;
    const metaDescription = seoContent?.meta_description || (clinic.description ? clinic.description.slice(0, 160) : `Book an appointment at ${clinic.name}. Professional dental clinic in ${cityName} with experienced dentists.`);

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            clinicSlug,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/clinic/${clinicSlug}/`,
            }
        },
        revalidate: 3600,
    };
};

// Wrapper component to render SEO meta tags server-side
const ClinicPageWithSEO = ({ clinicSlug, seoData, dehydratedState }: {
    clinicSlug: string;
    seoData: { title: string; description: string; canonical: string };
    dehydratedState: any;
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={seoData.canonical} />
            </Head>
            <ClinicPageComponent 
                clinicSlugProp={clinicSlug} 
                dehydratedStateProp={dehydratedState}
                seoDataProp={seoData}
            />
        </>
    );
};

export default ClinicPageWithSEO;
