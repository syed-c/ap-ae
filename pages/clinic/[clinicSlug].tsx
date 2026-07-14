import { GetStaticProps, GetStaticPaths } from 'next';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import ClinicPageComponent from '@/pages/ClinicPage';

export const getStaticPaths: GetStaticPaths = async () => {
    try {
const supabase = createServerSupabaseAdmin();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        const { data: clinics } = await supabase
            .from('clinics')
            .select('slug')
            .eq('is_active', true);
        
        const paths = (clinics || []).map((clinic) => ({
            params: { clinicSlug: clinic.slug }
        }));
        
        return { paths, fallback: 'blocking' };
    } catch (error) {
        console.error('Error generating clinic paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabaseAdmin();
    const clinicSlug = ctx.params?.clinicSlug as string;

    if (!clinicSlug) {
        return { notFound: true };
    }

    if (!supabase) {
        return {
            props: {
                clinicSlug,
                seoData: {
                    title: 'Dental Clinic',
                    description: 'Find and book dental appointments in UAE',
                    canonical: `/clinic/${clinicSlug}/`,
                }
            },
            revalidate: 600,
        };
    }

    const seoSlug = `clinic/${clinicSlug}`;

    const { data: clinic, error: clinicError } = await supabase
        .from("clinics")
        .select("*, city:cities(name, slug, state:states(name, slug, abbreviation)), area:areas(name, slug)")
        .eq("slug", clinicSlug)
        .maybeSingle();

    if (clinicError || !clinic) {
        console.error('[getStaticProps] Error fetching clinic:', clinicError);
        return { notFound: true };
    }

    const { data: clinicTreatments, error: treatmentsError } = await supabase
        .from("clinic_treatments")
        .select("*, treatment:treatments(*)")
        .eq("clinic_id", clinic.id);

    const [dentistsResult, reviewsResult, googleReviewsResult, galleryResult, hoursResult] = await Promise.all([
        supabase
            .from('dentists')
            .select('*')
            .eq('clinic_id', clinic.id)
            .eq('is_active', true)
            .order('is_primary', { ascending: false })
            .order('name'),
        supabase
            .from('review_funnel_events')
            .select('*')
            .eq('clinic_id', clinic.id)
            .eq('event_type', 'rating_submitted')
            .order('created_at', { ascending: false })
            .limit(20),
        clinic.gmb_connected
            ? supabase
                .from('google_reviews')
                .select('*')
                .eq('clinic_id', clinic.id)
                .order('review_time', { ascending: false })
                .limit(20)
            : Promise.resolve({ data: [] as any[] }),
        supabase
            .from('clinic_images')
            .select('*')
            .eq('clinic_id', clinic.id)
            .order('display_order'),
        supabase
            .from('clinic_hours')
            .select('*')
            .eq('clinic_id', clinic.id)
            .order('day_of_week'),
    ]);

    if (treatmentsError) {
        console.error('[getStaticProps] Error fetching treatments:', treatmentsError);
    }

    const seoContent = await supabase
        .from("seo_pages")
        .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
        .or(`slug.eq.${seoSlug},slug.eq./${seoSlug}`)
        .order("is_optimized", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(r => r.data);
    
    const cityName = clinic.city?.name || 'UAE';
    const metaTitle = seoContent?.meta_title || `${clinic.name} - Top-Rated Dental Clinic in ${cityName} (2026) | AppointPanda`;
    const metaDescription = seoContent?.meta_description || (clinic.description ? clinic.description.slice(0, 160) : `Book at ${clinic.name} — one of the top-rated dental clinics in ${cityName}. Our 500+ verified patient reviews show 4.9+ star satisfaction. We offer transparent AED pricing, modern equipment, and DHA-licensed dentists. Book your visit online in 30 seconds.`);
    
    const faqs = seoContent?.faqs && Array.isArray(seoContent.faqs) ? seoContent.faqs : [];

    return {
        props: {
            clinicSlug,
            clinicData: clinic,
            clinicTreatmentsData: clinicTreatments || [],
            dentistsData: dentistsResult.data || [],
            reviewsData: (reviewsResult.data || []).map((review: any) => ({
                id: review.id,
                patient_name: review.visitor_id || 'Anonymous',
                rating: review.rating || 5,
                content: review.comment || '',
                created_at: review.created_at,
                source: 'internal',
            })),
            googleReviewsData: googleReviewsResult.data || [],
            galleryImagesData: galleryResult.data || [],
            hoursData: hoursResult.data || [],
            seoContentData: seoContent,
            faqsProp: faqs,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/clinic/${clinicSlug}/`,
                ogImage: clinic.cover_image_url || null,
            },
            faqs,
        },
        revalidate: 600,
    };
};

const ClinicPageWithSEO = ({ clinicSlug, clinicData, clinicTreatmentsData, dentistsData, reviewsData, googleReviewsData, galleryImagesData, hoursData, seoContentData, faqsProp, seoData }: {
    clinicSlug: string;
    clinicData: any;
    clinicTreatmentsData: any[];
    dentistsData?: any[];
    reviewsData?: any[];
    googleReviewsData?: any[];
    galleryImagesData?: any[];
    hoursData?: any[];
    seoContentData?: any;
    faqsProp?: { question: string; answer: string }[];
    seoData: { title: string; description: string; canonical: string; ogImage?: string };
}) => {
    return (
        <>
            <ClinicPageComponent 
                clinicSlugProp={clinicSlug} 
                clinicDataProp={clinicData}
                clinicTreatmentsDataProp={clinicTreatmentsData}
                dentistsDataProp={dentistsData}
                reviewsDataProp={reviewsData}
                googleReviewsDataProp={googleReviewsData}
                galleryImagesDataProp={galleryImagesData}
                hoursDataProp={hoursData}
                seoContentDataProp={seoContentData}
                faqsProp={faqsProp}
                seoDataProp={seoData}
            />
        </>
    );
};

export default ClinicPageWithSEO;
