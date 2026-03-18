import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import BlogPostPageComponent from '@/pages/BlogPostPage';

const BASE_URL = 'https://www.appointpanda.ae';

const BlogPostPageWithSEO = ({ postSlug, postData, seoData, dehydratedState }: {
    postSlug: string;
    postData: any;
    seoData: { title: string; description: string; canonical: string };
    dehydratedState: any;
}) => {
    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
            </Head>
            <BlogPostPageComponent 
                postSlugProp={postSlug}
                postDataProp={postData}
                seoDataProp={seoData}
                dehydratedStateProp={dehydratedState}
            />
        </>
    );
};

export default BlogPostPageWithSEO;

// Generate static paths for all blog posts at build time
export const getStaticPaths: GetStaticPaths = async () => {
    const supabase = createServerSupabase();
    
    // Skip if no Supabase credentials
    if (!supabase) {
        return { paths: [], fallback: 'blocking' };
    }
    
    console.log('[SSG] Generating blog post paths...');
    
    const { data: posts } = await supabase
        .from('blog_posts')
        .select('slug')
        .eq('status', 'published');
    
    const paths = (posts || []).map(post => ({
        params: { postSlug: post.slug }
    }));
    
    console.log(`[SSG] Generated ${paths.length} blog post paths`);
    
    return {
        paths,
        fallback: 'blocking'
    };
};

// Convert to Static Site Generation
export const getStaticProps: GetStaticProps = async (ctx) => {
    const queryClient = new QueryClient();
    const supabase = createServerSupabase();
    const postSlug = ctx.params?.postSlug as string;

    if (!postSlug) {
        return { notFound: true };
    }

    // Prefetch post data
    await queryClient.prefetchQuery({
        queryKey: ["blog-post", postSlug],
        queryFn: async () => {
            const { data } = await supabase
                .from("blog_posts")
                .select("*")
                .eq("slug", postSlug)
                .eq("status", "published")
                .maybeSingle();
            return data;
        },
    });

    const postData = queryClient.getQueryData<any>(["blog-post", postSlug]);
    
    if (!postData) {
        return { notFound: true };
    }

    const metaTitle = postData.meta_title || postData.title || 'Blog Post';
    const metaDescription = postData.meta_description || postData.excerpt || postData.content?.slice(0, 160) || 'Read our blog post';
    const canonical = `/blog/${postSlug}/`;

    return { 
        props: {
            dehydratedState: dehydrate(queryClient),
            postSlug,
            postData,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical,
            }
        },
        revalidate: 3600 // Revalidate every hour (ISR)
    };
};