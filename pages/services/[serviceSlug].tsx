import { GetStaticProps, GetStaticPaths } from 'next';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import ServicePageComponent from '@/pages/ServicePage';

const BASE_URL = 'https://www.appointpanda.ae';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const ServicePageWithSEO = ({ serviceSlug, seoData, h1, heroIntro, content, faqs, treatmentData, relatedTreatmentsData, profileData, statesData, priceRangesData }: {
    serviceSlug: string;
    seoData: { title: string; description: string; canonical: string };
    h1: string | null;
    heroIntro: string | null;
    content: string | null;
    faqs: { question: string; answer: string }[];
    treatmentData?: any;
    relatedTreatmentsData?: any[];
    profileData?: any[];
    statesData?: any[];
    priceRangesData?: any[];
}) => {
    return (
        <>
            <ServicePageComponent 
                serviceSlugProp={serviceSlug}
                seoDataProp={seoData}
                h1Prop={h1}
                heroIntroProp={heroIntro}
                contentProp={content}
                faqsProp={faqs}
                treatmentDataProp={treatmentData}
                relatedTreatmentsDataProp={relatedTreatmentsData}
                profileDataProp={profileData}
                statesDataProp={statesData}
                priceRangesDataProp={priceRangesData}
            />
        </>
    );
};

export default ServicePageWithSEO;

