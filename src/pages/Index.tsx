'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import {
  MapPin, Star, ShieldCheck, Search, ChevronRight, ArrowRight, Clock, Sparkles,
  Stethoscope, Baby, Syringe, ArrowLeftRight, Activity, Scissors, Sun, Gem,
  Ambulance, Palette, Quote, BadgeCheck, Users,
} from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { PageLayout } from '@/components/layout/PageLayout';
import { ClinicCard } from '@/components/ClinicCard';
import {
  SITE_NAME, SITE_DOMAIN, emirates, specialties, insurers,
  blogPosts, faqs, popularSearches,
} from '@/lib/site-data';
import type { HomePageData } from '../../pages/index';

const ICON_MAP: Record<string, React.ReactNode> = {
  Stethoscope: <Stethoscope className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  Syringe: <Syringe className="h-6 w-6" />,
  ArrowLeftRight: <ArrowLeftRight className="h-6 w-6" />,
  Baby: <Baby className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
  Scissors: <Scissors className="h-6 w-6" />,
  Sun: <Sun className="h-6 w-6" />,
  Gem: <Gem className="h-6 w-6" />,
  Ambulance: <Ambulance className="h-6 w-6" />,
  Palette: <Palette className="h-6 w-6" />,
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(rating) ? 'text-amber-500 fill-amber-500' : 'text-zinc-200'}`} />
      ))}
    </div>
  );
}

interface IndexPageProps {
  pageData?: HomePageData | null;
}

export default function IndexPage({ pageData }: IndexPageProps) {
  const router = useRouter();
  const [searchEmirate, setSearchEmirate] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');
  const [searchInsurance, setSearchInsurance] = useState('');

  const realClinics = pageData?.topDentalClinics || [];
  const clinicCount = pageData?.clinicCount || 1301;
  const reviewCount = pageData?.reviewCount || 5671;
  const avgRating = pageData?.avgRating || 4.7;
  const clinicsWithImages = pageData?.clinicsWithImages || 1181;
  const statesData = pageData?.statesData || [];
  const treatmentsData = pageData?.treatmentsData || [];
  const testimonials = pageData?.testimonials || [];

  const featuredClinics = useMemo(() => realClinics.slice(0, 10), [realClinics]);

  const [emblaRef] = useEmblaCarousel(
    { loop: true, dragFree: true, slidesToScroll: 1, align: 'start' },
    [Autoplay({ delay: 3500, stopOnInteraction: false })]
  );

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchEmirate) params.set('emirate', searchEmirate);
    if (searchSpecialty) params.set('specialty', searchSpecialty);
    if (searchInsurance) params.set('insurance', searchInsurance);
    const qs = params.toString();
    router.push(`/find-clinics${qs ? `?${qs}` : ''}`);
  }, [searchEmirate, searchSpecialty, searchInsurance, router]);

  return (
    <PageLayout>
      <SEOHead
        title={`${SITE_NAME}.ae — Find Verified Dental Clinics Across the UAE`}
        description={`${SITE_NAME}.ae connects patients with ${clinicCount.toLocaleString()} dental clinics across the UAE. Compare prices, check insurance, and book instantly.`}
        canonical="/"
        ogImage={`https://${SITE_DOMAIN}/og-home.jpg`}
      />

      {/* Hero */}
      <section className="gradient-dark-hero overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 relative z-10 pt-16 pb-20 lg:pt-20 lg:pb-28">
          {/* Trust bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-10 text-xs">
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Star className="h-3.5 w-3.5 fill-amber-400" /> {avgRating} <span className="text-amber-300/70">★★★★★</span>
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" /> {clinicCount.toLocaleString()} clinics listed
            </span>
            <span className="text-zinc-600 hidden sm:inline">|</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Users className="h-3.5 w-3.5 text-zinc-400" /> {reviewCount.toLocaleString()}+ verified reviews
            </span>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-white leading-[1.05]">
              Exceptional dental care,<br />across the Emirates.
            </h1>
            <p className="text-zinc-400 text-base md:text-lg mt-5 max-w-2xl mx-auto leading-relaxed font-[425]">
              Compare {clinicCount.toLocaleString()} dental clinics, see real AED prices, check your insurance coverage — and book in under 60 seconds.
            </p>
          </div>

          {/* Search card */}
          <div className="mt-10 max-w-4xl mx-auto">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl ring-1 ring-black/5 shadow-xl shadow-black/10 p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select
                  value={searchEmirate}
                  onChange={e => setSearchEmirate(e.target.value)}
                  className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Emirates</option>
                  {(pageData?.statesData?.length ? pageData.statesData : emirates).map(e => (
                    <option key={e.slug} value={e.slug}>{e.name}</option>
                  ))}
                </select>
                <select
                  value={searchSpecialty}
                  onChange={e => setSearchSpecialty(e.target.value)}
                  className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Specialties</option>
                  {(pageData?.treatmentsData?.length ? pageData.treatmentsData : specialties).map(s => (
                    <option key={s.slug} value={s.slug}>{s.name}</option>
                  ))}
                </select>
                <select
                  value={searchInsurance}
                  onChange={e => setSearchInsurance(e.target.value)}
                  className="w-full h-12 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Insurance</option>
                  {insurers.map(i => <option key={i.slug} value={i.slug}>{i.name}</option>)}
                </select>
                <button
                  onClick={handleSearch}
                  className="w-full h-12 inline-flex items-center justify-center gap-2 px-6 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-xl transition-all duration-200 active:scale-[0.98]"
                >
                  <Search className="h-4 w-4" />
                  Search Clinics
                </button>
              </div>
            </div>

            {/* Popular quick-links */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {popularSearches.map((term) => (
                <Link key={term} href={`/specialties/${term.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z-]/g, '')}`} className="inline-flex items-center px-3 py-1.5 bg-white/10 border border-white/10 text-zinc-300 hover:bg-white/15 hover:text-white text-xs font-medium rounded-full transition-all duration-200 backdrop-blur-sm">
                  {term}
                </Link>
              ))}
            </div>
          </div>

          {/* Inline stats */}
          <div className="mt-12 pt-8 border-t border-white/5 max-w-3xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-6 text-center">
              {[
                { number: clinicCount.toLocaleString(), label: 'Clinics Listed' },
                { number: reviewCount.toLocaleString(), label: 'Patient Reviews' },
                { number: '7', label: 'Emirates Covered' },
                { number: `${avgRating}★`, label: 'Average Rating' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-0.5">
                  <div className="text-xl md:text-2xl font-bold text-amber-400">{stat.number}</div>
                  <div className="text-[11px] text-zinc-500 font-medium uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trust pillars */}
      <section aria-label="Why choose us" className="py-16 lg:py-20 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Why AppointPanda</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Built for trust, designed for your smile</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <ShieldCheck className="h-6 w-6" />, title: 'Verification Status on Every Profile', desc: `Each clinic profile shows a verification status, from newly listed to fully verified. ${clinicsWithImages.toLocaleString()} clinics have complete profiles.` },
              { icon: <Star className="h-6 w-6" />, title: 'Real Patient Reviews', desc: `${reviewCount.toLocaleString()} patient reviews collected from Google.` },
              { icon: <span className="text-lg font-bold">AED</span>, title: 'AED Pricing Where Available', desc: 'Prices posted by clinics where available — always confirm final pricing directly with the clinic.' },
              { icon: <Sparkles className="h-6 w-6" />, title: 'Search by Insurance', desc: 'Filter clinics by the insurance provider you have, across 40+ UAE insurance providers.' },
            ].map((pillar) => (
              <div key={pillar.title} className="card-hover-amber p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-700 mb-4">
                  {pillar.icon}
                </div>
                <h3 className="font-semibold text-zinc-900 text-sm">{pillar.title}</h3>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Clinics carousel */}
      {featuredClinics.length > 0 && (
        <section aria-label="Featured clinics" className="py-16 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 lg:px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Top rated</p>
                <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Featured clinics</h2>
              </div>
              <Link href="/find-clinics" className="hidden md:flex items-center gap-1 text-sm font-semibold text-zinc-900 hover:text-amber-700 transition-colors">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex max-w-7xl mx-auto px-4 lg:px-6">
              {featuredClinics.map((clinic) => (
                <div key={clinic.id} className="flex-[0_0_85%] sm:flex-[0_0_45%] lg:flex-[0_0_28%] min-w-0 pl-4 first:pl-0">
                  <ClinicCard
                    slug={clinic.slug}
                    name={clinic.name}
                    location={clinic.cityName ? `${clinic.cityName}${clinic.stateName ? `, ${clinic.stateName}` : ''}` : 'UAE'}
                    rating={clinic.rating}
                    reviewCount={clinic.reviewCount}
                    coverImageUrl={clinic.coverImageUrl}
                    tags={[]}
                    price=""
                    hours=""
                    open=""
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 mt-6 md:hidden">
            <Link href="/find-clinics" className="flex items-center justify-center gap-1 text-sm font-semibold text-zinc-900 py-3 border border-zinc-200 rounded-full">
              View all clinics <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Browse by Emirate */}
      <section aria-label="Browse by emirate" className="py-16 lg:py-20 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Across all 7 emirates</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Find clinics near you</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(pageData?.statesData?.length ? pageData.statesData : emirates).map((e) => (
              <Link key={e.slug} href={`/${e.slug}/`} className="card-hover-amber p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 text-sm">{e.name}</h3>
                  <p className="text-amber-700 text-[11px] font-semibold mt-1.5">
                    {'clinicCount' in e ? `${e.clinicCount} clinics` : 'Clinics available'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Specialties */}
      <section aria-label="Popular specialties" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Find by treatment</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Popular specialties</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {specialties.map((spec) => (
              <Link key={spec.slug} href={`/specialties/${spec.slug}`} className="card-hover-amber p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-700/10 flex items-center justify-center text-amber-700 shrink-0">
                  {ICON_MAP[spec.icon] || <Stethoscope className="h-5 w-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 text-sm">{spec.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-label="How AppointPanda works" className="py-16 lg:py-20 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Three simple steps</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">How it works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'Search', desc: `Browse ${clinicCount.toLocaleString()} clinics by emirate, specialty, or insurance. Filter by price and rating.` },
              { step: '02', title: 'Compare & Read Reviews', desc: `Compare ${reviewCount.toLocaleString()} patient reviews and AED prices side by side.` },
              { step: '03', title: 'Book Instantly', desc: 'Book your appointment online and confirm your insurance directly with the clinic.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-amber-700/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-amber-700 font-bold text-lg">{item.step}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 text-[15px]">{item.title}</h3>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
              <ShieldCheck className="h-3.5 w-3.5" />
              Search clinics by your insurance provider
            </span>
          </div>
        </div>
      </section>

      {/* Insurance Partners */}
      <section aria-label="Insurance partners" className="py-12 bg-white border-t border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 text-center mb-6">Accepted by 500+ clinics</p>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-4 items-center">
            {insurers.map((ins) => (
              <Link key={ins.slug} href="/insurance" className="flex items-center justify-center h-10 px-2 bg-white border border-zinc-200 rounded-lg text-[11px] font-semibold text-zinc-500 hover:text-amber-700 hover:border-amber-300 transition-all">
                {ins.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - real Google reviews of listed clinics, not invented quotes */}
      {testimonials.length > 0 && (
      <section aria-label="Patient reviews" className="py-16 lg:py-20 bg-[#fafafa]">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">From Google reviews</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">What patients are saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="card-hover-amber p-6">
                <Quote className="h-6 w-6 text-amber-700/30 mb-3" />
                <StarRating rating={t.rating} />
                <p className="text-zinc-600 text-sm mt-3 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 pt-3 border-t border-zinc-100">
                  <p className="font-semibold text-zinc-900 text-sm">{t.authorName}</p>
                  <p className="text-zinc-400 text-xs">{t.clinicName ? `${t.clinicName} · ` : ''}via Google</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Blog preview */}
      <section aria-label="Latest from our blog" className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Expert insights</p>
              <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Latest articles</h2>
            </div>
            <Link href="/blog" className="hidden md:flex items-center gap-1 text-sm font-semibold text-zinc-900 hover:text-amber-700 transition-colors">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="card-hover-amber overflow-hidden">
                <div className="h-44 bg-zinc-100 bg-gradient-to-br from-zinc-200 to-zinc-300" />
                <div className="p-5">
                  <span className="inline-flex px-2 py-0.5 bg-amber-700/10 text-amber-700 text-[10px] font-semibold rounded-full uppercase tracking-wider">{post.category}</span>
                  <h3 className="font-semibold text-zinc-900 text-[15px] mt-2 leading-tight">{post.title}</h3>
                  <p className="text-zinc-500 text-xs mt-2 leading-relaxed line-clamp-2">{post.excerpt}</p>
                  <p className="text-zinc-400 text-[11px] mt-3">{post.readingTime} read</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-6 md:hidden text-center">
            <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-900 py-3 px-6 border border-zinc-200 rounded-full">
              View all articles <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* For Clinics CTA */}
      <section className="gradient-dark-hero py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">Grow your practice with {SITE_NAME}</h2>
          <p className="text-zinc-400 text-sm md:text-base mt-4 max-w-xl mx-auto">
            Join {clinicCount.toLocaleString()}+ clinics across the UAE. Average +38 bookings per month, zero commission.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link href="/for-clinics" className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-full transition-all duration-200">
              List your clinic <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-semibold text-sm rounded-full transition-all duration-200">
              See pricing
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-3xl mx-auto">
            {[
              { number: '+38', label: 'Avg. bookings/mo' },
              { number: '4 weeks', label: 'Onboarding' },
              { number: '0%', label: 'Commission' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-amber-500">{stat.number}</div>
                <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-label="Frequently asked questions" className="py-16 lg:py-20 bg-[#fafafa]">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 mb-2">Got questions?</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">FAQs</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-amber-500/40">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-semibold text-zinc-900 hover:text-amber-700 transition-colors">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 text-zinc-400 group-open:rotate-90 transition-transform duration-200 shrink-0" />
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-zinc-500 text-sm leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-white border-t border-zinc-200">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Find your dentist in the next 60 seconds</h2>
          <p className="text-zinc-500 text-sm mt-4">No registration required. Start browsing now.</p>
          <Link href="/find-clinics" className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-full transition-all duration-200">
            Browse clinics <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
