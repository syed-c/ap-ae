import Head from 'next/head';
import Link from 'next/link';
import { ShieldCheck, Users, Star, Building2 } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';

export default function AboutPage() {
  return (
    <PageLayout>
      <Head>
        <title>About {SITE_NAME}.ae — UAE Dental Directory</title>
        <meta name="description" content={`${SITE_NAME}.ae is the UAE's leading dental directory, connecting 200,000+ patients with verified licensed clinics. Learn more about our mission.`} />
        <meta property="og:title" content={`About ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Connecting patients with verified dental care across the UAE." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="About us"
        title={`Trusted by 200,000+ patients`}
        subtitle={`${SITE_NAME}.ae is the UAE's most comprehensive dental directory — built to make finding quality dental care simple, transparent, and reliable.`}
      />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-zinc-900">Our mission</h2>
            <p className="text-zinc-600 text-sm mt-3 leading-relaxed">
              We believe that finding the right dentist should be as easy as booking a hotel. 
              Since our founding, we&apos;ve been on a mission to bring transparency, choice, and convenience 
              to dental care across the United Arab Emirates.
            </p>
            <p className="text-zinc-600 text-sm mt-3 leading-relaxed">
              Every clinic on our platform is verified against UAE regulatory licensing databases. 
              Prices are posted directly by clinics and updated monthly. Reviews come from confirmed patients only.
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: <Building2 className="h-5 w-5" />, stat: '500+', label: 'Clinic Partners' },
              { icon: <Users className="h-5 w-5" />, stat: '200k+', label: 'Monthly Patients' },
              { icon: <Star className="h-5 w-5" />, stat: '4.8★', label: 'Average Rating' },
              { icon: <ShieldCheck className="h-5 w-5" />, stat: '100%', label: 'Verified Listings' },
            ].map((item) => (
              <div key={item.label} className="bg-white border border-zinc-200 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-700">{item.icon}</div>
                <div>
                  <div className="text-2xl font-bold text-zinc-900">{item.stat}</div>
                  <div className="text-xs text-zinc-500">{item.label}</div>
                </div>
              </div>
            ))}
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-zinc-900">Our values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {[
                { title: 'Transparency', desc: 'Every price, every review, every credential — we put it all in the open.' },
                { title: 'Trust', desc: 'We verify every clinic, every license, every review. No shortcuts.' },
                { title: 'Accessibility', desc: 'Quality dental care should be easy to find, compare, and book — in English and Arabic.' },
              ].map((v) => (
                <div key={v.title} className="card-hover-amber p-5">
                  <h3 className="font-semibold text-zinc-900 text-sm">{v.title}</h3>
                  <p className="text-zinc-500 text-xs mt-2 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
