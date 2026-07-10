'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Facebook, Instagram, Twitter, Linkedin, MapPin, Mail, ShieldCheck, Globe, Sparkles, ChevronRight,
} from 'lucide-react';
import { SITE_NAME, SITE_TAGLINE, specialties, emirates } from '@/lib/site-data';

const PATIENT_LINKS = [
  { label: 'Find a clinic', href: '/find-clinics' },
  { label: 'Specialties', href: '/specialties' },
  { label: 'Insurance', href: '/insurance' },
  { label: 'Emergency', href: '/emergency' },
  { label: 'Reviews', href: '/reviews' },
];

const CLINIC_LINKS = [
  { label: 'List your clinic', href: '/for-clinics' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Partner portal', href: '/for-clinics' },
  { label: 'Resources', href: '/blog' },
];

const COMPANY_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
  { label: 'Careers', href: '/about' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-zinc-950 text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="size-7 rounded-md bg-zinc-800 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-white font-bold text-lg">{SITE_NAME}<span className="text-amber-600 font-semibold">.ae</span></span>
            </Link>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6 max-w-xs">
              {SITE_TAGLINE} Connecting 200,000+ patients with verified clinics across the UAE.
            </p>

            {/* App Store Buttons */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-zinc-300 mb-3">Get the app</p>
              <div className="flex gap-3">
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                  <div>
                    <div className="text-[9px] text-zinc-500 font-normal">Download on</div>
                    <div className="text-xs font-bold">App Store</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-semibold text-zinc-300 hover:border-zinc-700 transition-colors cursor-pointer">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
                  <div>
                    <div className="text-[9px] text-zinc-500 font-normal">Get it on</div>
                    <div className="text-xs font-bold">Google Play</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2">
              {[
                { icon: <Facebook className="h-4 w-4" />, href: '#' },
                { icon: <Instagram className="h-4 w-4" />, href: '#' },
                { icon: <Twitter className="h-4 w-4" />, href: '#' },
                { icon: <Linkedin className="h-4 w-4" />, href: '#' },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 hover:text-amber-400 hover:border-zinc-700 transition-all duration-300">
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          <div>
            <h4 className="text-zinc-200 font-semibold text-sm mb-4">Patients</h4>
            <ul className="space-y-2.5">
              {PATIENT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-200 font-semibold text-sm mb-4">Clinics</h4>
            <ul className="space-y-2.5">
              {CLINIC_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-200 font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-zinc-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-1">
                    <ChevronRight className="h-3 w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-zinc-200 font-semibold text-sm mb-4">Emirates</h4>
            <ul className="space-y-2.5">
              {emirates.slice(0, 7).map((e) => (
                <li key={e.slug}>
                  <Link href={`/emirates/${e.slug}`} className="text-zinc-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {e.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Newsletter + Popular Specialties */}
      <div className="border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-zinc-200 font-semibold text-sm">Stay informed</h3>
              <p className="text-zinc-500 text-xs mt-1">Dental health tips, curated monthly.</p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto gap-2">
              <div className="relative flex-1 lg:w-64">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-10 pl-10 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-amber-600 transition-colors"
                  required
                />
              </div>
              <button type="submit" className="inline-flex items-center px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-full transition-all duration-200">
                {subscribed ? 'Subscribed!' : 'Join'}
              </button>
            </form>
          </div>

          {/* Popular Specialties */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <h4 className="text-zinc-400 text-[11px] font-semibold uppercase tracking-widest mb-3">Popular specialties</h4>
            <div className="flex flex-wrap gap-2">
              {specialties.slice(0, 10).map((item) => (
                <Link
                  key={item.slug}
                  href={`/specialties/${item.slug}`}
                  className="inline-flex items-center px-3 py-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-full hover:text-amber-400 hover:border-amber-700 transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-zinc-500 text-xs">
            &copy; 2026 AppointPanda Middle East FZ-LLC &middot; All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <Link href="/privacy" className="hover:text-amber-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-amber-400 transition-colors">Terms</Link>
            <Link href="/editorial-policy" className="hover:text-amber-400 transition-colors">Cookies</Link>
            <Link href="/sitemap" className="hover:text-amber-400 transition-colors">Sitemap</Link>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-zinc-600 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              All clinics licensed & verified
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              UAE &middot; English
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
