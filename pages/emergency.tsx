import Head from 'next/head';
import Link from 'next/link';
import { Phone, Clock, ShieldCheck, MapPin, Ambulance, CheckCircle, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { ClinicCard } from '@/components/ClinicCard';
import { clinics, SITE_NAME, SITE_DOMAIN, PHONE_NUMBER, PHONE_HREF } from '@/lib/site-data';

const BASE_URL = 'https://www.appointpanda.ae';

export default function EmergencyPage() {
  const emergencyClinics = clinics.filter(c => c.tags.includes('Emergency'));

  return (
    <PageLayout>
      <Head>
        <title>24/7 Emergency Dentist — {SITE_NAME}.ae</title>
        <meta name="description" content={`Need a dentist urgently? Call ${PHONE_NUMBER} for 24/7 emergency dental care across the UAE. Clinics open now.`} />
        <link rel="canonical" href={`${BASE_URL}/emergency/`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/emergency/`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:url" content={`${BASE_URL}/emergency/`} />
        <meta name="twitter:title" content={`24/7 Emergency Dentist — ${SITE_NAME}.ae`} />
        <meta name="twitter:description" content={`Need a dentist urgently? Call ${PHONE_NUMBER} for 24/7 emergency dental care across the UAE. Clinics open now.`} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/emergency/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/emergency/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
        <meta property="og:title" content={`24/7 Emergency Dentist — ${SITE_NAME}.ae`} />
        <meta property="og:description" content="Immediate dental care when you need it most." />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Urgent hero */}
      <section className="gradient-dark-hero py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-semibold mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Dental Emergency?
          </div>
          <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white leading-[1.1] max-w-3xl mx-auto">
            We can get you seen within the hour
          </h1>
          <p className="text-zinc-400 text-sm md:text-base mt-4 max-w-xl mx-auto">
            Our network of emergency-ready clinics keeps slots open daily. Call our 24/7 hotline and we&apos;ll find the nearest open clinic.
          </p>
          <a
            href={`tel:${PHONE_HREF}`}
            className="mt-6 inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-full transition-all duration-200 shadow-lg shadow-red-600/25"
          >
            <Phone className="h-5 w-5" />
            {PHONE_NUMBER}
          </a>
          <p className="text-zinc-500 text-xs mt-3">Free call &middot; Available 24/7 &middot; All emirates</p>
        </div>
      </section>

      {/* Emergency clinics */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Clinics open for emergencies now</h2>
            <p className="text-zinc-500 text-sm mt-2">These clinics have confirmed availability for emergency walk-ins today.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {emergencyClinics.map(clinic => (
              <ClinicCard key={clinic.slug} clinic={clinic} />
            ))}
          </div>
        </div>
      </section>

      {/* Triage checklist */}
      <section className="py-16 bg-[#fafafa] border-t border-zinc-200">
        <div className="max-w-3xl mx-auto px-4 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tight text-zinc-900">Is it an emergency?</h2>
            <p className="text-zinc-500 text-sm mt-2">Seek immediate care if you experience any of the following:</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Severe tooth pain lasting more than 2 days',
              'Swelling in the face or jaw',
              'Bleeding that won\'t stop after 30 minutes',
              'Knocked-out permanent tooth',
              'Cracked or fractured tooth with exposed nerve',
              'Dental abscess or pus discharge',
              'Lost filling or crown causing pain',
              'Trauma to the mouth from an accident',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-zinc-200 rounded-xl">
                <CheckCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <span className="text-sm text-zinc-700">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-sm text-amber-800 font-medium">
              <strong>Not sure?</strong> Call {PHONE_NUMBER} and speak with our triage team. We&apos;ll help you decide the best course of action.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
