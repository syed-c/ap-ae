import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import StatePageComponent from '@/pages/StatePage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

const BASE_URL = 'https://www.appointpanda.ae';

const StatePageWithSEO = ({ stateSlug, stateData, citiesData, seoData, faqs, seoH1, stateRatings, topClinics }: {
    stateSlug: string;
    stateData: any;
    citiesData: any[];
    seoData: { title: string | null; description: string | null; canonical: string };
    faqs: { question: string; answer: string }[];
    seoH1: string | null;
    stateRatings?: { avgRating: number; totalReviews: number; clinicCount: number };
    topClinics?: { name: string; slug: string; rating: number; review_count: number }[];
}) => {
    const stateName = stateData?.name || stateSlug;
    const clinicCount = stateRatings?.clinicCount || 0;
    const reviewCount = stateRatings?.totalReviews || 0;
    const fallbackTitle = `Best Dentists in ${stateName}, UAE (2026) — Book Online Today | AppointPanda`;
    const fallbackDescription = `Compare ${clinicCount.toLocaleString()}+ verified DHA-licensed dentists across ${stateName}, UAE. Read ${reviewCount.toLocaleString()}+ real patient reviews, see transparent AED pricing for implants, braces, veneers. Book appointments instantly with top-rated dental professionals. Your perfect smile starts here.`;

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
                            { "@type": "ListItem", position: 2, name: stateData?.name || stateSlug, item: `${BASE_URL}${seoData.canonical}` },
                        ]
                    }) }}
                />
                {/* LocalBusiness Schema for state with aggregate rating - using ItemList for directory */}
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
                {/* FAQPage Schema */}
                {faqs && faqs.length > 0 && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: faqs.map(f => ({
                                "@type": "Question",
                                name: f.question,
                                acceptedAnswer: { "@type": "Answer", text: f.answer }
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
    
    const [seoContent, citiesData] = await Promise.all([
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
            .then(r => r.data) as Promise<any[]>
    ]);

    // Fetch state ratings and top clinics
    const ratingsData = await (supabase as any)
        .from('clinics')
        .select('rating, review_count')
        .eq('state_id', stateData.id)
        .eq('is_active', true)
        .not('rating', 'is', null);

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
    const topClinicsData = await (supabase as any)
        .from('clinics')
        .select('name, slug, rating, review_count')
        .eq('state_id', stateData.id)
        .eq('is_active', true)
        .not('rating', 'is', null)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .limit(5);

    const metaTitle = seoContent?.meta_title || null;
    const metaDescription = seoContent?.meta_description || null;
    const seoH1 = seoContent?.h1 || null;

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
        },
        revalidate: 600,
    };
};
