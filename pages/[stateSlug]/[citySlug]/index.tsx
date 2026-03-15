import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import CityPageComponent from '@/pages/CityPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

// Wrapper component to render SEO meta tags server-side
const CityPageWithSEO = ({ citySlug, stateSlug, seoData, dehydratedState }: {
    citySlug: string;
    stateSlug: string;
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
            <CityPageComponent 
                citySlugProp={citySlug}
                stateSlugProp={stateSlug}
                dehydratedStateProp={dehydratedState}
                seoDataProp={seoData}
            />
        </>
    );
};

export default CityPageWithSEO;

// Generate static paths for emirate-area combinations
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: cities } = await supabase
        .from('cities')
        .select('slug, state:states!inner(slug)')
        .eq('is_active', true)
        .eq('state.is_active', true);
    
    const TOP_CITIES_LIMIT = 20;
    
    const { data: cityClinics } = await supabase
        .from('clinics')
        .select('city_id');
    
    const cityCountMap = new Map<string, number>();
    (cityClinics || []).forEach((c: any) => {
        const count = cityCountMap.get(c.city_id) || 0;
        cityCountMap.set(c.city_id, count + 1);
    });
    
    const citiesWithCounts = (cities || []).map(city => ({
        ...city,
        clinicCount: cityCountMap.get(city.id) || 0
    })).sort((a: any, b: any) => b.clinicCount - a.clinicCount);
    
    const topCities = citiesWithCounts.slice(0, TOP_CITIES_LIMIT);
    
    const paths = topCities.map(city => ({
        params: { 
            stateSlug: city.state.slug,
            citySlug: city.slug 
        }
    }));
    
    console.log(`[SSG] Generated ${paths.length} area page paths (top ${TOP_CITIES_LIMIT})`);
    
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
    const citySlug = ctx.params?.citySlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug || !citySlug) {
        return { notFound: true };
    }

    const seoSlug = `${normalizedStateSlug}/${citySlug}`;

    // Prefetch state, city, and SEO content (critical for SEO)
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
            queryKey: ['city', citySlug, normalizedStateSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('cities')
                    .select('*, state:states(*)')
                    .eq('slug', citySlug)
                    .eq('is_active', true)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ['treatment-match', citySlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('treatments')
                    .select('id, name, slug')
                    .eq('slug', citySlug)
                    .eq('is_active', true)
                    .maybeSingle();
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

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    const cityData = queryClient.getQueryData<any>(['city', citySlug, normalizedStateSlug]);
    const seoContent = queryClient.getQueryData<any>(['seo-page-content', seoSlug]);
    
    const cityName = cityData?.name || citySlug;
    const stateName = stateData?.name || normalizedStateSlug;
    const metaTitle = seoContent?.meta_title || `Dental Clinics in ${cityName}, ${stateName} | Book Appointments`;
    const metaDescription = seoContent?.meta_description || `Find and book appointments with top-rated dental clinics in ${cityName}, ${stateName}. Verified dentists, real reviews.`;

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
            citySlug,
            stateSlug: normalizedStateSlug,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/${normalizedStateSlug}/${citySlug}/`,
            }
        },
        revalidate: 3600,
    };
};