// Generate static paths - use fallback blocking to avoid build timeouts
export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabaseAdmin();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        const { data: treatments } = await supabase
            .from('treatments')
            .select('slug');
        
        const paths = (treatments || []).map((treatment) => ({
            params: { serviceSlug: treatment.slug }
        }));
        
        return {
            paths,
            fallback: 'blocking'
        };
    } catch (error) {
        console.error('Error generating service paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

// Static Site Generation with SSR FAQ data for Googlebot
export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabaseAdmin();
    const serviceSlug = ctx.params?.serviceSlug as string;

    if (!serviceSlug) {
        return { notFound: true };
    }

    if (!supabase) {
        return {
            props: {
                serviceSlug,
                seoData: {
                    title: 'Dental Service',
                    description: 'Find and book dental appointments in UAE',
                    canonical: `/services/${serviceSlug}/`,
                },
                faqs: [],
                seoH1: null,
                h1Prop: null,
                heroIntroProp: null,
                contentProp: null,
                allSeoData: null,
                treatmentData: null,
                relatedTreatmentsData: [],
                profileData: [],
                statesData: [],
                priceRangesData: [],
            },
            revalidate: 60,
        };
    }

    const seoSlug = `services/${serviceSlug}`;
    const seoSlugWithSlash = `/${seoSlug}`;

    const treatment = await supabase
        .from('treatments')
        .select('*')
        .eq('slug', serviceSlug)
        .maybeSingle()
        .then(r => r.data);

    if (!treatment) {
        return { notFound: true };
    }

    const [pageContent, seoContent, allClinics, relatedTreatmentsResult, statesResult, priceRangesResult, clinicsResult] = await Promise.all([
        supabase
            .from('page_content')
            .select('id, page_slug, meta_title, meta_description, h1, hero_intro, body_content, section_1_title, section_1_content, section_2_title, section_2_content, section_3_title, section_3_content, faqs')
            .in('page_slug', [seoSlug, seoSlugWithSlash])
            .eq('is_published', true)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from("seo_pages")
            .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs, page_intro")
            .in("slug", [seoSlug, seoSlugWithSlash])
            .order("is_optimized", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from('clinics')
            .select('id', { count: 'exact', head: true })
            .eq('is_active', true),
        supabase
            .from('treatments')
            .select('*')
            .eq('is_active', true)
            .neq('slug', serviceSlug)
            .order('display_order')
            .limit(6),
        supabase
            .from('states')
            .select('*')
            .eq('is_active', true)
            .order('display_order'),
        supabase
            .from('service_price_ranges')
            .select(`
                *,
                state:states(id, name, slug, abbreviation),
                treatment:treatments(id, name, slug)
            `)
            .eq('is_active', true)
            .eq('treatment_id', treatment.id)
            .order('price_min'),
        (async () => {
            const { data } = await supabase
                .from('clinics')
                .select(`
                    id, name, slug, rating, review_count, cover_image_url, verification_status, claim_status,
                    city:cities(name, slug, state:states(name, abbreviation))
                `)
                .eq('is_active', true)
                .order('rating', { ascending: false })
                .limit(50);

            const { data: clinicTreatments } = await supabase
                .from('clinic_treatments')
                .select('clinic_id, treatment_id')
                .eq('treatment_id', treatment.id);

            const allowedClinicIds = new Set((clinicTreatments || []).map((item) => item.clinic_id));
            const profiles = (data || [])
                .filter((clinic: any) => allowedClinicIds.has(clinic.id))
                .map((clinic: any) => ({
                    id: clinic.id,
                    name: clinic.name,
                    slug: clinic.slug,
                    type: 'clinic',
                    specialty: treatment.name,
                    location: clinic.city ? `${clinic.city.name}, ${clinic.city.state?.abbreviation || ''}` : 'UAE',
                    rating: Number(clinic.rating) || 0,
                    reviewCount: clinic.review_count || 0,
                    image: clinic.cover_image_url || undefined,
                    isVerified: clinic.claim_status === 'claimed' && clinic.verification_status === 'verified',
                    isClaimed: clinic.claim_status === 'claimed',
                    clinicName: clinic.name,
                    clinicId: clinic.id,
                }));

            return { data: profiles };
        })()
    ]);
    
    // Use page_content if available, otherwise seo_pages
    const content = pageContent || seoContent;
    
    const totalClinics = allClinics?.count || 0;
    const metaTitle = content?.meta_title || (content as any)?.title || `${treatment.name} in UAE (2026) — Find Top Dentists & Specialists | AppointPanda`;
    const metaDescription = content?.meta_description || `Get ${treatment.name.toLowerCase()} treatment in UAE. Compare ${totalClinics.toLocaleString()}+ verified specialists across Dubai, Abu Dhabi, Sharjah. Read patient reviews, see transparent AED pricing, check dentist credentials (BDS, MDS, DHA-licensed). Book your appointment instantly. Most clinics offer free consultation.`;
    const h1 = content?.h1 || (content as any)?.title || null;
    
    // Build content string from page_content sections
    let heroIntro: string | null = null;
    let contentText: string | null = null;
    
    // Build content from page_content first, then supplement with seo_pages
    if (pageContent) {
        heroIntro = pageContent.hero_intro || null;
        
        const sections: string[] = [];
        if (pageContent.body_content) sections.push(pageContent.body_content);
        if (pageContent.section_1_title && pageContent.section_1_content) sections.push(`## ${pageContent.section_1_title}\n\n${pageContent.section_1_content}`);
        if (pageContent.section_2_title && pageContent.section_2_content) sections.push(`## ${pageContent.section_2_title}\n\n${pageContent.section_2_content}`);
        if (pageContent.section_3_title && pageContent.section_3_content) sections.push(`## ${pageContent.section_3_title}\n\n${pageContent.section_3_content}`);
        
        if (sections.length > 0) {
            contentText = sections.filter(Boolean).join('\n\n');
        }
    }
    
    // If no content from page_content, try seo_pages
    if (!contentText && seoContent) {
        heroIntro = heroIntro || seoContent.page_intro || null;
        contentText = seoContent.content || null;
    }

    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (content?.faqs && Array.isArray(content.faqs) && content.faqs.length > 0) {
        ssrFaqs = content.faqs.map((f: any) => ({
            question: f.question || f.q,
            answer: f.answer || f.a
        }));
    }

    return {
        props: {
            serviceSlug,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/services/${serviceSlug}/`,
            },
            h1,
            heroIntro,
            content: contentText,
            faqs: ssrFaqs,
            treatmentData: treatment,
            relatedTreatmentsData: relatedTreatmentsResult.data || [],
            profileData: clinicsResult.data || [],
            statesData: statesResult.data || [],
            priceRangesData: priceRangesResult.data || [],
        },
        revalidate: 600,
    };
};
