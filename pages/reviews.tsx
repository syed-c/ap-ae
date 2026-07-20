import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import { Star, Quote } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { emirates, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';
import { createServerSupabaseAdmin } from '@/lib/supabaseServer';

const BASE_URL = 'https://www.appointpanda.ae';

interface ReviewItem {
  quote: string;
  authorName: string;
  rating: number;
  clinicName: string | null;
  emirateName: string | null;
}

interface ReviewsPageProps {
  reviews: ReviewItem[];
  totalReviewCount: number;
}

export default function ReviewsPage({ reviews, totalReviewCount }: ReviewsPageProps) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all'
    ? reviews
    : reviews.filter((r) => r.emirateName?.toLowerCase() === filter.toLowerCase());

  return (
    <PageLayout>
      <Head>
        <title>Patient Reviews — {SITE_NAME}.ae</title>
        <meta name="description" content={`Read real patient reviews of dental clinics across the UAE, sourced from Google. ${totalReviewCount.toLocaleString()}+ reviews collected.`} />
        <link rel="canonical" href={`${BASE_URL}/reviews/`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/reviews/`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:url" content={`${BASE_URL}/reviews/`} />
        <meta name="twitter:title" content={`Patient Reviews — ${SITE_NAME}.ae`} />
        <meta name="twitter:description" content={`Read real patient reviews of dental clinics across the UAE, sourced from Google.`} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/reviews/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/reviews/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
        <meta property="og:title" content={`Patient Reviews — ${SITE_NAME}.ae`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="From Google reviews"
        title="Patient reviews"
        subtitle="Real reviews of listed clinics, sourced directly from Google. We don't invent or edit review content."
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
          {filtered.map((r, i) => (
            <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:border-amber-500/40 hover:shadow-md transition-all duration-300">
              <Quote className="h-6 w-6 text-amber-700/30 mb-3" />
              <div className="flex items-center gap-0.5 mb-3">
                {Array.from({ length: r.rating }).map((_, j) => (
                  <Star key={j} className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                ))}
              </div>
              <p className="text-zinc-600 text-sm leading-relaxed">&ldquo;{r.quote}&rdquo;</p>
              <div className="mt-4 pt-3 border-t border-zinc-100">
                <p className="font-semibold text-zinc-900 text-sm">{r.authorName}</p>
                <p className="text-zinc-400 text-xs mt-0.5">{[r.clinicName, r.emirateName].filter(Boolean).join(' · ') || 'via Google'}</p>
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

export const getStaticProps: GetStaticProps<ReviewsPageProps> = async () => {
  const supabase = createServerSupabaseAdmin();
  if (!supabase) {
    return { props: { reviews: [], totalReviewCount: 0 }, revalidate: 300 };
  }

  const [{ count: totalReviewCount }, { data: reviewRows }] = await Promise.all([
    supabase.from('google_reviews').select('id', { count: 'exact', head: true }),
    supabase
      .from('google_reviews')
      .select('author_name, text_content, rating, clinics(name, city:cities(name, state:states(name)))')
      .gte('rating', 4)
      .eq('hipaa_flagged', false)
      .not('text_content', 'is', null)
      .order('review_time', { ascending: false })
      .limit(150),
  ]);

  const reviews: ReviewItem[] = (reviewRows || [])
    .filter((r: any) => r.text_content && r.text_content.length >= 40 && r.text_content.length <= 400 && r.author_name)
    .slice(0, 60)
    .map((r: any) => {
      const clinic = Array.isArray(r.clinics) ? r.clinics[0] : r.clinics;
      const city = clinic?.city ? (Array.isArray(clinic.city) ? clinic.city[0] : clinic.city) : null;
      const state = city?.state ? (Array.isArray(city.state) ? city.state[0] : city.state) : null;
      return {
        quote: r.text_content as string,
        authorName: r.author_name as string,
        rating: r.rating as number,
        clinicName: clinic?.name || null,
        emirateName: state?.name || null,
      };
    });

  return {
    props: { reviews, totalReviewCount: totalReviewCount || 0 },
    revalidate: 3600,
  };
};
