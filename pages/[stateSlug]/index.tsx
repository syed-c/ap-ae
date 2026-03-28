import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { createServerSupabase } from '@/lib/supabaseServer';
import StatePageComponent from '@/pages/StatePage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const BASE_URL = 'https://www.appointpanda.ae';

const StatePageWithSEO = ({ stateSlug, stateData, seoData, faqs }: {
    stateSlug: string;
    stateData: any;
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
            <StatePageComponent 
                stateSlugProp={stateSlug}
                stateDataProp={stateData}
                seoDataProp={seoData}
                faqsProp={faqs}
            />
        </>
    );
};

export default StatePageWithSEO;

// Generate static paths for all emirates at build time
export const getStaticPaths: GetStaticPaths = async () => {
    try {
        const supabase = createServerSupabase();
        
        if (!supabase) {
            return { paths: [], fallback: 'blocking' };
        }
        
        const { data: states } = await supabase
            .from('states')
            .select('slug')
            .eq('is_active', true);
        
        const paths = (states || []).map((state) => ({
            params: { stateSlug: state.slug }
        }));
        
        return {
            paths,
            fallback: 'blocking'
        };
    } catch (error) {
        console.error('Error generating state paths:', error);
        return { paths: [], fallback: 'blocking' };
    }
};

// Static Site Generation with SSR FAQ data for Googlebot
export const getStaticProps: GetStaticProps = async (ctx) => {
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug) {
        return { notFound: true };
    }

    if (normalizedStateSlug !== stateSlug) {
        return {
            redirect: {
                destination: `/${normalizedStateSlug}/`,
                permanent: true,
            },
        };
    }

    // Direct queries instead of React Query for faster build
    const [stateData, seoContent] = await Promise.all([
        supabase
            .from('states')
            .select('*')
            .eq('slug', normalizedStateSlug)
            .eq('is_active', true)
            .maybeSingle()
            .then(r => r.data),
        supabase
            .from("seo_pages")
            .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
            .eq("slug", normalizedStateSlug)
            .order("is_optimized", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(r => r.data)
    ]);

    if (!stateData) {
        return { notFound: true };
    }
    
    const metaTitle = seoContent?.meta_title || `Dental Clinics in ${stateData.name} | Book Appointments`;
    const metaDescription = seoContent?.meta_description || `Find and book appointments with top-rated dental clinics in ${stateData.name}, UAE. Verified dentists, real reviews.`;

    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0) {
        ssrFaqs = seoContent.faqs.map((f: any) => ({
            question: f.question || f.q,
            answer: f.answer || f.a
        }));
    } else if (seoContent?.content) {
        const faqPattern = /(?:^|\n)(Q[;:]\s*)(.+?)(\n)(A[;:]\s*)(.+?)(?=\n\n|\n##|$)/gm;
        const faqMatches = seoContent.content.matchAll(faqPattern);
        const parsedFaqs: { question: string; answer: string }[] = [];
        for (const match of faqMatches) {
            if (match[2] && match[5]) {
                parsedFaqs.push({ question: match[2].trim(), answer: match[5].trim() });
            }
        }
        if (parsedFaqs.length > 0) {
            ssrFaqs = parsedFaqs;
        }
    }

    return {
        props: {
            stateSlug: normalizedStateSlug,
            stateData: stateData,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical: `/${normalizedStateSlug}/`,
            },
            faqs: ssrFaqs,
        },
        revalidate: 3600,
    };
};
