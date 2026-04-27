import { GetStaticProps } from 'next';
import Head from 'next/head';
import ServicesPageComponent from '@/pages/ServicesPage';

const BASE_URL = 'https://www.appointpanda.ae';

export default function ServicesIndexPage() {
  return (
    <>
      <Head>
        <title>Dental Services in UAE - Find Treatments & Procedures | AppointPanda</title>
        <meta name="description" content="Browse all dental services available across the UAE. From routine checkups to advanced procedures, find the right treatment for your needs with verified clinics in Dubai, Abu Dhabi, and more." />
        <link rel="canonical" href={`${BASE_URL}/services/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/services/`} />
        <meta property="og:title" content="Dental Services in UAE - Find Treatments & Procedures | AppointPanda" />
        <meta property="og:description" content="Browse all dental services available across the UAE." />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/services/`} />
        <meta name="twitter:title" content="Dental Services in UAE - Find Treatments & Procedures | AppointPanda" />
        <meta name="twitter:description" content="Browse all dental services available across the UAE." />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
      </Head>
      <ServicesPageComponent />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  return { props: {}, revalidate: 600 };
};
