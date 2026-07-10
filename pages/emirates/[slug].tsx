import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { ClinicCard } from '@/components/ClinicCard';
import { emirates, getEmirateBySlug, getClinicsByEmirate, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';

export default function EmirateDetailPage({ emirate }: { emirate: any }) {
  if (!emirate) {
    return (
      <PageLayout>
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Emirate not found</h1>
          <Link href="/emirates" className="text-amber-700 hover:text-amber-800 mt-4 inline-block">Browse all emirates</Link>
        </div>
      </PageLayout>
    );
  }

  const emirateClinics = getClinicsByEmirate(emirate.slug);

  return (
    <PageLayout>
      <Head>
        <title>{`Dental Clinics in ${emirate.name} — ${SITE_NAME}.ae`}</title>
        <meta name="description" content={`Find verified dental clinics in ${emirate.name}. ${emirate.clinics} clinics available. Compare prices, read reviews, and book instantly.`} />
        <meta property="og:title" content={`Dental Clinics in ${emirate.name} — ${SITE_NAME}.ae`} />
        <meta property="og:description" content={emirate.tagline} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker={emirate.name}
        title={`Dental clinics in ${emirate.name}`}
        subtitle={emirate.tagline}
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* Popular areas */}
        <div className="mb-8">
          <h2 className="font-semibold text-zinc-900 text-sm mb-3">Popular areas in {emirate.name}</h2>
          <div className="flex flex-wrap gap-2">
            {emirate.areas.map((area: string) => (
              <span key={area} className="pill-chip text-xs">{area}</span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-zinc-500">
            <span className="font-semibold text-zinc-900">{emirateClinics.length}</span> clinics found
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {emirateClinics.map(clinic => (
            <ClinicCard key={clinic.slug} clinic={clinic} />
          ))}
        </div>

        {emirateClinics.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="font-semibold text-zinc-900">No clinics listed yet</h3>
            <p className="text-zinc-500 text-sm mt-2">Check back soon.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = emirates.map(e => ({ params: { slug: e.slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const emirate = getEmirateBySlug(params?.slug as string);
  return { props: { emirate: emirate || null } };
};
