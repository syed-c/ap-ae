import Head from 'next/head';
import Link from 'next/link';
import { Stethoscope, Sparkles, Syringe, ArrowLeftRight, Baby, Activity, Scissors, Sun, Gem, Ambulance, Palette, Search } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { specialties, SITE_NAME, SITE_DOMAIN } from '@/lib/site-data';

const BASE_URL = 'https://www.appointpanda.ae';

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
  Search: <Search className="h-6 w-6" />,
};

export default function SpecialtiesPage() {
  return (
    <PageLayout>
      <Head>
        <title>Dental Specialties — {SITE_NAME}.ae</title>
        <meta name="description" content={`Browse all dental specialties available across UAE clinics. From general dentistry to implants, veneers, and emergency care.`} />
        <link rel="canonical" href={`${BASE_URL}/specialties/`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/specialties/`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:url" content={`${BASE_URL}/specialties/`} />
        <meta name="twitter:title" content={`Dental Specialties — ${SITE_NAME}.ae`} />
        <meta name="twitter:description" content={`Browse all dental specialties available across UAE clinics. From general dentistry to implants, veneers, and emergency care.`} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/specialties/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/specialties/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
        <meta property="og:title" content={`Dental Specialties — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Find the right specialist for your needs." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="Find by treatment"
        title="Dental specialties"
        subtitle="From routine check-ups to full smile makeovers — find the right specialist for your needs."
      />

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {specialties.map((spec) => {
            const IconComponent = ICON_MAP[spec.icon] || <Stethoscope className="h-6 w-6" />;
            return (
              <Link key={spec.slug} href={`/specialties/${spec.slug}`} className="card-hover-amber p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-700/10 flex items-center justify-center text-amber-700 shrink-0">
                  {IconComponent}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900 text-[15px]">{spec.name}</h3>
                  <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{spec.description}</p>
                  <p className="text-amber-700 text-[11px] font-semibold mt-1.5">{spec.count} clinics</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
}
