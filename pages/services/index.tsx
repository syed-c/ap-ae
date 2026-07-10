import { GetStaticProps } from 'next';
import Head from 'next/head';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';
import ServicesPageComponent from '@/pages/ServicesPage';
import { specialties } from '@/lib/site-data';

const BASE_URL = 'https://www.appointpanda.ae';

interface TreatmentData {
  slug: string;
  name: string;
  description: string | null;
}

interface ServicesPageProps {
  treatments: TreatmentData[];
  totalClinics: number;
}

export default function ServicesIndexPage({ treatments, totalClinics }: ServicesPageProps) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Dental Services", item: `${BASE_URL}/services/` },
    ]
  };

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Dental Services in UAE",
    "description": `Browse all ${treatments?.length || 0} dental treatments available across the UAE. From routine checkups to advanced procedures.`,
    "url": `${BASE_URL}/services/`,
    "numberOfItems": treatments?.length || 0,
  };

  return (
    <>
      <Head>
        {/* Meta tags — server-rendered, not duplicated by SEOHead */}
        <title>Dental Services in UAE - Find Treatments & Procedures | AppointPanda</title>
        <meta name="description" content={`Browse ${totalClinics.toLocaleString()}+ verified dental clinics and ${treatments?.length || 0} treatments across all 7 UAE emirates. Compare prices, read reviews, and book instantly.`} />
        <link rel="canonical" href={`${BASE_URL}/services/`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/services/`} />
        <meta property="og:title" content="Dental Services in UAE - Find Treatments & Procedures | AppointPanda" />
        <meta property="og:description" content={`Browse ${totalClinics.toLocaleString()}+ verified dental clinics and ${treatments?.length || 0} treatments across all 7 UAE emirates.`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${BASE_URL}/services/`} />
        <meta name="twitter:title" content="Dental Services in UAE - Find Treatments & Procedures | AppointPanda" />
        <meta name="twitter:description" content={`Browse ${totalClinics.toLocaleString()}+ verified dental clinics and ${treatments?.length || 0} treatments across all 7 UAE emirates.`} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/services/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/services/`} />
        {/* BreadcrumbList JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
        {/* CollectionPage JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
        />
      </Head>
      <ServicesPageComponent treatmentsProp={treatments} />
    </>
  );
}

export const getStaticProps: GetStaticProps<ServicesPageProps> = async () => {
  const supabase = createServerSupabaseAdmin();

  if (!supabase) {
    return {
      props: {
        treatments: specialties.map(s => ({ slug: s.slug, name: s.name, description: s.description })),
        totalClinics: 1301,
      },
      revalidate: 60,
    };
  }

  const [treatmentsData, countData] = await Promise.all([
    supabase
      .from('treatments')
      .select('slug, name, description')
      .eq('is_active', true)
      .then(r => r.data),
    supabase
      .from('clinics')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .then(r => r.count),
  ]);

  return {
    props: {
      treatments: (treatmentsData || specialties.map(s => ({ slug: s.slug, name: s.name, description: s.description }))) as TreatmentData[],
      totalClinics: countData || 1301,
    },
    revalidate: 600,
  };
};
