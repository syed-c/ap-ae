'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  Phone,
  MapPin,
  ArrowRight,
  ChevronRight,
  Send,
  Stethoscope,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useTreatments } from '@/hooks/useTreatments';
import { useStates } from '@/hooks/useLocations';

const COMPANY_LINKS = [
  { label: 'About Us', href: '/about/' },
  { label: 'How It Works', href: '/how-it-works/' },
  { label: 'Pricing', href: '/pricing/' },
  { label: 'Contact', href: '/contact/' },
  { label: 'Blog', href: '/blog/' },
  { label: 'Sitemap', href: '/sitemap/' },
];

const PATIENT_LINKS = [
  { label: 'Find a Dentist', href: '/search/' },
  { label: 'Emergency Dentist', href: '/emergency-dentist/' },
  { label: 'Insurance Guide', href: '/insurance/' },
  { label: 'Dental Treatments', href: '/services/' },
  { label: 'FAQ', href: '/faq/' },
  { label: 'Review Policy', href: '/medical-review-policy/' },
];

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
};

export function Footer() {
  const { data: settings } = useSiteSettings();
  const { data: treatments } = useTreatments();
  const { data: states } = useStates();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const popularServices = useMemo(() => (treatments || []).slice(0, 12), [treatments]);
  const browseLinks = useMemo(() => (states || []).slice(0, 7), [states]);

  const socialLinks = settings?.socialLinks || {};
  const contact = settings?.contactDetails || {};

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-[#101010] border-t border-[rgba(45,156,132,0.12)]">
      {/* Newsletter */}
      <div className="border-b border-[#1E1E1E]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-semibold text-lg">Stay updated</h3>
              <p className="text-[#62626B] text-sm mt-1">
                Get the latest dental care insights and offers.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex w-full lg:w-auto gap-2">
              <div className="relative flex-1 lg:w-72">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#62626B]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-10 pl-10 pr-4 bg-[#0A0A0A] border border-[#1E1E1E] rounded-lg text-white text-sm placeholder:text-[#62626B] focus:outline-none focus:border-[#2D9C84] transition-all duration-300"
                  required
                />
              </div>
              <Button type="submit" variant="default" className="shrink-0">
                {subscribed ? 'Subscribed!' : <><Send className="h-4 w-4" /> Subscribe</>}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-10 lg:py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#2D9C84] flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">{settings?.siteName || 'AppointPanda'}</span>
            </Link>
            <p className="text-[#62626B] text-sm leading-relaxed mb-4">
              {settings?.siteTagline || 'UAE Dental Directory. Find and book the best dentists across all emirates.'}
            </p>
            <div className="flex items-center gap-2">
              {(Object.entries(socialLinks) as [string, string][]).filter(([, v]) => v).slice(0, 5).map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg bg-[#0A0A0A] border border-[#1E1E1E] flex items-center justify-center text-[#62626B] hover:text-[#2D9C84] hover:border-[#2D9C84] transition-all duration-300"
                >
                  {SOCIAL_ICONS[key] || null}
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#62626B] hover:text-[#2D9C84] text-sm transition-all duration-300 flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Patients Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Patients</h4>
            <ul className="space-y-2.5">
              {PATIENT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[#62626B] hover:text-[#2D9C84] text-sm transition-all duration-300 flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Browse UAE */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Browse UAE</h4>
            <ul className="space-y-2.5">
              {browseLinks.map((state) => (
                <li key={state.id}>
                  <Link
                    href={`/${state.slug}/`}
                    className="text-[#62626B] hover:text-[#2D9C84] text-sm transition-all duration-300 flex items-center gap-1"
                  >
                    <MapPin className="h-3 w-3 shrink-0" />
                    {state.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contact</h4>
            <ul className="space-y-3 text-sm text-[#62626B]">
              {contact.support_phone && (
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-[#2D9C84]" />
                  <a href={`tel:${contact.support_phone}`} className="hover:text-white transition-all duration-300">
                    {contact.support_phone}
                  </a>
                </li>
              )}
              {contact.support_email && (
                <li className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-[#2D9C84]" />
                  <a href={`mailto:${contact.support_email}`} className="hover:text-white transition-all duration-300">
                    {contact.support_email}
                  </a>
                </li>
              )}
              {contact.address_line1 && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#2D9C84]" />
                  <span>{contact.address_line1}{contact.address_line2 ? `, ${contact.address_line2}` : ''}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Popular Services Pills */}
        {popularServices.length > 0 && (
          <div className="mt-10 pt-8 border-t border-[#1E1E1E]">
            <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Popular Treatments</h4>
            <div className="flex flex-wrap gap-2">
              {popularServices.map((treatment) => (
                <Link
                  key={treatment.id}
                  href={`/treatment/${treatment.slug}/`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#62626B] bg-[rgba(22,22,22,0.85)] backdrop-blur-xl border border-[rgba(45,156,132,0.12)] rounded-full hover:text-white hover:border-[rgba(45,156,132,0.4)] hover:bg-[rgba(45,156,132,0.1)] transition-all duration-300"
                >
                  {treatment.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#1E1E1E]">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[#62626B] text-xs">{settings?.copyrightText || '© 2026 AppointPanda. All rights reserved.'}</p>
          <div className="flex items-center gap-4 text-xs text-[#62626B]">
            <Link href="/privacy/" className="hover:text-[#2D9C84] transition-all duration-300">Privacy</Link>
            <Link href="/terms/" className="hover:text-[#2D9C84] transition-all duration-300">Terms</Link>
            <Link href="/editorial-policy/" className="hover:text-[#2D9C84] transition-all duration-300">Editorial Policy</Link>
            <Link href="/verification-policy/" className="hover:text-[#2D9C84] transition-all duration-300">Verification</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
