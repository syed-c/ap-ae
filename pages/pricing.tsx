import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Sparkles, Building2, Star } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { SITE_NAME } from '@/lib/site-data';

const plans = [
  {
    name: 'Starter', price: 'Free', icon: <Sparkles className="h-5 w-5" />,
    features: ['Single clinic profile', 'Basic listing on directory', 'Manual profile updates', 'Email support'],
    cta: 'Get started', featured: false,
  },
  {
    name: 'Growth', price: 'AED 499', period: '/mo', icon: <Star className="h-5 w-5" />,
    features: ['Everything in Starter', 'Online booking & calendar sync', 'Analytics dashboard', 'Review management', 'Insurance auto-verify', 'Priority support'],
    cta: 'Start free trial', featured: true,
  },
  {
    name: 'Network', price: 'AED 1,499', period: '/mo', icon: <Building2 className="h-5 w-5" />,
    features: ['Everything in Growth', 'Priority placement in search', 'Multi-branch management', 'Dedicated account manager', 'Featured clinic badge', 'API access', 'White-label reports'],
    cta: 'Contact sales', featured: false,
  },
];

export default function PricingPage() {
  return (
    <PageLayout>
      <Head>
        <title>Pricing — {SITE_NAME}.ae</title>
        <meta name="description" content={`Simple, transparent pricing for dental clinics. From free listing to premium multi-branch plans with analytics, booking, and priority placement.`} />
        <meta property="og:title" content={`Pricing — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Simple pricing for dental clinics." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="Simple, transparent"
        title="Pricing for every practice"
        subtitle="From a free starter listing to a full growth platform. No commission, no hidden fees."
      >
        <div className="flex flex-wrap justify-center gap-4 text-sm text-zinc-400 mt-4">
          <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> No setup fee</span>
          <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Cancel anytime</span>
          <span className="flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Zero commission</span>
        </div>
      </PageHero>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative bg-white border rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${plan.featured ? 'border-amber-500 shadow-md ring-1 ring-amber-500/20' : 'border-zinc-200'}`}>
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-600 text-white text-[10px] font-semibold rounded-full uppercase tracking-wider">
                  Most popular
                </div>
              )}
              <div className="flex items-center gap-2 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.featured ? 'bg-amber-700/10 text-amber-700' : 'bg-zinc-100 text-zinc-500'}`}>
                  {plan.icon}
                </div>
                <span className="font-semibold text-zinc-900">{plan.name}</span>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-bold text-zinc-900">{plan.price}</span>
                {plan.period && <span className="text-zinc-400 text-sm">{plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/for-clinics"
                className={`w-full inline-flex items-center justify-center gap-2 h-11 px-4 text-sm font-semibold rounded-full transition-all duration-200 ${
                  plan.featured
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900'
                }`}
              >
                {plan.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* Feature comparison table */}
        <div className="mt-16">
          <h2 className="text-2xl font-semibold text-zinc-900 text-center mb-8">Compare plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-3 px-4 font-semibold text-zinc-900">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-zinc-900">Starter</th>
                  <th className="text-center py-3 px-4 font-semibold text-amber-700">Growth</th>
                  <th className="text-center py-3 px-4 font-semibold text-zinc-900">Network</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Clinic profile', '✓', '✓', '✓'],
                  ['Directory listing', 'Basic', 'Enhanced', 'Featured'],
                  ['Online booking', '—', '✓', '✓'],
                  ['Calendar sync', '—', '✓', '✓'],
                  ['Analytics dashboard', '—', '✓', '✓'],
                  ['Review management', '—', '✓', '✓'],
                  ['Insurance auto-verify', '—', '✓', '✓'],
                  ['Priority placement', '—', '—', '✓'],
                  ['Multi-branch', '—', '—', '✓'],
                  ['Dedicated manager', '—', '—', '✓'],
                  ['API access', '—', '—', '✓'],
                ].map((row, i) => (
                  <tr key={i} className="border-b border-zinc-100">
                    <td className="py-3 px-4 text-zinc-700">{row[0]}</td>
                    {[1, 2, 3].map(j => (
                      <td key={j} className={`text-center py-3 px-4 ${row[j] === '✓' ? 'text-emerald-600' : row[j] === '—' ? 'text-zinc-300' : 'text-zinc-900'}`}>
                        {row[j] === '✓' ? <CheckCircle className="h-4 w-4 inline" /> : row[j]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
