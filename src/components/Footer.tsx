import { forwardRef } from "react";
import Link from "next/link";
import {
  Facebook, Instagram, Twitter, Linkedin, Youtube,
  Mail, Phone, MapPin, Heart, ChevronRight,
  ShieldCheck, Shield, Lock, Star, Stethoscope
} from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ACTIVE_STATES } from "@/lib/constants/activeStates";

const TOP_SERVICES = [
  { name: "Dental Implants", slug: "dental-implants" },
  { name: "Teeth Whitening", slug: "teeth-whitening" },
  { name: "Root Canal Treatment", slug: "root-canal-treatment" },
  { name: "Invisalign", slug: "invisalign" },
  { name: "Dental Veneers", slug: "dental-veneers" },
  { name: "Teeth Cleaning", slug: "teeth-cleaning" },
];

const company = [
  { name: "About", path: "/about/" },
  { name: "How It Works", path: "/how-it-works/" },
  { name: "Pricing", path: "/pricing/" },
  { name: "Contact", path: "/contact/" },
  { name: "FAQs", path: "/faq/" },
  { name: "Blog", path: "/blog/" },
];

const resources = [
  { name: "Find Dentists", path: "/search/" },
  { name: "Insurance Guide", path: "/insurance/" },
  { name: "Claim Profile", path: "/claim-profile/" },
  { name: "List Practice", path: "/list-your-practice/" },
  { name: "All Services", path: "/services/" },
  { name: "Sitemap", path: "/sitemap/" },
];

const legal = [
  { name: "Privacy Policy", path: "/privacy/" },
  { name: "Terms of Service", path: "/terms/" },
  { name: "Editorial Policy", path: "/editorial-policy/" },
  { name: "Medical Review", path: "/medical-review-policy/" },
  { name: "Verification", path: "/verification-policy/" },
];

const POPULAR_DUBAI_AREAS = [
  { name: "Jumeirah", slug: "jumeirah" },
  { name: "Marina", slug: "marina" },
  { name: "Downtown", slug: "downtown" },
  { name: "Deira", slug: "dera" },
  { name: "Al Barsha", slug: "al-barsha" },
  { name: "Business Bay", slug: "business-bay" },
  { name: "JLT", slug: "jlt" },
  { name: "Mirdif", slug: "mirdif" },
];

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const { data: siteSettings } = useSiteSettings();

    const contactEmail = siteSettings?.contactDetails?.support_email || '';
    const contactPhone = siteSettings?.contactDetails?.support_phone || siteSettings?.contactDetails?.booking_phone || '';
    const copyrightText = siteSettings?.copyrightText || `© ${new Date().getFullYear()} All rights reserved.`;

    const socialLinks = siteSettings?.socialLinks || {};
    const socialIcons = [
      { icon: Facebook, url: socialLinks.facebook, label: 'Facebook' },
      { icon: Instagram, url: socialLinks.instagram, label: 'Instagram' },
      { icon: Twitter, url: socialLinks.twitter, label: 'Twitter' },
      { icon: Linkedin, url: socialLinks.linkedin, label: 'LinkedIn' },
      { icon: Youtube, url: socialLinks.youtube, label: 'YouTube' },
    ].filter(s => s.url && s.url.trim() !== '');

    return (
      <footer ref={ref} {...props} className="bg-slate-950 text-white/80 relative">
        {/* Trust strip - modern glassmorphism */}
        <div className="border-b border-white/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-wrap justify-center md:justify-between gap-4 md:gap-8 py-3 md:py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Verified Clinics</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">Licensed Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">Data Privacy</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Free for Patients</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main footer */}
        <div className="container py-8 md:py-10 px-4 md:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">

            {/* Brand */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-2 mb-4">
                <img
                  src="/logo.png"
                  alt={siteSettings?.siteName || 'AppointPanda'}
                  className="h-6 md:h-7 w-auto max-w-[120px] object-contain"
                />
              </Link>
              <p className="text-white/50 mb-4 text-xs md:text-sm leading-relaxed max-w-xs">
                A patient-first dental directory. Find trusted dentists with transparent pricing and real reviews.
              </p>

              <div className="space-y-1.5 mb-4">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-xs text-white/50 hover:text-primary transition-colors">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{contactEmail}</span>
                  </a>
                )}
                {contactPhone && (
                  <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-xs text-white/50 hover:text-primary transition-colors">
                    <Phone className="h-3 w-3" />
                    {contactPhone}
                  </a>
                )}
              </div>

              <div className="flex gap-1.5">
                {socialIcons.length > 0 ? (
                  socialIcons.map((social, i) => (
                    <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                      className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all">
                      <social.icon className="h-3.5 w-3.5" />
                    </a>
                  ))
                ) : (
                  [Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                    <span key={i} className="h-8 w-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center opacity-25">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Company</h4>
              <ul className="space-y-1.5">
                {company.map((item) => (
                  <li key={item.path}>
                    <Link href={item.path} className="text-xs md:text-sm text-white/50 hover:text-primary transition-colors">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-1.5">
                {resources.map((item) => (
                  <li key={item.path}>
                    <Link href={item.path} className="text-xs md:text-sm text-white/50 hover:text-primary transition-colors">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locations */}
            <div className="col-span-2 md:col-span-4 lg:col-span-2">
              <h4 className="text-xs font-bold text-white mb-3 uppercase tracking-wider">Find Dentists</h4>
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">By Emirate</p>
                  <ul className="space-y-1">
                    {ACTIVE_STATES.map((emirate) => (
                      <li key={emirate.slug}>
                        <Link href={`/${emirate.slug}/`} className="text-xs text-white/50 hover:text-primary transition-colors flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-white/20" />
                          {emirate.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-1.5">Popular Areas</p>
                  <ul className="space-y-1">
                    {POPULAR_DUBAI_AREAS.map((area) => (
                      <li key={area.slug}>
                        <Link href={`/dubai/${area.slug}/`} className="text-xs text-white/50 hover:text-primary transition-colors">
                          {area.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Services row */}
          <div className="border-t border-white/5 mt-6 md:mt-8 pt-4 md:pt-6">
            <nav aria-label="Dental Services" className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <span className="text-xs font-semibold text-white/30 uppercase mr-1">Services:</span>
              {TOP_SERVICES.map((service, idx) => (
                <Link key={service.slug} href={`/services/${service.slug}/`} className="text-xs text-white/40 hover:text-primary transition-colors">
                  {service.name}{idx < TOP_SERVICES.length - 1 && <span className="text-white/10 ml-4">·</span>}
                </Link>
              ))}
            </nav>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-white/5 mt-4 pt-3">
            <p className="text-[10px] text-white/25 text-center max-w-2xl mx-auto leading-relaxed">
              Pricing ranges displayed are estimates. Clinics set their own ranges. Please confirm final treatment plans and costs at your consultation.
              Aligned with local best practices as per Dubai Health Authority (DHA), Department of Health Abu Dhabi (DoH), and MOHAP guidelines.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-2 md:gap-3 py-3">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-2 gap-y-1 text-[10px] md:text-[11px] text-white/35">
                <span>{copyrightText}</span>
                {legal.map((item, idx) => (
                  <span key={item.path} className="flex items-center">
                    <span className="text-white/10 mx-2">|</span>
                    <Link href={item.path} className="hover:text-white/60 transition-colors">{item.name}</Link>
                  </span>
                ))}
              </div>

              <Link
                href="/list-your-practice/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
              >
                <Stethoscope className="h-3 w-3" />
                List Your Practice
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  });

Footer.displayName = 'Footer';
