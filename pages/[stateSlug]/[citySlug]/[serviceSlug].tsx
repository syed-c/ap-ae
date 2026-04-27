import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import ServiceLocationPageComponent from '@/pages/ServiceLocationPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

const BASE_URL = 'https://www.appointpanda.ae';

const ServiceLocationPageWithSEO = ({ stateSlug, citySlug, serviceSlug, stateData, cityData, treatmentData, seoData, faqs, seoH1, heroIntro, content, priceMin, priceMax, priceNote, quickAnswer, lastReviewedBy, expertCredential, medicalAccuracyVerified, processSteps, treatmentOptions, benefits, candidates, alternatives, relatedQuestions, processTimeMonths, processTimeNote, allSeoData }: {
    stateSlug: string;
    citySlug: string;
    serviceSlug: string;
    stateData: any;
    cityData: any;
    treatmentData: any;
    seoData: { title: string | null; description: string | null; canonical: string };
    faqs: { question: string; answer: string }[];
    seoH1: string | null;
    heroIntro?: string | null;
    content?: string | null;
    priceMin?: number | null;
    priceMax?: number | null;
    priceNote?: string | null;
    quickAnswer?: string | null;
    lastReviewedBy?: string | null;
    expertCredential?: string | null;
    medicalAccuracyVerified?: boolean;
    processSteps?: any[] | null;
    treatmentOptions?: any[] | null;
    benefits?: any[] | null;
    candidates?: any[] | null;
    alternatives?: any[] | null;
    relatedQuestions?: any[] | null;
    processTimeMonths?: string | null;
    processTimeNote?: string | null;
    allSeoData?: any;
}) => {
    const treatmentName = treatmentData?.name || serviceSlug;
    const cityName = cityData?.name || citySlug;
    const stateName = stateData?.name || stateSlug;
    const fallbackTitle = `${treatmentName} in ${cityName} (2026) — Find Top-Rated Dentists Near You | AppointPanda`;
    const fallbackDescription = `Need ${treatmentName.toLowerCase()} in ${cityName}? Compare 50+ verified specialists near you. Read patient reviews, check ratings (4.9+ stars), see transparent AED pricing. Book your appointment in minutes. All dentists are DHA/DOH-licensed. Free consultation available.`;

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
                            { "@type": "ListItem", position: 2, name: stateName, item: `${BASE_URL}/${stateSlug}/` },
                            { "@type": "ListItem", position: 3, name: cityName, item: `${BASE_URL}/${stateSlug}/${citySlug}/` },
                            { "@type": "ListItem", position: 4, name: treatmentName, item: `${BASE_URL}${seoData.canonical}` },
                        ]
                    }) }}
                />
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
                heroIntroProp={heroIntro}
                contentProp={content}
                priceMinProp={priceMin}
                priceMaxProp={priceMax}
                priceNoteProp={priceNote}
                quickAnswerProp={quickAnswer}
                lastReviewedByProp={lastReviewedBy}
                expertCredentialProp={expertCredential}
                medicalAccuracyVerifiedProp={medicalAccuracyVerified}
                processStepsProp={processSteps}
                treatmentOptionsProp={treatmentOptions}
                benefitsProp={benefits}
                candidatesProp={candidates}
                alternativesProp={alternatives}
                relatedQuestionsProp={relatedQuestions}
                processTimeMonthsProp={processTimeMonths}
                processTimeNoteProp={processTimeNote}
                allSeoDataProp={allSeoData}
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

    if (normalizedStateSlug === 'robots.txt') {
        return { notFound: true };
    }

    if (!normalizedStateSlug || !citySlug || !serviceSlug) {
        return { notFound: true };
    }

    const seoSlug = `/${normalizedStateSlug}/${citySlug}/${serviceSlug}`;

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
            .select('*')
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
    
    // Extract ALL SEO content fields for server-side rendering
    const seoDataFromDb = seoContent as any;
    const metaTitle = seoDataFromDb?.meta_title || `${treatmentName} in ${cityName}, ${stateName} (2026) — Book Now | AppointPanda`;
    const metaDescription = seoDataFromDb?.meta_description || `Get ${treatmentName.toLowerCase()} treatment in ${cityName}, ${stateName}. Compare top clinics, check AED prices, read verified reviews. Book your appointment today.`;
    const seoH1 = seoDataFromDb?.h1 || seoDataFromDb?.title || `Best ${treatmentName} in ${cityName}`;
    const heroIntro = seoDataFromDb?.page_intro || null;
    const content = seoDataFromDb?.content || null;
    
    // Extract all additional fields from DB
    const priceMin = seoDataFromDb?.price_min || null;
    const priceMax = seoDataFromDb?.price_max || null;
    const priceNote = seoDataFromDb?.price_note || null;
    const quickAnswer = seoDataFromDb?.quick_answer || null;
    const lastReviewedBy = seoDataFromDb?.last_reviewed_by || null;
    const expertCredential = seoDataFromDb?.expert_credential || null;
    const medicalAccuracyVerified = seoDataFromDb?.medical_accuracy_verified || false;
    const processSteps = seoDataFromDb?.process_steps || null;
    const treatmentOptions = seoDataFromDb?.treatment_options || null;
    const benefits = seoDataFromDb?.benefits || null;
    const candidates = seoDataFromDb?.candidates || null;
    const alternatives = seoDataFromDb?.alternatives || null;
    const relatedQuestions = seoDataFromDb?.related_questions || null;
    const processTimeMonths = seoDataFromDb?.process_time_months || null;
    const processTimeNote = seoDataFromDb?.process_time_note || null;

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
            heroIntro,
            content,
            // Price & clinical data
            priceMin,
            priceMax,
            priceNote,
            quickAnswer,
            lastReviewedBy,
            expertCredential,
            medicalAccuracyVerified,
            // Process & options
            processSteps,
            treatmentOptions,
            benefits,
            candidates,
            alternatives,
            relatedQuestions,
            processTimeMonths,
            processTimeNote,
            allSeoData: seoContent,
        },
        revalidate: 600,
    };
};
