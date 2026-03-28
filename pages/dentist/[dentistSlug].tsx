import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabase } from '@/lib/supabaseServer';
import DentistPageComponent from '@/pages/DentistPage';

// Wrapper component to render SEO meta tags server-side
const BASE_URL = 'https://www.appointpanda.ae';

const DentistPageWithSEO = ({ dentistSlug, dentistData, seoData }: {
    dentistSlug: string;
    dentistData: any;
    seoData: { title: string; description: string; canonical: string; ogImage?: string };
}) => {
    const physicianSchema = {
        "@context": "https://schema.org",
        "@type": "Dentist",
        "name": dentistData?.name || '',
        "description": seoData.description,
        "url": `${BASE_URL}/dentist/${dentistSlug}/`,
        "image": dentistData?.image_url || `${BASE_URL}/og-image.png`,
        "jobTitle": dentistData?.title || 'Dentist',
        "worksFor": dentistData?.clinic?.name ? {
            "@type": "Dentist",
            "name": dentistData.clinic.name,
            "url": `${BASE_URL}/clinic/${dentistData.clinic.slug}/`,
        } : undefined,
        "address": dentistData?.clinic?.city ? {
            "@type": "PostalAddress",
            "addressLocality": dentistData.clinic.city.name,
            "addressRegion": dentistData.clinic.city.state?.name || '',
            "addressCountry": "AE",
        } : undefined,
        ...((dentistData?.rating && dentistData?.rating > 0) ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": String(dentistData.rating),
                "reviewCount": String(dentistData.review_count || 0),
            }
        } : {}),
        "memberOf": [{
            "@type": "Organization",
            "name": "AppointPanda",
            "url": BASE_URL,
        }],
    };

    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={seoData.canonical} />
                <meta property="og:type" content="profile" />
                <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
                <meta property="og:description" content={seoData.description} />
                <meta property="og:image" content={seoData.ogImage || `${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta name="twitter:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
                <meta name="twitter:description" content={seoData.description} />
                <meta name="twitter:image" content={seoData.ogImage || `${BASE_URL}/og-image.png`} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(physicianSchema) }}
                />
            </Head>
            <DentistPageComponent 
                dentistSlugProp={dentistSlug} 
                dentistDataProp={dentistData}
                seoDataProp={seoData}
            />
        </>
    );
};

export default DentistPageWithSEO;

export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabase();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        // Pre-build top 200 dentists by rating - rest will be ISR
        const { data: dentists } = await supabase
            .from('dentists')
            .select('slug')
            .eq('is_active', true)
            .order('rating', { ascending: false })
            .limit(200);
        
        const paths = (dentists || []).map((dentist) => ({
            params: { dentistSlug: dentist.slug }
        }));
        
        return { paths, fallback: 'blocking' };
    } catch (error) {
        console.error('Error generating dentist paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

// Convert to Static Site Generation with SEO data
export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabase();
    const dentistSlug = ctx.params?.dentistSlug as string;

    if (!dentistSlug) {
        return { notFound: true };
    }

    const seoSlug = `dentist/${dentistSlug}`;

    // Direct queries instead of React Query for faster build
    const [dentist, seoContent] = await Promise.all([
        supabase
            .from("dentists")
            .select("*, clinic:clinics(name, slug, city:cities(name, slug, state:states(name, slug, abbreviation)))")
            .eq("slug", dentistSlug)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from("seo_pages")
            .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
            .or(`slug.eq.${seoSlug},slug.eq./${seoSlug}`)
            .order("is_optimized", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data)
    ]);

    if (!dentist) {
        return { notFound: true };
    }
    
    const clinicName = dentist.clinic?.name || 'Dental Clinic';
    const cityName = dentist.clinic?.city?.name || 'UAE';
    const metaTitle = seoContent?.meta_title || `${dentist.name} - Dentist in ${cityName}`;
    const metaDescription = seoContent?.meta_description || `Book an appointment with ${dentist.name}. Professional dentist at ${clinicName} in ${cityName}.`;

    return { 
        props: {
            dentistSlug,
            dentistData: dentist,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/dentist/${dentistSlug}/`,
                ogImage: dentist.image_url || null,
            }
        },
        revalidate: 3600
    };
};
