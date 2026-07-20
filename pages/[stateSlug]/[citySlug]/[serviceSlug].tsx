import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import ServiceLocationPageComponent from '@/pages/ServiceLocationPage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';
import { buildClinicLocationOrFilter } from '@/lib/location/buildClinicLocationFilter';

const BASE_URL = 'https://www.appointpanda.ae';

const ServiceLocationPageWithSEO = ({ stateSlug, citySlug, serviceSlug, stateData, cityData, treatmentData, seoData, faqs, seoH1, heroIntro, content, priceMin, priceMax, priceNote, quickAnswer, lastReviewedBy, expertCredential, medicalAccuracyVerified, processSteps, treatmentOptions, benefits, candidates, alternatives, relatedQuestions, processTimeMonths, processTimeNote, allSeoData, clinicProfilesProp, allEmirateCitiesProp }: {
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
    clinicProfilesProp?: any[];
    allEmirateCitiesProp?: any[];
}) => {
    const treatmentName = treatmentData?.name || serviceSlug;
    const cityName = cityData?.name || citySlug;
    const stateName = stateData?.name || stateSlug;

    const metaTitle = seoData?.title || `${treatmentName} in ${cityData?.name || citySlug}`;
    const metaDescription = seoData?.description || `Find the best ${treatmentName.toLowerCase()} specialists in ${cityData?.name || citySlug}.`;

    return (
        <>
            <Head>
                <title>{metaTitle}</title>
                <meta name="description" content={metaDescription} />
                <link rel="canonical" href={`${BASE_URL}${seoData?.canonical || `/${stateSlug}/${citySlug}/${serviceSlug}/`}`} />
                <meta name="robots" content="index, follow" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content={`${BASE_URL}${seoData?.canonical || `/${stateSlug}/${citySlug}/${serviceSlug}/`}`} />
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta property="og:locale" content="en_AE" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData?.canonical || `/${stateSlug}/${citySlug}/${serviceSlug}/`}`} />
                <meta name="twitter:title" content={metaTitle} />
                <meta name="twitter:description" content={metaDescription} />
                <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
                <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}${seoData?.canonical || `/${stateSlug}/${citySlug}/${serviceSlug}/`}`} />
                <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}${seoData?.canonical || `/${stateSlug}/${citySlug}/${serviceSlug}/`}`} />
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
                clinicProfilesProp={clinicProfilesProp}
                allEmirateCitiesProp={allEmirateCitiesProp}
            />
        </>
    );
};

export default ServiceLocationPageWithSEO;

// Generate static paths - ONLY for city/treatment combinations with actual clinics
// This prevents 404s from soft-404 pages with 0 results
export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabaseAdmin();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        // Get all active cities with their state relationship
        const { data: cities } = await supabase
            .from('cities')
            .select('id, slug, state:states(id, slug)')
            .eq('is_active', true);
        
        // Get all active treatments
        const { data: treatments } = await supabase
            .from('treatments')
            .select('id, slug')
            .eq('is_active', true);
        
        if (!cities || !treatments) {
            return { paths: [], fallback: 'blocking' };
        }
        
        // Get all city/treatment combinations that have at least one clinic
        const { data: clinicCombinations } = await supabase
            .from('clinic_treatments')
            .select('clinic:clinics!inner(city_id, is_active), treatment_id')
            .eq('clinic.is_active', true);
        
        // Build a set of valid city_id + treatment_id pairs
        const validCombos = new Set<string>();
        for (const combo of clinicCombinations || []) {
            if (combo.clinic?.city_id && combo.treatment_id) {
                validCombos.add(`${combo.clinic.city_id}-${combo.treatment_id}`);
            }
        }
        
        // Only create paths for combinations that have clinics
        const paths: { params: { stateSlug: string; citySlug: string; serviceSlug: string } }[] = [];
        
        for (const city of cities) {
            if (!city.state?.slug || !city.slug) continue;
            
            const stateSlug = city.state.slug;
            const citySlug = city.slug;
            const cityId = city.id;
            
            for (const treatment of treatments) {
                // Only add path if this combination has at least one clinic
                if (validCombos.has(`${cityId}-${treatment.id}`)) {
                    paths.push({
                        params: {
                            stateSlug,
                            citySlug,
                            serviceSlug: treatment.slug
                        }
                    });
                }
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

    if (!supabase) {
        return {
            props: {
                stateSlug: normalizedStateSlug,
                citySlug,
                serviceSlug: serviceSlug,
                stateData: null,
                cityData: null,
                treatmentData: null,
                seoData: {
                    title: `${serviceSlug} in ${citySlug}`,
                    description: 'Find and book dental appointments in UAE',
                    canonical: `/${normalizedStateSlug}/${citySlug}/${serviceSlug}/`,
                },
                faqs: [],
                seoH1: null,
                treatmentRatings: null,
                allSeoData: null,
                pageContentDataProp: null,
                clinicProfilesProp: [],
                allEmirateCitiesProp: [],
            },
            revalidate: 60,
        };
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

    // Return 404 if city or treatment doesn't exist
    if (!cityData || !treatmentData) {
        return { notFound: true };
    }

    // Pre-fetch clinic profiles for SSR. Keep these pages live even when
    // treatment mapping data is incomplete so the location-service graph remains navigable.
    const clinicLocationFilter = buildClinicLocationOrFilter({
        cityId: cityData.id,
        citySlug: cityData.slug,
        cityName: cityData.name,
        stateName: stateData?.name,
    });

    const { data: clinicProfiles } = await (supabase
        .from('clinics') as any)
        .select(`
            id, name, slug, type, rating, review_count, image_url, is_verified, is_claimed, is_pinned,
            address, phone, website, languages, area_id, city_id,
            city:cities(name, slug, state:states(name, abbreviation)),
            treatments(treatment_id, treatment:treatments(id, name, slug))
        `)
        .or(clinicLocationFilter)
        .eq('is_active', true)
        .eq('is_likely_dental', true)
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false });

    const { data: allEmirateCities } = await supabase
        .from('cities')
        .select('id, name, slug, image_url')
        .eq('state_id', stateData.id)
        .eq('is_active', true)
        .order('population', { ascending: false });

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
            clinicProfilesProp: clinicProfiles || [],
            allEmirateCitiesProp: allEmirateCities || [],
        },
        revalidate: 600,
    };
};
