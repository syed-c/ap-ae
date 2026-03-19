import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import ServicePageComponent from '@/pages/ServicePage';

// Wrapper component to render SEO meta tags server-side with FAQ data for SSR
const ServicePageWithSEO = ({ serviceSlug, seoData, dehydratedState, faqs }: {
    serviceSlug: string;
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
            <ServicePageComponent 
                serviceSlugProp={serviceSlug}
                dehydratedStateProp={dehydratedState}
                seoDataProp={seoData}
                faqsProp={faqs}
            />
        </>
    );
};

export default ServicePageWithSEO;

// Generate static paths for all service pages at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    const { data: treatments } = await supabase
        .from('treatments')
        .select('slug')
        .eq('is_active', true);
    
    const paths = (treatments || []).map(treatment => ({
        params: { serviceSlug: treatment.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} service page paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Static Site Generation with SSR FAQ data for Googlebot
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const serviceSlug = ctx.params?.serviceSlug as string;

    if (!serviceSlug) {
        return { notFound: true };
    }

    const seoSlug = `services/${serviceSlug}`;

    // Prefetch treatment and SEO content (critical for SEO)
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['treatment', serviceSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from('treatments')
                    .select('*')
                    .eq('slug', serviceSlug)
                    .maybeSingle();
                return data || null;
            }
        }),
        queryClient.prefetchQuery({
            queryKey: ['seo-page-content', seoSlug],
            queryFn: async () => {
                const { data } = await supabase
                    .from("seo_pages")
                    .select("id, slug, meta_title, meta_description, content, is_optimized, h1, faqs")
                    .eq("slug", seoSlug)
                    .order("is_optimized", { ascending: false })
                    .limit(1)
                    .maybeSingle();
                return data || null;
            }
        })
    ]);

    const treatment = queryClient.getQueryData<any>(['treatment', serviceSlug]);
    if (!treatment) {
        return { notFound: true };
    }

    const seoContent = queryClient.getQueryData<any>(['seo-page-content', seoSlug]);
    
    const metaTitle = seoContent?.meta_title || `${treatment.name} - Dental Treatment in UAE`;
    const metaDescription = seoContent?.meta_description || `Get ${treatment.name} treatment at top dental clinics in UAE. Book appointments with verified dentists.`;

    // Extract FAQs from SEO content for SSR
    let ssrFaqs: { question: string; answer: string }[] = [];
    
    if (seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0) {
        ssrFaqs = seoContent.faqs.map((f: any) => ({
            question: f.question || f.q,
            answer: f.answer || f.a
        }));
    }

    return {
        props: {
            dehydratedState: dehydrate(queryClient),
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
