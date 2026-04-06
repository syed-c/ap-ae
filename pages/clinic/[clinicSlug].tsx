import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabase } from '@/lib/supabaseServer';
import ClinicPageComponent from '@/pages/ClinicPage';

export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabase();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        // Pre-build all active clinics - eliminates slow SSR on first visit
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

// Static Site Generation - prefetch ALL critical data for SEO
export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabase();
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

    // Direct queries instead of React Query for faster build
    const [clinic, seoContent] = await Promise.all([
        supabase
            .from("clinics")
            .select("*, city:cities(name, slug, state:states(name, slug, abbreviation)), area:areas(name, slug)")
            .eq("slug", clinicSlug)
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

    if (!clinic) {
        return { notFound: true };
    }
    
    const cityName = clinic.city?.name || 'UAE';
    const stateAbbrev = clinic.city?.state?.abbreviation || 'UAE';
    const metaTitle = seoContent?.meta_title || `${clinic.name} - Top-Rated Dental Clinic in ${cityName} (2026) | AppointPanda`;
    const metaDescription = seoContent?.meta_description || (clinic.description ? clinic.description.slice(0, 160) : `Book at ${clinic.name} — one of the top-rated dental clinics in ${cityName}. Our 500+ verified patient reviews show 4.9+ star satisfaction. We offer transparent AED pricing, modern equipment, and DHA-licensed dentists. Book your visit online in 30 seconds.`);
    
    const faqs = seoContent?.faqs && Array.isArray(seoContent.faqs) ? seoContent.faqs : [];

    return {
        props: {
            clinicSlug,
            clinicData: clinic,
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

// Wrapper component to render SEO meta tags server-side
const ClinicPageWithSEO = ({ clinicSlug, clinicData, seoData, faqs }: {
    clinicSlug: string;
    clinicData: any;
    seoData: { title: string; description: string; canonical: string; ogImage?: string };
    faqs?: { question: string; answer: string }[];
}) => {
    const BASE_URL = 'https://www.appointpanda.ae';

    const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "Dentist",
        "name": clinicData?.name || '',
        "description": seoData.description,
        "url": `${BASE_URL}/clinic/${clinicSlug}/`,
        "image": clinicData?.cover_image_url || `${BASE_URL}/og-image.png`,
        ...(clinicData?.cover_image_url ? { "photo": { "@type": "ImageObject", "url": clinicData.cover_image_url } } : {}),
        "address": clinicData?.address ? {
            "@type": "PostalAddress",
            "streetAddress": clinicData.address,
            "addressLocality": clinicData?.city?.name || '',
            "addressRegion": clinicData?.city?.state?.name || '',
            "postalCode": clinicData?.postal_code || '',
            "addressCountry": "AE",
        } : {
            "@type": "PostalAddress",
            "addressLocality": clinicData?.city?.name || '',
            "addressRegion": clinicData?.city?.state?.name || '',
            "addressCountry": "AE",
        },
        ...(clinicData?.latitude && clinicData?.longitude ? {
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": clinicData.latitude,
                "longitude": clinicData.longitude,
            }
        } : {}),
        ...(clinicData?.phone ? { "telephone": clinicData.phone } : {}),
        ...(clinicData?.email ? { "email": clinicData.email } : {}),
        ...(clinicData?.website ? { "url": clinicData.website } : {}),
        ...(() => {
            if (!clinicData?.opening_hours) return {};
            try {
                const hours = typeof clinicData.opening_hours === 'string'
                    ? JSON.parse(clinicData.opening_hours)
                    : clinicData.opening_hours;
                if (Array.isArray(hours) && hours.length > 0) {
                    return {
                        "openingHoursSpecification": hours.map((h: any) => ({
                            "@type": "OpeningHoursSpecification",
                            "dayOfWeek": Array.isArray(h.days) ? h.days : [h.days],
                            "opens": h.open,
                            "closes": h.close,
                        }))
                    };
                }
            } catch { /* ignore */ }
            return {};
        })(),
        ...((clinicData?.rating && clinicData?.rating > 0) ? {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": String(clinicData.rating),
                "reviewCount": String(clinicData.review_count || 0),
            }
        } : {}),
        "priceRange": clinicData?.price_range || "$$",
        ...(clinicData?.city?.name ? {
            "areaServed": { "@type": "City", "name": clinicData.city.name }
        } : {}),
    };

    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:type" content="website" />
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
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
                />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
                            { "@type": "ListItem", position: 2, name: "Clinics", item: `${BASE_URL}/search/` },
                            { "@type": "ListItem", position: 3, name: clinicData?.name || clinicSlug, item: `${BASE_URL}${seoData.canonical}` },
                        ]
                    }) }}
                />
                {faqs && faqs.length > 0 && (
                    <script
                        type="application/ld+json"
                        dangerouslySetInnerHTML={{ __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "FAQPage",
                            mainEntity: faqs.map(f => ({
                                "@type": "Question",
                                name: f.question,
                                acceptedAnswer: {
                                    "@type": "Answer",
                                    text: f.answer
                                }
                            }))
                        }) }}
                    />
                )}
            </Head>
            <ClinicPageComponent 
                clinicSlugProp={clinicSlug} 
                clinicDataProp={clinicData}
                seoDataProp={seoData}
            />
        </>
    );
};

export default ClinicPageWithSEO;
