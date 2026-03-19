import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import StatePageComponent from '@/pages/StatePage';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const BASE_URL = 'https://www.appointpanda.ae';

const StatePageWithSEO = ({ stateSlug, stateData, seoData, dehydratedState, faqs }: {
    stateSlug: string;
    stateData: any;
    seoData: { title: string; description: string; canonical: string };
    dehydratedState: any;
    faqs: { question: string; answer: string }[];
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
            </Head>
            <StatePageComponent 
                stateSlugProp={stateSlug}
                stateDataProp={stateData}
                dehydratedStateProp={dehydratedState}
                seoDataProp={seoData}
                faqsProp={faqs}
            />
        </>
    );
};

export default StatePageWithSEO;

// Generate static paths for all emirates at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: states } = await supabase
        .from('states')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (states || []).map(state => ({
        params: { stateSlug: state.slug }
    }));
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Static Site Generation with SSR FAQ data for Googlebot
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const stateSlug = ctx.params?.stateSlug as string;
    const normalizedStateSlug = normalizeStateSlug(stateSlug);

    if (!normalizedStateSlug) {
        return { notFound: true };
    }

    // Handle abbreviation redirects (e.g., /dxb/ -> /dubai/)
    if (normalizedStateSlug !== stateSlug) {
        return {
            redirect: {
                destination: `/${normalizedStateSlug}/`,
                permanent: true,
            },
        };
    }

    // Prefetch state data (critical for SEO)
    await queryClient.prefetchQuery({
        queryKey: ['state', normalizedStateSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from('states')
                .select('*')
                .eq('slug', normalizedStateSlug)
                .eq('is_active', true)
                .maybeSingle();
            return data || null;
        }
    });

    // Prefetch SEO content from seo_pages table
    await queryClient.prefetchQuery({
        queryKey: ['seo-page-content', normalizedStateSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from("seo_pages")
                .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
                .or(`slug.eq.${normalizedStateSlug},slug.eq./${normalizedStateSlug}`)
                .order("is_optimized", { ascending: false })
                .limit(1)
                .maybeSingle();
            return data || null;
        }
    });

    const stateData = queryClient.getQueryData<any>(['state', normalizedStateSlug]);
    if (!stateData) {
        return { notFound: true };
    }

    const seoContent = queryClient.getQueryData<any>(['seo-page-content', normalizedStateSlug]);
    
    const metaTitle = seoContent?.meta_title || `Dental Clinics in ${stateData.name} | Book Appointments`;
    const metaDescription = seoContent?.meta_description || `Find and book appointments with top-rated dental clinics in ${stateData.name}, UAE. Verified dentists, real reviews.`;

    // Extract FAQs from SEO content for SSR
    // Priority 1: Direct faqs column from seo_pages
    // Priority 2: Parse from content markdown
    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0) {
        ssrFaqs = seoContent.faqs.map((f: any) => ({
            question: f.question || f.q,
            answer: f.answer || f.a
        }));
    } else     if (seoContent?.content) {
        // Try to parse FAQs from content - match Q: or Q; followed by question, then A: or A; followed by answer
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

    // If no SEO FAQs found, we'll use defaults (passed as prop for consistency)
    // The component will handle fallback defaults client-side if needed

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
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
