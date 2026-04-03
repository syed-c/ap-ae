import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import ServiceLocationPageComponent from '@/pages/ServiceLocationPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

const BASE_URL = 'https://www.appointpanda.ae';

const ServiceLocationPageWithSEO = ({ stateSlug, citySlug, serviceSlug, stateData, cityData, treatmentData, seoData, faqs, seoH1 }: {
    stateSlug: string;
    citySlug: string;
    serviceSlug: string;
    stateData: any;
    cityData: any;
    treatmentData: any;
    seoData: { title: string | null; description: string | null; canonical: string };
    faqs: { question: string; answer: string }[];
    seoH1: string | null;
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title || 'Loading...'}</title>
                <meta name="description" content={seoData.description || 'Loading...'} />
                <link rel="canonical" href={seoData.canonical} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:title" content={seoData.title ? (seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`) : 'Loading...'} />
                <meta property="og:description" content={seoData.description || 'Loading...'} />
                <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta name="twitter:title" content={seoData.title ? (seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`) : 'Loading...'} />
                <meta name="twitter:description" content={seoData.description || 'Loading...'} />
                <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
            </Head>
            <ServiceLocationPageComponent 
                stateSlugProp={stateSlug}
                citySlugProp={citySlug}
                serviceSlugProp={serviceSlug}
                stateDataProp={stateData}
                cityDataProp={cityData}
                treatmentDataProp={treatmentData}
                seoDataProp={seoData}
                faqsProp={faqs}
                seoH1Prop={seoH1}
            />
        </>
    );
};

export default ServiceLocationPageWithSEO;

// Generate static paths - LIMITED to top cities only for build speed
// Service-location pages for other cities will be ISR
export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabaseAdmin();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        // Get top 100 cities with most clinics
        const { data: cities } = await supabase
            .from('cities')
            .select('slug, state:states(slug)')
            .eq('is_active', true)
            .limit(100);
        
        // Get all treatments for top cities
        const { data: treatments } = await supabase
            .from('treatments')
            .select('slug')
            .eq('is_active', true);
        
        const paths: { params: { stateSlug: string; citySlug: string; serviceSlug: string } }[] = [];
        
        for (const city of cities || []) {
            if (!city.state?.slug) continue;
            for (const treatment of treatments || []) {
                paths.push({
                    params: {
                        stateSlug: city.state.slug,
                        citySlug: city.slug,
                        serviceSlug: treatment.slug
                    }
                });
            }
        }
        
        return { paths, fallback: 'blocking' };
    } catch (error) {
        console.error('Error generating service location paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

// Static Site Generation with SSR FAQ data for Googlebot
export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabaseAdmin();
    const stateSlug = ctx.params?.stateSlug as string;
    const citySlug = ctx.params?.citySlug as string;
    const serviceSlug = ctx.params?.serviceSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug || !citySlug || !serviceSlug) {
        return { notFound: true };
    }

    const seoSlug = `${normalizedStateSlug}/${citySlug}/${serviceSlug}`;

    // Direct queries instead of React Query for faster build
    const [stateData, cityData, treatmentData, seoContent] = await Promise.all([
        supabase
            .from('states')
            .select('*')
            .eq('slug', normalizedStateSlug)
            .eq('is_active', true)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from('cities')
            .select('*, state:states(*)')
            .eq('slug', citySlug)
            .eq('is_active', true)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from('treatments')
            .select('*')
            .eq('slug', serviceSlug)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from('seo_pages')
            .select('id, slug, meta_title, meta_description, content, is_optimized, h1, faqs')
            .eq('slug', seoSlug)
            .order('is_optimized', { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data)
    ]);

    if (!stateData) {
        return { notFound: true };
    }

    const stateName = stateData.name;
    const cityName = cityData?.name || citySlug;
    const treatmentName = treatmentData?.name || serviceSlug;
    const metaTitle = seoContent?.meta_title || null;
    const metaDescription = seoContent?.meta_description || null;
    const seoH1 = seoContent?.h1 || null;

    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0) {
        ssrFaqs = seoContent.faqs.map((f: any) => ({
            question: f.question || f.q,
            answer: f.answer || f.a
        }));
    }

    return {
        props: {
            stateSlug: normalizedStateSlug,
            citySlug,
            serviceSlug,
            stateData,
            cityData,
            treatmentData,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/${normalizedStateSlug}/${citySlug}/${serviceSlug}/`,
            },
            faqs: ssrFaqs,
            seoH1: seoH1,
        },
        revalidate: 3600,
    };
};
