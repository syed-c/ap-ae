import { GetStaticProps } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import BlogPageComponent from '@/pages/BlogPage';

const BASE_URL = 'https://www.appointpanda.ae';

interface BlogIndexPageProps {
  posts: any[];
  featuredPosts: any[];
  popularStates: { name: string; slug: string }[];
  popularTreatments: { name: string; slug: string }[];
}

export default function BlogIndexPage(props: BlogIndexPageProps) {
  return (
    <>
      <Head>
        <title>Dental Health Blog - Expert Tips & Advice | AppointPanda</title>
        <meta name="description" content="Read expert dental health articles, treatment guides, and patient advice from licensed UAE dentists. Stay informed about oral health, procedures, and finding the right dentist." />
        <meta name="robots" content="index, follow" />
        <meta property="og:locale" content="en_AE" />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/blog/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/blog/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
        <link rel="canonical" href={`${BASE_URL}/blog/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/blog/`} />
        <meta property="og:title" content="Dental Health Blog - Expert Tips & Advice | AppointPanda" />
        <meta property="og:description" content="Read expert dental health articles, treatment guides, and patient advice from licensed UAE dentists." />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/blog/`} />
        <meta name="twitter:title" content="Dental Health Blog - Expert Tips & Advice | AppointPanda" />
        <meta name="twitter:description" content="Read expert dental health articles, treatment guides, and patient advice from licensed UAE dentists." />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
      </Head>
      <BlogPageComponent {...props} />
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogIndexPageProps> = async () => {
  const supabase = createServerSupabaseAdmin();

  if (!supabase) {
    return {
      props: {
        posts: [],
        featuredPosts: [],
        popularStates: [],
        popularTreatments: [],
      },
      revalidate: 600,
    };
  }

  const [postsResult, featuredResult, statesResult, treatmentsResult] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(3),
    supabase
      .from('states')
      .select('name, slug')
      .eq('is_active', true)
      .order('display_order')
      .limit(5),
    supabase
      .from('treatments')
      .select('name, slug')
      .eq('is_active', true)
      .order('display_order')
      .limit(8),
  ]);

  return {
    props: {
      posts: postsResult.data || [],
      featuredPosts: featuredResult.data || [],
      popularStates: statesResult.data || [],
      popularTreatments: treatmentsResult.data || [],
    },
    revalidate: 600,
  };
};
