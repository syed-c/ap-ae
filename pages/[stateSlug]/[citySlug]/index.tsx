import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import CityPageComponent from '@/pages/CityPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const BASE_URL = 'https://www.appointpanda.ae';

const CityPageWithSEO = ({ citySlug, stateSlug, stateData, cityData, seoData, faqs, seoH1, cityRatings, topClinics, allSeoData, pageContentDataProp, clinicProfilesProp }: {
    citySlug: string;
    stateSlug: string;
    stateData: any;
    cityData: any;
    seoData: { title: string | null; description: string | null; canonical: string };
    faqs: { question: string; answer: string }[];
    seoH1: string | null;
    cityRatings?: { avgRating: number; totalReviews: number; clinicCount: number };
    topClinics?: { name: string; slug: string; rating: number; review_count: number }[];
    allSeoData?: any;
    pageContentDataProp?: any;
    clinicProfilesProp?: any[];
}) => {
    const cityName = cityData?.name || citySlug;
    const stateName = stateData?.name || stateSlug;
    const clinicCount = cityRatings?.clinicCount || 0;
    const reviewCount = cityRatings?.totalReviews || 0;
    const fallbackTitle = `Best Dentists in ${cityName}, ${stateName} (2026) — Compare ${clinicCount}+ Clinics | AppointPanda`;
    const fallbackDescription = `Find the best dentists in ${cityName}, ${stateName}. Compare ${clinicCount}+ verified dental clinics with ${reviewCount.toLocaleString()}+ real patient reviews. Read ratings, check AED prices for implants, whitening, invisalign. Book your appointment online in minutes. Free consultation available.`;

    return (
        <>
            <Head>
                {/* ItemList — unique schema not duplicated in component */}
                {cityRatings && cityRatings.clinicCount > 0 && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ItemList",
                            "name": `Best Dentists in ${cityData?.name || citySlug}, ${stateData?.name || stateSlug}`,
                            "description": seoData.description || fallbackDescription,
                            "url": `${BASE_URL}${seoData.canonical}`,
                            "numberOfItems": cityRatings.clinicCount,
                            "itemListElement": (topClinics || []).slice(0, 5).map((c, i) => ({
                                "@type": "ListItem",
                                position: i + 1,
                                item: {
                                    "@type": "Dentist",
                                    "name": c.name,
                                    "url": `${BASE_URL}/clinic/${c.slug}/`,
                                    "aggregateRating": c.rating ? {
                                        "@type": "AggregateRating",
                                        "ratingValue": c.rating.toFixed(1),
                                        "reviewCount": c.review_count,
                                        "bestRating": "5",
                                    } : undefined
                                }
                            }))
                        }) }}
                    />
                )}
            </Head>
            <CityPageComponent 
                citySlugProp={citySlug}
                stateSlugProp={stateSlug}
                stateDataProp={stateData}
                cityDataProp={cityData}
                seoDataProp={seoData}
                faqsProp={faqs}
                seoH1Prop={seoH1}
                cityRatingsProp={cityRatings}
                topClinicsProp={topClinics}
                allSeoDataProp={allSeoData}
                pageContentDataProp={pageContentDataProp}
                clinicProfilesProp={clinicProfilesProp}
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

    if (!supabase) {
        return {
            props: {
                citySlug,
                stateSlug: normalizedStateSlug,
                stateData: null,
                cityData: null,
                seoData: {
                    title: `Best Dentists in ${citySlug}, UAE`,
                    description: 'Find and book dental appointments in UAE',
                    canonical: `/${normalizedStateSlug}/${citySlug}/`,
                },
                faqs: [],
                seoH1: null,
                cityRatings: null,
                topClinics: [],
                allSeoData: null,
                pageContentDataProp: null,
                clinicProfilesProp: [],
            },
            revalidate: 60,
        };
    }

    const seoSlug = `${normalizedStateSlug}/${citySlug}`;

    // Direct queries instead of React Query for faster build
const [stateData, cityData, seoContent, pageContent] = await Promise.all([
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
            .then(r => r.data) as Promise<any>,
        supabase
            .from('page_content')
            .select('meta_title, meta_description, h1, hero_intro, body_content, section_1_title, section_1_content, section_2_title, section_2_content, section_3_title, section_3_content')
            .eq('page_type', 'city')
            .in('page_slug', [citySlug, `/${citySlug}`, `${normalizedStateSlug}/${citySlug}`, `/${normalizedStateSlug}/${citySlug}`])
            .eq('is_published', true)
            .maybeSingle()
            .then(r => r.data) as Promise<any>
    ]);

    // Also check cityData - return 404 if state is missing (but allow inactive cities)
    if (!stateData) {
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

    // Fetch aggregate rating data for this city
    let cityRatings = { avgRating: 0, totalReviews: 0, clinicCount: 0 };
    let topClinics: any[] = [];
    let clinicProfilesProp: any[] = [];
    if (finalCityData?.id) {
        const ratingsData = await supabase
            .from('clinics')
            .select('rating, review_count')
            .eq('city_id', finalCityData.id)
            .eq('is_active', true)
            .not('rating', 'is', null)
            .then(r => r.data);
        
        if (ratingsData && ratingsData.length > 0) {
            const totalRating = ratingsData.reduce((sum, c) => sum + (c.rating || 0), 0);
            const totalReviews = ratingsData.reduce((sum, c) => sum + (c.review_count || 0), 0);
            cityRatings = {
                avgRating: totalRating / ratingsData.length,
                totalReviews: totalReviews,
                clinicCount: ratingsData.length
            };
        }

        // Fetch top 5 clinics for ItemList schema
        const topClinicsData = await supabase
            .from('clinics')
            .select('name, slug, rating, review_count')
            .eq('city_id', finalCityData.id)
            .eq('is_active', true)
            .not('rating', 'is', null)
            .order('rating', { ascending: false })
            .order('review_count', { ascending: false })
            .limit(5);
        topClinics = topClinicsData?.data || [];

        // Pre-fetch clinic profiles for SSR (already fetched in query above)
        const allCityClinics = await (supabase
            .from('clinics') as any)
            .select(`
                id, name, slug, type, rating, review_count, image_url, is_verified, is_claimed, is_pinned,
                location, address, phone, website, languages, area_id, city_id,
                state:states(name, slug),
                treatments(treatment_id, treatment:treatments(id, name, slug))
            `)
            .eq('city_id', finalCityData.id)
            .eq('is_active', true)
            .order('rating', { ascending: false })
            .order('review_count', { ascending: false })
            .limit(50);
        
        if (allCityClinics.data) {
            clinicProfilesProp = allCityClinics.data;
        }
    }
    
    const cityName = finalCityData?.name || citySlug;
    const stateName = stateData?.name || normalizedStateSlug;
    
    // Always generate meta - either from page_content, seo_pages, or auto-generated
    const metaTitle = pageContent?.meta_title || seoContent?.meta_title || `Best Dentists in ${cityName}, ${stateName} (2026) — Book Now | AppointPanda`;
    const metaDescription = pageContent?.meta_description || seoContent?.meta_description || `Find verified dental clinics in ${cityName}, ${stateName}. Compare ratings, prices, and book your appointment online.`;
    const seoH1 = pageContent?.h1 || seoContent?.h1 || `Best Dentists in ${cityName}, ${stateName}`;

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
            cityRatings: cityRatings,
            topClinics: topClinics,
            allSeoData: seoContent,
            pageContentDataProp: pageContent,
            clinicProfilesProp: clinicProfilesProp,
        },
        revalidate: 600,
    };
};
