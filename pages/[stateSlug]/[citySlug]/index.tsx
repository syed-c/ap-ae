import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import CityPageComponent from '@/pages/CityPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const BASE_URL = 'https://www.appointpanda.ae';

const CityPageWithSEO = ({ citySlug, stateSlug, stateData, cityData, seoData, faqs, seoH1 }: {
    citySlug: string;
    stateSlug: string;
    stateData: any;
    cityData: any;
    seoData: { title: string | null; description: string | null; canonical: string };
    faqs: { question: string; answer: string }[];
    seoH1: string | null;
}) => {
    const fallbackTitle = `Best Dentists in ${cityData?.name || citySlug}, ${stateData?.name || stateSlug} | AppointPanda`;
    const fallbackDescription = `Find the best dentists in ${cityData?.name || citySlug}, ${stateData?.name || stateSlug}. Book appointments online with top-rated dental clinics near you.`;

    return (
        <>
            <Head>
                <title>{seoData.title || fallbackTitle}</title>
                <meta name="description" content={seoData.description || fallbackDescription} />
                <link rel="canonical" href={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:title" content={seoData.title ? (seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`) : fallbackTitle} />
                <meta property="og:description" content={seoData.description || fallbackDescription} />
                <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta name="twitter:title" content={seoData.title ? (seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`) : fallbackTitle} />
                <meta name="twitter:description" content={seoData.description || fallbackDescription} />
                <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
                            { "@type": "ListItem", position: 2, name: stateData?.name || stateSlug, item: `${BASE_URL}/${stateSlug}/` },
                            { "@type": "ListItem", position: 3, name: cityData?.name || citySlug, item: `${BASE_URL}${seoData.canonical}` },
                        ]
                    }) }}
                />
            </Head>
            <CityPageComponent 
                citySlugProp={citySlug}
                stateSlugProp={stateSlug}
                stateDataProp={stateData}
                cityDataProp={cityData}
                seoDataProp={seoData}
                faqsProp={faqs}
                seoH1Prop={seoH1}
            />
        </>
    );
};

export default CityPageWithSEO;

// Generate static paths - ALL active cities with valid state relationships
export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabaseAdmin();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        // Get all states (both active and inactive to catch all mappings)
        const { data: states } = await supabase
            .from('states')
            .select('id, slug, name');
        
        // Create state lookup maps
        const stateIdToSlug: Record<string, string> = {};
        (states || []).forEach(s => { stateIdToSlug[s.id] = s.slug; });
        
        // Get ALL cities from database
        const { data: cities } = await supabase
            .from('cities')
            .select('slug, state_id, name')
            .limit(500);
        
        // Build paths for ALL cities
        const paths: { params: { stateSlug: string; citySlug: string } }[] = [];
        
        for (const city of cities || []) {
            let matchedStateSlug: string | null = null;
            const citySlug = city.slug?.toLowerCase() || '';
            const cityName = city.name?.toLowerCase() || '';
            
            // First try direct state_id relationship
            if (city.state_id && stateIdToSlug[city.state_id]) {
                matchedStateSlug = stateIdToSlug[city.state_id];
            }
            
            // If no direct match, try fuzzy matching
            if (!matchedStateSlug) {
                for (const state of states || []) {
                    const stateSlug = state.slug.toLowerCase();
                    const stateName = (state.name || '').toLowerCase();
                    
                    // Various matching strategies
                    if (citySlug.startsWith(stateSlug) || 
                        citySlug.includes(stateSlug) ||
                        citySlug.includes('-' + stateSlug.split('-')[0]) ||
                        cityName.includes(stateName) ||
                        // Emirate-specific patterns
                        (stateSlug === 'ras-al-khaimah' && (citySlug.includes('rak') || citySlug.includes('ras'))) ||
                        (stateSlug === 'umm-al-quwain' && (citySlug.includes('uaq') || citySlug.includes('umm'))) ||
                        (stateSlug === 'ajman' && citySlug.includes('ajman')) ||
                        (stateSlug === 'fujairah' && citySlug.includes('fujairah'))
                    ) {
                        matchedStateSlug = state.slug;
                        break;
                    }
                }
            }
            
            if (matchedStateSlug) {
                paths.push({
                    params: {
                        stateSlug: matchedStateSlug,
                        citySlug: city.slug
                    }
                });
            }
        }
        
        console.log(`Generated ${paths.length} city paths`);
        
        return {
            paths,
            fallback: 'blocking'
        };
    } catch (error) {
        console.error('Error generating city paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

// Static Site Generation with SSR FAQ data for Googlebot
export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabaseAdmin();
    const stateSlug = ctx.params?.stateSlug as string;
    const citySlug = ctx.params?.citySlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (normalizedStateSlug === 'robots.txt') {
        return { notFound: true };
    }

    if (!normalizedStateSlug || !citySlug) {
        return { notFound: true };
    }

    const seoSlug = `${normalizedStateSlug}/${citySlug}`;

    // Direct queries instead of React Query for faster build
    const [stateData, cityData, seoContent] = await Promise.all([
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
            .from("seo_pages")
            .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
            .eq("slug", seoSlug)
            .order("is_optimized", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data)
    ]);

    // Also check cityData - return 404 if state is missing (but allow inactive cities)
    if (!stateData) {
        console.log(`404: state=${normalizedStateSlug}, city=${citySlug}, stateData=${!!stateData}, cityData=${!!cityData}`);
        return { notFound: true };
    }
    
    // If city not found with is_active=true, try without filter
    let finalCityData = cityData;
    if (!cityData) {
        const cityWithoutFilter = await supabase
            .from('cities')
            .select('*, state:states(*)')
            .eq('slug', citySlug)
            .maybeSingle()
            .then(r => r.data);
        finalCityData = cityWithoutFilter;
    }
    
    const cityName = finalCityData?.name || citySlug;
    const stateName = stateData?.name || normalizedStateSlug;
    
    // Only use SEO content if it actually exists in DB
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
            citySlug,
            stateSlug: normalizedStateSlug,
            stateData: stateData,
            cityData: finalCityData,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/${normalizedStateSlug}/${citySlug}/`,
            },
            faqs: ssrFaqs,
            seoH1: seoH1,
        },
        revalidate: 600,
    };
};
