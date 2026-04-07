import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import ServicePageComponent from '@/pages/ServicePage';

const BASE_URL = 'https://www.appointpanda.ae';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const ServicePageWithSEO = ({ serviceSlug, seoData, h1, heroIntro, content, faqs }: {
    serviceSlug: string;
    seoData: { title: string; description: string; canonical: string };
    h1: string | null;
    heroIntro: string | null;
    content: string | null;
    faqs: { question: string; answer: string }[];
}) => {
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
                <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
                <meta property="og:site_name" content="AppointPanda" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta name="twitter:title" content={seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`} />
                <meta name="twitter:description" content={seoData.description} />
                <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        itemListElement: [
                            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
                            { "@type": "ListItem", position: 2, name: "Services", item: `${BASE_URL}/services/` },
                            { "@type": "ListItem", position: 3, name: h1 || serviceSlug, item: `${BASE_URL}${seoData.canonical}` },
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
            <ServicePageComponent 
                serviceSlugProp={serviceSlug}
                seoDataProp={seoData}
                h1Prop={h1}
                heroIntroProp={heroIntro}
                contentProp={content}
                faqsProp={faqs}
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

    const seoSlug = `services/${serviceSlug}`;
    const seoSlugWithSlash = `/${seoSlug}`;

    const [treatment, pageContent, seoContent, allClinics] = await Promise.all([
        supabase
            .from('treatments')
            .select('*')
            .eq('slug', serviceSlug)
            .maybeSingle()
            .then(r => r.data),
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
            .eq('is_active', true)
    ]);

    if (!treatment) {
        return { notFound: true };
    }
    
    // Use page_content if available, otherwise seo_pages
    const content = pageContent || seoContent;
    
    console.log('[SSR] serviceSlug:', serviceSlug);
    console.log('[SSR] pageContent found:', !!pageContent);
    console.log('[SSR] seoContent found:', !!seoContent);
    console.log('[SSR] pageContent slug:', pageContent?.page_slug);
    console.log('[SSR] seoContent slug:', seoContent?.slug);
    console.log('[SSR] pageContent content:', pageContent?.body_content?.substring(0, 50));
    console.log('[SSR] seoContent content:', seoContent?.content?.substring(0, 50));
    
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
        },
        revalidate: 600,
    };
};
