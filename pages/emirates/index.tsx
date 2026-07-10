import Head from 'next/head';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { emirates, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';

export default function EmiratesPage() {
  return (
    <PageLayout>
      <Head>
        <title>Dental Clinics by Emirate — {SITE_NAME}.ae</title>
        <meta name="description" content={`Find verified dental clinics in all 7 UAE emirates. Browse clinics in Dubai, Abu Dhabi, Sharjah, Ajman, RAK, Fujairah, and Umm Al Quwain.`} />
        <meta property="og:title" content={`Dental Clinics by Emirate — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Browse clinics across all 7 emirates." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="All 7 emirates"
        title="Find clinics by emirate"
        subtitle="From Dubai Marina to Fujairah City — quality dental care wherever you are."
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {emirates.map((emirate) => (
            <Link key={emirate.slug} href={`/emirates/${emirate.slug}`} className="card-hover-amber p-6 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-900 text-[15px]">{emirate.name}</h3>
                <p className="text-zinc-500 text-xs mt-0.5">{emirate.tagline}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {emirate.areas.slice(0, 4).map((area) => (
                    <span key={area} className="text-[10px] text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{area}</span>
                  ))}
                  {emirate.areas.length > 4 && (
                    <span className="text-[10px] text-zinc-400">+{emirate.areas.length - 4} more</span>
                  )}
                </div>
                <p className="text-amber-700 text-[11px] font-semibold mt-2">{emirate.clinics} clinics</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
