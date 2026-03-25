import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabase } from '@/lib/supabaseServer';
import ServicePageComponent from '@/pages/ServicePage';

const BASE_URL = 'https://www.appointpanda.ae';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const ServicePageWithSEO = ({ serviceSlug, seoData, faqs }: {
    serviceSlug: string;
    seoData: { title: string; description: string; canonical: string };
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
                faqsProp={faqs}
            />
        </>
    );
};

export default ServicePageWithSEO;

// Generate static paths - use fallback blocking to avoid build timeouts
export const getStaticPaths: GetStaticPaths = async () => {
    return {
        paths: [],
        fallback: 'blocking'
    };
};

// Static Site Generation with SSR FAQ data for Googlebot
export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabase();
    const serviceSlug = ctx.params?.serviceSlug as string;

    if (!serviceSlug) {
        return { notFound: true };
    }

    const seoSlug = `services/${serviceSlug}`;

    // Direct queries instead of React Query for faster build
    const [treatment, seoContent] = await Promise.all([
        supabase
            .from('treatments')
            .select('*')
            .eq('slug', serviceSlug)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from("seo_pages")
            .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
            .eq("slug", seoSlug)
            .order("is_optimized", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data)
    ]);

    if (!treatment) {
        return { notFound: true };
    }
    
    const metaTitle = seoContent?.meta_title || `${treatment.name} - Dental Treatment in UAE`;
    const metaDescription = seoContent?.meta_description || `Get ${treatment.name} treatment at top dental clinics in UAE. Book appointments with verified dentists.`;

    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0) {
        ssrFaqs = seoContent.faqs.map((f: any) => ({
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
            faqs: ssrFaqs,
        },
        revalidate: 3600,
    };
};
