import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarCheck, ShieldCheck, Users, Zap, Star, CheckCircle } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { SITE_NAME, SITE_DOMAIN, clinics } from '@/lib/site-data';

export default function ForClinicsPage() {
  return (
    <PageLayout>
      <Head>
        <title>List Your Dental Clinic — {SITE_NAME}.ae</title>
        <meta name="description" content={`Join 500+ clinics generating an average of +38 bookings per month through ${SITE_NAME}. Zero commission, 4-week onboarding.`} />
        <meta property="og:title" content={`List Your Dental Clinic — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Grow your practice with the UAE's leading dental directory." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Hero */}
      <section className="gradient-dark-hero py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 mb-4">For dental clinics</p>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white max-w-3xl mx-auto">
            Grow your practice with {SITE_NAME}
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mt-4 max-w-xl mx-auto">
            Join 500+ clinics across the UAE. Average +38 bookings per month, zero commission, 4-week onboarding.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            <Link
              href="#"
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-full transition-all duration-200"
            >
              List your clinic <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 font-semibold text-sm rounded-full transition-all duration-200"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { number: '500+', label: 'Clinic Partners' },
              { number: '200k+', label: 'Monthly Patients' },
              { number: '+38', label: 'Avg Bookings/Mo' },
              { number: '4.8★', label: 'Avg Partner Rating' },
            ].map((stat) => (
              <div key={stat.label} className="space-y-1">
                <div className="text-2xl md:text-3xl font-bold text-amber-600">{stat.number}</div>
                <div className="text-xs text-zinc-500 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features grid */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Everything you need to grow</h2>
            <p className="text-zinc-500 text-sm mt-3 max-w-lg mx-auto">From profile management to analytics — we handle the platform so you can focus on patients.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: <CalendarCheck className="h-6 w-6" />, title: 'Smart Booking', desc: 'Online booking with auto-sync to your calendar. Reduce no-shows with automated reminders.' },
              { icon: <BarChart3 className="h-6 w-6" />, title: 'Analytics Dashboard', desc: 'Track profile views, bookings, and revenue. See exactly where your patients come from.' },
              { icon: <Users className="h-6 w-6" />, title: 'Patient Management', desc: 'Centralised patient records, treatment history, and follow-up scheduling.' },
              { icon: <Star className="h-6 w-6" />, title: 'Review Management', desc: 'Respond to reviews, showcase testimonials, and build your reputation.' },
              { icon: <ShieldCheck className="h-6 w-6" />, title: 'Insurance Integration', desc: 'Auto-verify patient insurance and enable direct billing through the platform.' },
              { icon: <Zap className="h-6 w-6" />, title: 'Instant Visibility', desc: 'Get listed on the UAE\'s most visited dental directory within 4 weeks.' },
            ].map((feature) => (
              <div key={feature.title} className="card-hover-amber p-6">
                <div className="w-12 h-12 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-700 mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-zinc-900 text-[15px]">{feature.title}</h3>
                <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-16 bg-[#fafafa] border-y border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 lg:px-6 text-center">
          <Star className="h-8 w-8 text-amber-500 fill-amber-500 mx-auto mb-4" />
          <blockquote className="text-lg md:text-xl text-zinc-700 font-medium leading-relaxed">
            &ldquo;Since joining AppointPanda, our bookings have increased by 65%. The quality of patients is exceptional — they come pre-informed and ready to commit.&rdquo;
          </blockquote>
          <p className="font-semibold text-zinc-900 text-sm mt-4">Dr. Amira Al Hashimi</p>
          <p className="text-zinc-400 text-xs">Pearl Dental Studio, Dubai Marina</p>
        </div>
      </section>

      {/* Onboarding steps */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">How onboarding works</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Sign up', desc: 'Create your clinic profile in minutes.' },
              { step: '02', title: 'Verify', desc: 'We verify your regulatory license.' },
              { step: '03', title: 'Optimise', desc: 'Add treatments, photos, and team.' },
              { step: '04', title: 'Go live', desc: 'Start receiving bookings within 4 weeks.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-700/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-amber-700 font-bold text-sm">{item.step}</span>
                </div>
                <h3 className="font-semibold text-zinc-900 text-sm">{item.title}</h3>
                <p className="text-zinc-500 text-xs mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#fafafa] border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Clinic FAQs</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: 'How long does it take to get listed?', a: 'Most clinics go live within 4 weeks. This includes verification of your licenses, photography (if needed), and profile optimisation.' },
              { q: 'Is there a minimum commitment?', a: 'No. You can cancel at any time. We\'re confident you\'ll stay once you see the results.' },
              { q: 'Do you charge commission on bookings?', a: 'No commission whatsoever. You keep 100% of treatment fees. Our model is subscription-based only.' },
              { q: 'Can I manage my own profile?', a: 'Absolutely. You get full access to your clinic dashboard where you can update treatments, prices, photos, and availability in real time.' },
            ].map((faq, i) => (
              <details key={i} className="group border border-zinc-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-amber-500/40">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none text-sm font-semibold text-zinc-900">
                  {faq.q}
                  <span className="text-zinc-400 group-open:rotate-90 transition-transform duration-200 shrink-0">
                    <ArrowRight className="h-4 w-4" />
                  </span>
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
      <section className="gradient-dark-hero py-16">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-white">Ready to grow your practice?</h2>
          <p className="text-zinc-400 text-sm mt-4">Join 500+ clinics already growing with {SITE_NAME}.</p>
          <Link
            href="#"
            className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-full transition-all duration-200"
          >
            List your clinic today <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
