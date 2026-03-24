import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import BlogPostPageComponent from '@/pages/BlogPostPage';

const BASE_URL = 'https://www.appointpanda.ae';

const BlogPostPageWithSEO = ({ postSlug, postData, seoData, dehydratedState }: {
    postSlug: string;
    postData: any;
    seoData: { title: string; description: string; canonical: string; ogImage?: string; author?: string; publishedAt?: string | null; modifiedAt?: string | null };
    dehydratedState: any;
}) => {
    const fullTitle = seoData.title.includes('AppointPanda') ? seoData.title : `${seoData.title} | AppointPanda`;
    const imageUrl = seoData.ogImage || `${BASE_URL}/og-image.png`;

    const articleSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": seoData.title,
        "description": seoData.description,
        "image": imageUrl,
        "author": {
            "@type": "Organization",
            "name": seoData.author || 'AppointPanda',
            "url": BASE_URL,
        },
        "publisher": {
            "@type": "Organization",
            "name": "AppointPanda",
            "logo": {
                "@type": "ImageObject",
                "url": `${BASE_URL}/logo.png`,
                "width": 512,
                "height": 512,
            }
        },
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `${BASE_URL}${seoData.canonical}`,
        },
        "articleSection": postData?.category || 'Dental Health',
    };

    if (seoData.publishedAt) articleSchema.datePublished = seoData.publishedAt;
    if (seoData.modifiedAt) articleSchema.dateModified = seoData.modifiedAt;
    else if (seoData.publishedAt) articleSchema.dateModified = seoData.publishedAt;
    if (postData?.content) articleSchema.wordCount = postData.content.split(/\s+/).length;

    return (
        <>
            <Head>
                <title>{seoData.title}</title>
                <meta name="description" content={seoData.description} />
                <link rel="canonical" href={seoData.canonical} />
                <meta property="og:type" content="article" />
                <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta property="og:title" content={fullTitle} />
                <meta property="og:description" content={seoData.description} />
                <meta property="og:image" content={imageUrl} />
                <meta property="og:site_name" content="AppointPanda" />
                {seoData.publishedAt && <meta property="article:published_time" content={seoData.publishedAt} />}
                {seoData.modifiedAt && <meta property="article:modified_time" content={seoData.modifiedAt} />}
                {seoData.author && <meta property="article:author" content={seoData.author} />}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
                <meta name="twitter:title" content={fullTitle} />
                <meta name="twitter:description" content={seoData.description} />
                <meta name="twitter:image" content={imageUrl} />
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
                />
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
    const ogImage = postData.featured_image_url || null;

    return { 
        props: {
            dehydratedState: dehydrate(queryClient),
            postSlug,
            postData,
            seoData: {
                title: metaTitle,
                description: metaDescription,
                canonical,
                ogImage,
                author: postData.author_name || 'AppointPanda Team',
                publishedAt: postData.published_at || null,
                modifiedAt: postData.updated_at || null,
            }
        },
        revalidate: 3600 // Revalidate every hour (ISR)
    };
};