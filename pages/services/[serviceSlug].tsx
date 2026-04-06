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
                <link rel="canonical" href={seoData.canonical} />
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
    // DB stores slugs WITH leading slash: /services/teeth-whitening
    const seoSlugWithSlash = `/${seoSlug}`;

    // Debug: List all unique slugs that start with "services/" to understand the format
    const { data: allSeoSlugs } = await supabase
        .from('seo_pages')
        .select('slug')
        .like('slug', 'services/%')
        .limit(10);

    console.log('[SSR] All service slugs in DB:', allSeoSlugs?.map(s => s.slug));
    
    // Debug: Try different slug formats
    const { data: anySeoSlug } = await supabase
        .from('seo_pages')
        .select('slug')
        .ilike('slug', '%teeth%')
        .limit(5);
        
    console.log('[SSR] Any teeth slug:', anySeoSlug?.map(s => s.slug));

    // Debug: Check page_content table
    const { data: pageContentSlugs } = await supabase
        .from('page_content')
        .select('page_slug')
        .ilike('page_slug', '%teeth%')
        .limit(5);
        
    console.log('[SSR] page_content teeth slugs:', pageContentSlugs?.map(s => s.page_slug));

    // Direct queries instead of React Query for faster build
    const [treatment, pageContent, seoContent] = await Promise.all([
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
            .then(r => r.data)
    ]);

    console.log('[SSR] serviceSlug:', serviceSlug);
    console.log('[SSR] seoSlug:', seoSlug);
    console.log('[SSR] treatment:', treatment?.name);
    console.log('[SSR] pageContent found:', !!pageContent);
    console.log('[SSR] seoContent found:', !!seoContent);
    console.log('[SSR] seoContent content:', seoContent?.content?.substring(0, 50));

    if (!treatment) {
        return { notFound: true };
    }
    
    // Use page_content if available, otherwise seo_pages
    const content = pageContent || seoContent;
    const metaTitle = content?.meta_title || (content as any)?.title || `${treatment.name} in UAE (2026) — Find Top Dentists & Specialists | AppointPanda`;
    const metaDescription = content?.meta_description || `Get ${treatment.name.toLowerCase()} treatment in UAE. Compare 200+ verified specialists across Dubai, Abu Dhabi, Sharjah. Read patient reviews, see transparent AED pricing, check dentist credentials (BDS, MDS, DHA-licensed). Book your appointment instantly. Most clinics offer free consultation.`;
    const h1 = content?.h1 || (content as any)?.title || null;
    
    // Build content string from page_content sections
    let contentText: string | null = null;
    let heroIntro: string | null = null;
    let aiDefinition: string | null = null;
    let aiProcessSteps: any[] | null = null;
    let aiCostRange: any[] | null = null;
    let aiChecklist: any[] | null = null;
    
    if (pageContent) {
        heroIntro = pageContent.hero_intro || null;
        aiDefinition = (pageContent as any).ai_definition || null;
        aiProcessSteps = (pageContent as any).ai_process_steps || null;
        aiCostRange = (pageContent as any).ai_cost_range || null;
        aiChecklist = (pageContent as any).ai_checklist || null;
        
        const sections = [];
        if (pageContent.body_content) sections.push(pageContent.body_content);
        if (pageContent.section_1_title && pageContent.section_1_content) sections.push(`## ${pageContent.section_1_title}\n\n${pageContent.section_1_content}`);
        if (pageContent.section_2_title && pageContent.section_2_content) sections.push(`## ${pageContent.section_2_title}\n\n${pageContent.section_2_content}`);
        if (pageContent.section_3_title && pageContent.section_3_content) sections.push(`## ${pageContent.section_3_title}\n\n${pageContent.section_3_content}`);
        contentText = sections.filter(Boolean).join('\n\n') || null;
    } else if (seoContent) {
        // Use seo_pages: page_intro for hero, content for body
        heroIntro = seoContent.page_intro || null;
        contentText = seoContent.content || null;
        // Also check seo_pages for AI structured content
        aiDefinition = (seoContent as any).ai_definition || null;
        aiProcessSteps = (seoContent as any).ai_process_steps || null;
        aiCostRange = (seoContent as any).ai_cost_range || null;
        aiChecklist = (seoContent as any).ai_checklist || null;
    }

    console.log('[SSR] final h1:', h1);
    console.log('[SSR] final heroIntro:', heroIntro?.substring(0, 50));
    console.log('[SSR] final content:', contentText?.substring(0, 50));
    
    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (content?.faqs && Array.isArray(content.faqs) && content.faqs.length > 0) {
        ssrFaqs = content.faqs.map((f: any) => ({
            question: f.question || f.q,
            answer: f.answer || f.a
        }));
    }

    console.log('[SSR] final faqs:', ssrFaqs.length);

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
