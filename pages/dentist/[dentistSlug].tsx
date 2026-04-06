import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabase } from '@/lib/supabaseServer';
import DentistPageComponent from '@/pages/DentistPage';

// Wrapper component to render SEO meta tags server-side
const BASE_URL = 'https://www.appointpanda.ae';

const DentistPageWithSEO = ({ dentistSlug, dentistData, seoData, faqs }: {
    dentistSlug: string;
    dentistData: any;
    seoData: { title: string; description: string; canonical: string; ogImage?: string };
    faqs?: { question: string; answer: string }[];
}) => {
    const physicianSchema = {
        "@context": "https://schema.org",
        "@type": "Physician",
        "name": dentistData?.name || '',
        "description": seoData.description,
        "url": `${BASE_URL}/dentist/${dentistSlug}/`,
        "image": dentistData?.image_url || `${BASE_URL}/og-image.png`,
        "jobTitle": dentistData?.title || 'Dentist',
        "medicalSpecialty": "Dentistry",
        ...(dentistData?.qualifications ? {
            "hasCredential": dentistData.qualifications.map((q: any) => ({
                "@type": "EducationalOccupationalCredential",
                "credentialCategory": q.degree || q.title,
                "name": q.degree || q.title,
            }))
        } : undefined),
        "worksFor": dentistData?.clinic?.name ? {
            "@type": "Dentist",
            "name": dentistData.clinic.name,
            "url": `${BASE_URL}/clinic/${dentistData.clinic.slug}/`,
            "address": dentistData.clinic.city ? {
                "@type": "PostalAddress",
                "addressLocality": dentistData.clinic.city.name,
                "addressRegion": dentistData.clinic.city.state?.name || '',
                "addressCountry": "AE",
            } : undefined,
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
        ...(dentistData?.specializations ? {
            "knowsAbout": dentistData.specializations.map((s: string) => s)
        } : undefined),
    };

    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={`${BASE_URL}${seoData.canonical}`} />
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
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
                            { "@type": "ListItem", position: 2, name: "Dentists", item: `${BASE_URL}/search/` },
                            { "@type": "ListItem", position: 3, name: dentistData?.name || dentistSlug, item: `${BASE_URL}${seoData.canonical}` },
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
        
        // Pre-build all active dentists - eliminates slow SSR on first visit
        const { data: dentists } = await supabase
            .from('dentists')
            .select('slug')
            .eq('is_active', true);
        
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
    const metaTitle = seoContent?.meta_title || `${dentist.name} - Dentist in ${cityName} (2026) — Book Appointment | AppointPanda`;
    const metaDescription = seoContent?.meta_description || `Book an appointment with ${dentist.name}, ${dentist.title || 'Dentist'} in ${cityName}. With 100+ verified patient reviews and 4.9+ stars, specializing in modern dental techniques. DHA-licensed. Book your appointment instantly.`;
    
    const faqs = seoContent?.faqs && Array.isArray(seoContent.faqs) ? seoContent.faqs : [];

    return { 
        props: {
            dentistSlug,
            dentistData: dentist,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/dentist/${dentistSlug}/`,
                ogImage: dentist.image_url || null,
            },
            faqs,
        },
        revalidate: 600
    };
};
