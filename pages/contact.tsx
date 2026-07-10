import { useState } from 'react';
import Head from 'next/head';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { PageHero } from '@/components/layout/PageHero';
import { SITE_NAME, SITE_DOMAIN, PHONE_NUMBER, PHONE_HREF } from '@/lib/site-data';

const BASE_URL = 'https://www.appointpanda.ae';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emirate, setEmirate] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <PageLayout>
      <Head>
        <title>Contact Us — {SITE_NAME}.ae</title>
        <meta name="description" content={`Get in touch with the ${SITE_NAME}.ae team. Call ${PHONE_NUMBER}, email us, or fill out our contact form.`} />
        <link rel="canonical" href={`${BASE_URL}/contact/`} />
        <meta name="robots" content="index, follow" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${BASE_URL}/contact/`} />
        <meta property="og:image" content={`${BASE_URL}/og-image.png`} />
        <meta property="og:site_name" content="AppointPanda" />
        <meta property="og:locale" content="en_AE" />
        <meta name="twitter:url" content={`${BASE_URL}/contact/`} />
        <meta name="twitter:title" content={`Contact Us — ${SITE_NAME}.ae`} />
        <meta name="twitter:description" content={`Get in touch with the ${SITE_NAME}.ae team. Call ${PHONE_NUMBER}, email us, or fill out our contact form.`} />
        <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
        <link rel="alternate" hrefLang="en-AE" href={`${BASE_URL}/contact/`} />
        <link rel="alternate" hrefLang="x-default" href={`${BASE_URL}/contact/`} />
        <link rel="sitemap" type="application/xml" href={`${BASE_URL}/sitemap.xml`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <PageHero
        kicker="Get in touch"
        title="Contact us"
        subtitle="We're here to help. Whether you're a patient or a clinic, we'll respond within 24 hours."
      />

      <div className="max-w-4xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 bg-white border border-zinc-200 rounded-2xl">
              <Phone className="h-5 w-5 text-amber-700 mt-0.5" />
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">Phone</h3>
                <a href={`tel:${PHONE_HREF}`} className="text-zinc-500 text-sm hover:text-amber-700 transition-colors">{PHONE_NUMBER}</a>
                <p className="text-zinc-400 text-xs mt-0.5">24/7 emergency hotline</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white border border-zinc-200 rounded-2xl">
              <Mail className="h-5 w-5 text-amber-700 mt-0.5" />
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">Email</h3>
                <a href="mailto:hello@appointpanda.ae" className="text-zinc-500 text-sm hover:text-amber-700 transition-colors">hello@appointpanda.ae</a>
                <p className="text-zinc-400 text-xs mt-0.5">We respond within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-white border border-zinc-200 rounded-2xl">
              <MapPin className="h-5 w-5 text-amber-700 mt-0.5" />
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">Office</h3>
                <p className="text-zinc-500 text-sm">Dubai Internet City</p>
                <p className="text-zinc-400 text-xs mt-0.5">Dubai, United Arab Emirates</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-6">
            {sent ? (
              <div className="text-center py-8">
                <Send className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-semibold text-zinc-900">Message sent!</h3>
                <p className="text-zinc-500 text-sm mt-2">We'll get back to you within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                />
                <select
                  value={emirate}
                  onChange={e => setEmirate(e.target.value)}
                  required
                  className="w-full h-11 px-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select your emirate</option>
                  <option value="dubai">Dubai</option>
                  <option value="abu-dhabi">Abu Dhabi</option>
                  <option value="sharjah">Sharjah</option>
                  <option value="ajman">Ajman</option>
                  <option value="ras-al-khaimah">Ras Al Khaimah</option>
                  <option value="fujairah">Fujairah</option>
                  <option value="umm-al-quwain">Umm Al Quwain</option>
                </select>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all resize-none"
                />
                <button
                  type="submit"
                  className="w-full h-11 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-full transition-all duration-200"
                >
                  <Send className="h-4 w-4" /> Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
