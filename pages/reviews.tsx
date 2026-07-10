import { useState } from 'react';
import Head from 'next/head';
import { Star, Quote, Search, ChevronDown } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { testimonials, emirates, specialties, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';

const BASE_URL = 'https://www.appointpanda.ae';

export default function ReviewsPage() {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? testimonials : testimonials.filter(t => t.emirate.toLowerCase() === filter.toLowerCase());

  return (
    <PageLayout>
      <Head>
        <title>Verified Patient Reviews — {SITE_NAME}.ae</title>
        <meta name="description" content="Read 47,900+ verified patient reviews of dental clinics across the UAE. Real experiences, honest feedback." />
        <link rel="canonical" href={`${BASE_URL}/reviews/`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/reviews/`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:url" content={`${BASE_URL}/reviews/`} />
        <meta name="twitter:title" content={`Verified Patient Reviews — ${SITE_NAME}.ae`} />
        <meta name="twitter:description" content="Read 47,900+ verified patient reviews of dental clinics across the UAE. Real experiences, honest feedback." />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/reviews/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/reviews/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
        <meta property="og:title" content={`Verified Patient Reviews — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Real reviews from real patients. Find the best dentist for your needs." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="Trusted by thousands"
        title="Verified patient reviews"
        subtitle="Every review comes from a confirmed patient. No fake ratings, no paid testimonials."
      >
        <div className="flex items-center justify-center gap-2">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="h-10 px-4 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 appearance-none cursor-pointer"
          >
            <option value="all">All Emirates</option>
            {emirates.map(e => <option key={e.slug} value={e.name}>{e.name}</option>)}
          </select>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((t, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-amber-500/40 hover:shadow-md transition-all duration-300">
              <Quote className="h-6 w-6 text-amber-700/30 mb-3" />
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-4 pt-3 border-t border-zinc-100">
                <p className="font-semibold text-zinc-900 text-sm">{t.name}</p>
                <p className="text-zinc-400 text-xs mt-0.5">{t.emirate} &middot; {t.treatment}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-zinc-500">No reviews match your filter. Try a different emirate.</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
