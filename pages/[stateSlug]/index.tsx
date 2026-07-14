import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import StatePageComponent from '@/pages/StatePage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

const BASE_URL = 'https://www.appointpanda.ae';

const StatePageWithSEO = ({ stateSlug, stateData, citiesData, seoData, faqs, seoH1, stateRatings, topClinics, pageContentData, allSeoData, clinicProfilesProp, treatmentsDataProp }: {
    stateSlug: string;
    stateData: any;
    citiesData: any[];
    seoData: { title: string | null; description: string | null; canonical: string };
    faqs: { question: string; answer: string }[];
    seoH1: string | null;
    stateRatings?: { avgRating: number; totalReviews: number; clinicCount: number };
    topClinics?: { name: string; slug: string; rating: number; review_count: number }[];
    pageContentData?: any;
    allSeoData?: any;
    clinicProfilesProp?: any[];
    treatmentsDataProp?: any[];
}) => {
    const stateName = stateData?.name || stateSlug;
    const clinicCount = stateRatings?.clinicCount || 0;
    const reviewCount = stateRatings?.totalReviews || 0;
    const fallbackTitle = `Best Dentists in ${stateName}, UAE (2026) — Book Online Today | AppointPanda`;
    const fallbackDescription = `Compare ${clinicCount.toLocaleString()}+ verified DHA-licensed dentists across ${stateName}, UAE. Read ${reviewCount.toLocaleString()}+ real patient reviews, see transparent AED pricing for implants, braces, veneers. Book appointments instantly with top-rated dental professionals. Your perfect smile starts here.`;

    return (
        <>
            <Head>
                {/* ItemList — unique schema not duplicated in component */}
                {stateRatings && stateRatings.clinicCount > 0 && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "ItemList",
                            "name": `Best Dentists in ${stateData?.name || stateSlug}, UAE`,
                            "description": seoData.description || fallbackDescription,
                            "url": `${BASE_URL}${seoData.canonical}`,
                            "numberOfItems": stateRatings.clinicCount,
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
<StatePageComponent 
                stateSlugProp={stateSlug}
                stateDataProp={stateData}
                citiesDataProp={citiesData}
                seoDataProp={seoData}
                faqsProp={faqs}
                seoH1Prop={seoH1}
                stateRatingsProp={stateRatings}
                topClinicsProp={topClinics}
                allSeoDataProp={allSeoData}
                pageContentDataProp={pageContentData}
                clinicProfilesProp={clinicProfilesProp}
                treatmentsDataProp={treatmentsDataProp}
            />
        </>
    );
};

export default StatePageWithSEO;

export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabaseAdmin();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        const { data: states } = await supabase
            .from('states')
            .select('slug')
            .eq('is_active', true);
        
        const paths = (states || []).map((state) => ({
            params: { stateSlug: state.slug }
        }));
        
        return {
            paths,
            fallback: 'blocking'
        };
    } catch (error) {
        console.error('Error generating state paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabaseAdmin();
    const stateSlug = ctx.params?.stateSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug) {
        return { notFound: true };
    }

    if (normalizedStateSlug !== stateSlug) {
        return {
            redirect: {
                destination: `/${normalizedStateSlug}/`,
                permanent: true,
            },
        };
    }

    if (!supabase) {
        return {
            props: {
                stateSlug: normalizedStateSlug,
                stateData: null,
                citiesData: [],
                seoData: {
                    title: `Best Dentists in ${normalizedStateSlug}, UAE`,
                    description: 'Find and book dental appointments in UAE',
                    canonical: `/${normalizedStateSlug}/`,
                },
                faqs: [],
                seoH1: null,
                stateRatings: null,
                topClinics: [],
                allSeoData: null,
                pageContentData: null,
                clinicProfilesProp: [],
            },
            revalidate: 60,
        };
    }

    const stateData = await supabase
        .from('states')
        .select('*')
        .eq('slug', normalizedStateSlug)
        .eq('is_active', true)
        .maybeSingle()
        .then(r => r.data);

    if (!stateData) {
        return { notFound: true };
    }
    
    const [seoContent, citiesData, pageContent, treatmentsData] = await Promise.all([
        supabase
            .from("seo_pages")
            .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
            .eq("slug", normalizedStateSlug)
            .order("is_optimized", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data) as Promise<any>,
        supabase
            .from('cities')
            .select('id, name, slug')
            .eq('state_id', stateData.id)
            .eq('is_active', true)
            .order('name')
            .limit(100)
            .then(r => r.data) as Promise<any[]>,
        supabase
            .from('page_content')
            .select('*')
            .eq('page_type', 'state')
            .in('page_slug', [normalizedStateSlug, `/${normalizedStateSlug}`])
            .eq('is_published', true)
            .maybeSingle()
            .then(r => r.data) as Promise<any>,
        supabase
            .from('treatments')
            .select('id, name, slug, description, icon, image_url, display_order, is_active')
            .eq('is_active', true)
            .order('display_order')
            .then(r => r.data || []) as Promise<any[]>
    ]);

    const stateCityIds = (citiesData || []).map((city: any) => city.id).filter(Boolean);

    // Fetch state ratings and top clinics using city coverage because clinic.state_id is unreliable
    const ratingsData = stateCityIds.length > 0
        ? await (supabase as any)
            .from('clinics')
            .select('rating, review_count')
            .in('city_id', stateCityIds)
            .eq('is_active', true)
            .not('rating', 'is', null)
        : { data: [] };

    // Calculate state-level aggregate ratings
    let stateRatingsData = { avgRating: 0, totalReviews: 0, clinicCount: 0 };
    if (ratingsData.data && ratingsData.data.length > 0) {
        const totalRating = ratingsData.data.reduce((sum: number, c: any) => sum + (c.rating || 0), 0);
        const totalReviews = ratingsData.data.reduce((sum: number, c: any) => sum + (c.review_count || 0), 0);
        stateRatingsData = {
            avgRating: totalRating / ratingsData.data.length,
            totalReviews: totalReviews,
            clinicCount: ratingsData.data.length
        };
    }

    // Fetch top 5 clinics for ItemList schema
    const topClinicsData = stateCityIds.length > 0
        ? await (supabase as any)
            .from('clinics')
            .select('name, slug, rating, review_count')
            .in('city_id', stateCityIds)
            .eq('is_active', true)
            .not('rating', 'is', null)
            .order('rating', { ascending: false })
            .order('review_count', { ascending: false })
            .limit(5)
        : { data: [] };

    // Pre-fetch clinic profiles for SSR
    let clinicProfilesProp: any[] = [];
    const allStateClinics = stateCityIds.length > 0
        ? await (supabase as any)
            .from('clinics')
            .select(`
                id, name, slug, type, rating, review_count, image_url, is_verified, is_claimed, is_pinned,
                address, phone, website, languages, area_id, city_id,
                city:cities(name, slug, state:states(name, abbreviation)),
                treatments(treatment_id, treatment:treatments(id, name, slug))
            `)
            .in('city_id', stateCityIds)
            .eq('is_active', true)
            .order('rating', { ascending: false })
            .order('review_count', { ascending: false })
        : { data: [] };
    
    if (allStateClinics.data) {
        clinicProfilesProp = allStateClinics.data;
    }

    // Always generate meta - either from page_content, seo_pages, or auto-generated
    const metaTitle = pageContent?.meta_title || seoContent?.meta_title || `Best Dentists in ${stateData?.name || normalizedStateSlug}, UAE (2026) — Compare & Book | AppointPanda`;
    const metaDescription = pageContent?.meta_description || seoContent?.meta_description || `Find verified dental clinics in ${stateData?.name || normalizedStateSlug}. Compare ratings, read reviews, check AED prices for implants, braces, whitening. Book your appointment online.`;
    const seoH1 = pageContent?.h1 || seoContent?.h1 || `Best Dentists in ${stateData?.name || normalizedStateSlug}, UAE`;

    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0) {
        ssrFaqs = seoContent.faqs.map((f: any) => ({
            question: f.question || f.q,
            answer: f.answer || f.a
        }));
    } else if (seoContent?.content) {
        const faqPattern = /(?:^|\n)(Q[;:]\s*)(.+?)(\n)(A[;:]\s*)(.+?)(?=\n\n|\n##|$)/gm;
        const faqMatches = seoContent.content.matchAll(faqPattern);
        const parsedFaqs: { question: string; answer: string }[] = [];
        for (const match of faqMatches) {
            if (match[2] && match[5]) {
                parsedFaqs.push({ question: match[2].trim(), answer: match[5].trim() });
            }
        }
        if (parsedFaqs.length > 0) {
            ssrFaqs = parsedFaqs;
        }
    }

    return {
        props: {
            stateSlug: normalizedStateSlug,
            stateData: stateData,
            citiesData: citiesData || [],
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/${normalizedStateSlug}/`,
            },
            faqs: ssrFaqs,
            seoH1: seoH1,
            stateRatings: stateRatingsData,
            topClinics: topClinicsData?.data || [],
            // Pass full SEO content for component to use (no client fetch)
            allSeoData: seoContent,
            // Pass page_content for state pages
            pageContentData: pageContent,
            clinicProfilesProp: clinicProfilesProp,
            treatmentsDataProp: treatmentsData,
        },
        revalidate: 600,
    };
};
