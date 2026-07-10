import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Stethoscope } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { ClinicCard } from '@/components/ClinicCard';
import { specialties, getSpecialtyBySlug, getClinicsBySpecialty, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';

const BASE_URL = 'https://www.appointpanda.ae';

export default function SpecialtyDetailPage({ specialty, clinics }: { specialty: any; clinics: any[] }) {
  if (!specialty) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Specialty not found</h1>
          <Link href="/specialties" className="text-amber-700 hover:text-amber-800 mt-4 inline-block">Browse all specialties</Link>
        </div>
      </PageLayout>
    );
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": BASE_URL },
      { "@type": "ListItem", "position": 2, "name": "Specialties", "item": `${BASE_URL}/specialties` },
      { "@type": "ListItem", "position": 3, "name": specialty.name, "item": `${BASE_URL}/specialties/${specialty.slug}` },
    ],
  };

  return (
    <PageLayout>
      <Head>
        <title>{`${specialty.name} in UAE — ${SITE_NAME}.ae`}</title>
        <meta name="description" content={specialty.description} />
        <meta property="og:title" content={`${specialty.name} in UAE — ${SITE_NAME}.ae`} />
        <meta property="og:description" content={specialty.description} />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </Head>

      <PageHero
        kicker={`${specialty.count} clinics available`}
        title={`${specialty.name} in the UAE`}
        subtitle={specialty.description}
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {clinics.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-zinc-900 text-[15px]">Top clinics for {specialty.name}</h2>
              <Link href="/find-clinics" className="text-sm font-semibold text-amber-700 hover:text-amber-800">View all</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clinics.map(clinic => (
                <ClinicCard key={clinic.slug} clinic={clinic} />
              ))}
            </div>
          </>
        )}

        {clinics.length === 0 && (
          <div className="text-center py-16">
            <Stethoscope className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-semibold text-zinc-900">No clinics yet</h3>
            <p className="text-zinc-500 text-sm mt-2">Check back soon.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = specialties.map(s => ({ params: { slug: s.slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const slug = params?.slug as string;
  const specialty = getSpecialtyBySlug(slug);
  const relatedClinics = getClinicsBySpecialty(slug);
  return { props: { specialty: specialty || null, clinics: relatedClinics } };
};
