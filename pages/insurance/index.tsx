import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { insurers, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';

export default function InsurancePage() {
  return (
    <PageLayout>
      <Head>
        <title>Dental Insurance — {SITE_NAME}.ae</title>
        <meta name="description" content={`Find dental clinics that accept your insurance. Browse ${insurers.length} major UAE insurance providers including Daman, AXA, Bupa, Cigna, and more.`} />
        <meta property="og:title" content={`Dental Insurance — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Find clinics that accept your insurance plan." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="Insurance-matched"
        title="Accepted insurance plans"
        subtitle="Every clinic profile shows accepted insurance. Use our filters to find clinics in your network."
      />

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insurers.map((ins) => (
            <Link key={ins.slug} href="/find-clinics" className="card-hover-amber p-5 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-zinc-900 text-[15px]">{ins.name}</h3>
                  <span className="text-xs text-zinc-400">| {ins.clinics} clinics</span>
                </div>
                <p className="text-zinc-500 text-xs mt-1">{ins.notes}</p>
                <span className="inline-flex items-center gap-1 text-amber-700 text-[11px] font-semibold mt-2">
                  View accepting clinics <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
