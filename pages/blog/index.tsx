import Head from 'next/head';
import BlogPageComponent from '@/pages/BlogPage';

const BASE_URL = 'https://www.appointpanda.ae';

export default function BlogIndexPage() {
  return (
    <>
      <Head>
        <title>Dental Health Blog - Expert Tips & Advice | AppointPanda</title>
        <meta name="description" content="Read expert dental health articles, treatment guides, and patient advice from licensed UAE dentists. Stay informed about oral health, procedures, and finding the right dentist." />
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
      <BlogPageComponent />
    </>
  );
}
