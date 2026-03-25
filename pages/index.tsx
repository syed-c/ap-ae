import Head from 'next/head';
import IndexPage from '@/pages/Index';

const BASE_URL = 'https://www.appointpanda.ae';

export default function IndexPageWithSEO() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AppointPanda",
    "url": BASE_URL,
    "description": "Find and book appointments with top-rated dental professionals across the UAE.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": [],
  };

  return (
    <>
      <Head>
        <title>AppointPanda - Find & Book Dental Appointments in UAE</title>
        <meta name="description" content="Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking." />
        <link rel="canonical" href={`${BASE_URL}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/`} />
        <meta property="og:title" content="AppointPanda - Find & Book Dental Appointments in UAE" />
        <meta property="og:description" content="Find and book appointments with top-rated dental professionals across the UAE." />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/`} />
        <meta name="twitter:title" content="AppointPanda - Find & Book Dental Appointments in UAE" />
        <meta name="twitter:description" content="Find and book appointments with top-rated dental professionals across the UAE." />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </Head>
      <IndexPage
        seoDataProp={{
          title: 'AppointPanda - Find & Book Dental Appointments in UAE',
          description: 'Find and book appointments with top-rated dental professionals across the UAE. Verified dentists, real reviews, easy booking.'
        }}
        realCountsProp={null}
        topProfilesProp={[]}
        statesWithClinicsProp={[]}
      />
    </>
  );
}
