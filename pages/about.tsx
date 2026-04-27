import { GetStaticProps } from 'next';
import Head from 'next/head';
import AboutPage from '@/pages/AboutPage';

const BASE_URL = 'https://www.appointpanda.ae';

export default function AboutPageWithSEO() {
  return (
    <>
      <Head>
        <title>About AppointPanda | UAE's Trusted Dental Directory</title>
        <meta name="description" content="Learn about AppointPanda, the UAE's leading dental directory. Find verified dentists, read real reviews, and book appointments instantly across Dubai, Abu Dhabi, and all 7 Emirates." />
        <link rel="canonical" href={`${BASE_URL}/about/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/about/`} />
        <meta property="og:title" content="About AppointPanda | UAE's Trusted Dental Directory" />
        <meta property="og:description" content="Learn about AppointPanda, the UAE's leading dental directory." />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/about/`} />
        <meta name="twitter:title" content="About AppointPanda | UAE's Trusted Dental Directory" />
        <meta name="twitter:description" content="Learn about AppointPanda, the UAE's leading dental directory." />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
      </Head>
      <AboutPage />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 1800 });
