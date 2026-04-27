import { GetStaticProps } from 'next';
import Head from 'next/head';
import EmergencyDentistPage from '@/pages/EmergencyDentist';

const BASE_URL = 'https://www.appointpanda.ae';

export default function EmergencyDentistWithSEO() {
  return (
    <>
      <Head>
        <title>Emergency Dentist in UAE | 24/7 Dental Care | AppointPanda</title>
        <meta name="description" content="Find 24/7 emergency dentists in Dubai, Abu Dhabi and across UAE. Same-day appointments available for dental emergencies. Call now or book online. DHA-licensed dentists." />
        <link rel="canonical" href={`${BASE_URL}/emergency-dentist/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/emergency-dentist/`} />
        <meta property="og:title" content="Emergency Dentist in UAE | 24/7 Dental Care | AppointPanda" />
        <meta property="og:description" content="Find 24/7 emergency dentists in UAE. Same-day appointments available." />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/emergency-dentist/`} />
        <meta name="twitter:title" content="Emergency Dentist in UAE | 24/7 Dental Care | AppointPanda" />
        <meta name="twitter:description" content="Find 24/7 emergency dentists in UAE." />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EmergencyService",
            "name": "Emergency Dental Care UAE",
            "description": "24/7 emergency dental services across Dubai, Abu Dhabi, Sharjah and all 7 Emirates.",
            "url": `${BASE_URL}/emergency-dentist/`,
            "areaServed": [
              { "@type": "City", "name": "Dubai" },
              { "@type": "City", "name": "Abu Dhabi" },
              { "@type": "City", "name": "Sharjah" }
            ],
            "availableService": {
              "@type": "Service",
              "name": "Emergency Dental Treatment"
            }
          }) }}
        />
      </Head>
      <EmergencyDentistPage />
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => ({ props: {}, revalidate: 300 });
