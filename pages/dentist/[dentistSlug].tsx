import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import DentistPageComponent from '@/pages/DentistPage';

// Wrapper component to render SEO meta tags server-side
const BASE_URL = 'https://www.appointpanda.ae';

const DentistPageWithSEO = ({ dentistSlug, dentistData, seoData, dehydratedState }: {
    dentistSlug: string;
    dentistData: any;
    seoData: { title: string; description: string; canonical: string };
    dehydratedState: any;
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
            </Head>
            <DentistPageComponent 
                dentistSlugProp={dentistSlug} 
                dentistDataProp={dentistData}
                dehydratedStateProp={dehydratedState}
                seoDataProp={seoData}
            />
        </>
    );
};

export default DentistPageWithSEO;

// Limit pre-rendered pages to prevent long build times
const TOP_DENTISTS_LIMIT = 20;

export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    console.log('[SSG] Generating dentist paths...');
    
    // Only pre-render top dentists by rating
    const { data: dentists } = await supabase
        .from('dentists')
        .select('slug, rating, review_count')
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(TOP_DENTISTS_LIMIT);
    
    const paths = (dentists || []).map(dentist => ({
        params: { dentistSlug: dentist.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} dentist paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Convert to Static Site Generation with SEO data
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const dentistSlug = ctx.params?.dentistSlug as string;

    if (!dentistSlug) {
        return { notFound: true };
    }

    const seoSlug = `dentist/${dentistSlug}`;

    // Prefetch dentist and SEO content
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['dentist', dentistSlug],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from("dentists")
                    .select("*, clinic:clinics(name, slug, city:cities(name, slug, state:states(name, slug, abbreviation)))")
                    .eq("slug", dentistSlug)
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

    const dentist = queryClient.getQueryData<any>(['dentist', dentistSlug]);
    if (!dentist) {
        return { notFound: true };
    }

    const seoContent = queryClient.getQueryData<any>(['seo-page-content', seoSlug]);
    
    const clinicName = dentist.clinic?.name || 'Dental Clinic';
    const cityName = dentist.clinic?.city?.name || 'UAE';
    const metaTitle = seoContent?.meta_title || `${dentist.name} - Dentist in ${cityName}`;
    const metaDescription = seoContent?.meta_description || `Book an appointment with ${dentist.name}. Professional dentist at ${clinicName} in ${cityName}.`;

    return { 
        props: {
            dehydratedState: dehydrate(queryClient),
            dentistSlug,
            dentistData: dentist,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/dentist/${dentistSlug}/`,
            }
        },
        revalidate: 3600
    };
};
