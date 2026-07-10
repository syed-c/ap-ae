import Head from 'next/head';
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { emirates, specialties, insurers, SITE_NAME } from '@/lib/site-data';

const BASE_URL = 'https://www.appointpanda.ae';

export default function SitemapPage() {
  return (
    <PageLayout>
      <Head>
        <title>Sitemap — {SITE_NAME}.ae</title>
        <meta name="description" content={`Complete site map for ${SITE_NAME}.ae — find every page across our dental directory.`} />
        <link rel="canonical" href={`${BASE_URL}/sitemap/`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/sitemap/`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:url" content={`${BASE_URL}/sitemap/`} />
        <meta name="twitter:title" content={`Sitemap — ${SITE_NAME}.ae`} />
        <meta name="twitter:description" content={`Complete site map for ${SITE_NAME}.ae — find every page across our dental directory.`} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/sitemap/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/sitemap/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
      </Head>

      <PageHero
        kicker="Site index"
        title="Sitemap"
      />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div>
            <h2 className="font-semibold text-zinc-900 text-sm mb-3">Patients</h2>
            <ul className="space-y-2">
              {[
                { label: 'Find Clinics', href: '/find-clinics' },
                { label: 'Specialties', href: '/specialties' },
                { label: 'Emirates', href: '/emirates' },
                { label: 'Insurance', href: '/insurance' },
                { label: 'Reviews', href: '/reviews' },
                { label: 'Emergency', href: '/emergency' },
                { label: 'Blog', href: '/blog' },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="text-sm text-zinc-500 hover:text-amber-700 transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 text-sm mb-3">For Clinics</h2>
            <ul className="space-y-2">
              {[
                { label: 'List Your Clinic', href: '/for-clinics' },
                { label: 'Pricing', href: '/pricing' },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="text-sm text-zinc-500 hover:text-amber-700 transition-colors">{l.label}</Link></li>
              ))}
            </ul>
            <h2 className="font-semibold text-zinc-900 text-sm mb-3 mt-6">Company</h2>
            <ul className="space-y-2">
              {[
                { label: 'About', href: '/about' },
                { label: 'Contact', href: '/contact' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
                { label: 'Editorial Policy', href: '/editorial-policy' },
              ].map(l => (
                <li key={l.href}><Link href={l.href} className="text-sm text-zinc-500 hover:text-amber-700 transition-colors">{l.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 text-sm mb-3">Emirates</h2>
            <ul className="space-y-2">
              {emirates.map(e => (
                <li key={e.slug}><Link href={`/${e.slug}/`} className="text-sm text-zinc-500 hover:text-amber-700 transition-colors">{e.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 text-sm mb-3">Specialties</h2>
            <ul className="space-y-2">
              {specialties.map(s => (
                <li key={s.slug}><Link href={`/specialties/${s.slug}`} className="text-sm text-zinc-500 hover:text-amber-700 transition-colors">{s.name}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-semibold text-zinc-900 text-sm mb-3">Insurance</h2>
            <ul className="space-y-2">
              {insurers.map(i => (
                <li key={i.slug}><Link href="/insurance" className="text-sm text-zinc-500 hover:text-amber-700 transition-colors">{i.name}</Link></li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
