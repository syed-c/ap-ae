import { GetStaticProps } from 'next';
import Head from 'next/head';
import { QueryClient, dehydrate } from '@tanstack/react-query';
import { createServerSupabase } from '@/lib/supabaseServer';
import BlogPageComponent from '@/pages/BlogPage';

const BASE_URL = 'https://www.appointpanda.ae';

interface BlogIndexProps {
  seoData: { title: string; description: string; canonical: string };
}

export default function BlogIndexPage({ seoData }: BlogIndexProps) {
  return (
    <>
      <Head>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <link rel="canonical" href={seoData.canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}${seoData.canonical}`} />
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}${seoData.canonical}`} />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
      </Head>
      <BlogPageComponent />
    </>
  );
}

export const getStaticProps: GetStaticProps<BlogIndexProps> = async () => {
  const supabase = createServerSupabase();
  const seoSlug = 'blog';

  let metaTitle = 'Dental Health Blog - Expert Tips & Advice | AppointPanda';
  let metaDescription = 'Read expert dental health articles, treatment guides, and patient advice from licensed UAE dentists. Stay informed about oral health, procedures, and finding the right dentist.';

  try {
    const { data: seoPage } = await supabase
      .from('seo_pages')
      .select('meta_title, meta_description')
      .eq('slug', seoSlug)
      .maybeSingle();

    if (seoPage) {
      metaTitle = seoPage.meta_title || metaTitle;
      metaDescription = seoPage.meta_description || metaDescription;
    }
  } catch (e) {
    console.error('Error fetching blog SEO content:', e);
  }

  return {
    props: {
      seoData: {
        title: metaTitle,
        description: metaDescription,
        canonical: '/blog/',
      },
    },
    revalidate: 900,
  };
};
