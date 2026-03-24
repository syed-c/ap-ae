import { GetStaticProps } from 'next';
import Head from 'next/head';
import { createServerSupabase } from '@/lib/supabaseServer';
import ServicesPageComponent from '@/pages/ServicesPage';

const BASE_URL = 'https://www.appointpanda.ae';

interface ServicesIndexProps {
  seoData: { title: string; description: string; canonical: string };
}

export default function ServicesIndexPage({ seoData }: ServicesIndexProps) {
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
      <ServicesPageComponent />
    </>
  );
}

export const getStaticProps: GetStaticProps<ServicesIndexProps> = async () => {
  const supabase = createServerSupabase();
  const seoSlug = 'services';

  let metaTitle = 'Dental Services in UAE - Find Treatments & Procedures | AppointPanda';
  let metaDescription = 'Browse all dental services available across the UAE. From routine checkups to advanced procedures, find the right treatment for your needs with verified clinics in Dubai, Abu Dhabi, and more.';

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
    console.error('Error fetching services SEO content:', e);
  }

  return {
    props: {
      seoData: {
        title: metaTitle,
        description: metaDescription,
        canonical: '/services/',
      },
    },
    revalidate: 3600,
  };
};
