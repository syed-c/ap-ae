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
  { label: 'Resources', href: '/blog' },
];

const COMPANY_LINKS = [
  { label: 'About us', href: '/about' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
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
              {SITE_TAGLINE} Connecting patients with dental clinics across the UAE.
            </p>


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
                  <Link href={`/${e.slug}/`} className="text-zinc-500 hover:text-amber-400 text-sm transition-colors flex items-center gap-1">
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
