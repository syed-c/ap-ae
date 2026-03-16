import { GetStaticProps, GetStaticPaths } from 'next';
import { createServerSupabase } from '@/lib/supabaseServer';
import BlogPostPageComponent from '@/pages/BlogPostPage';

export default BlogPostPageComponent;

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
export const getStaticProps: GetStaticProps = async () => {
    return { 
        props: {},
        revalidate: 3600 // Revalidate every hour (ISR)
    };
};
