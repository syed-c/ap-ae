import { forwardRef } from "react";
import { Link } from "react-router-dom";
import {
  Facebook, Instagram, Twitter, Linkedin, Youtube,
  Mail, Phone, MapPin, Heart, ChevronRight, Shield, CheckCircle, Lock,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

interface CityData {
  name: string;
  slug: string;
  dentist_count: number;
}

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  (props, ref) => {
    const { data: siteSettings } = useSiteSettings();

    const { data: areasByEmirate } = useQuery({
      queryKey: ["footer-areas"],
      queryFn: async () => {
        const result: Record<string, CityData[]> = {};
        for (const emirate of ACTIVE_STATES.filter(s => ['dubai', 'sharjah'].includes(s.slug))) {
          const { data } = await supabase
            .from("cities")
            .select("name, slug, dentist_count, states!inner(slug)")
            .eq("is_active", true)
            .eq("states.slug", emirate.slug)
            .order("name", { ascending: true })
            .limit(12);
          result[emirate.slug] = (data || []).map(c => ({
            name: c.name,
            slug: c.slug,
            dentist_count: c.dentist_count || 0,
          }));
        }
        return result;
      },
      staleTime: 1000 * 60 * 30,
    });

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
      <footer ref={ref} {...props} className="bg-foreground text-background/80 relative">
        {/* Trust strip */}
        <div className="border-b border-background/10">
          <div className="container py-4 px-4 md:px-8">
            <div className="flex flex-wrap justify-center gap-8 md:gap-14">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Verified Clinics</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium">Licensed Professionals</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
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
        <div className="container py-10 md:py-12 px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">

            {/* Brand */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Link to="/" className="inline-flex items-center gap-2 mb-4">
                <img
                  src="/logo.png"
                  alt={siteSettings?.siteName || 'AppointPanda'}
                  className="h-7 w-auto max-w-[140px] object-contain"
                />
              </Link>
              <p className="text-background/50 mb-5 text-sm leading-relaxed max-w-xs">
                A patient-first dental directory. Find trusted dentists with transparent pricing and real reviews.
              </p>

              <div className="space-y-2 mb-4">
                {contactEmail && (
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-xs text-background/50 hover:text-primary transition-colors">
                    <Mail className="h-3.5 w-3.5" />
                    {contactEmail}
                  </a>
                )}
                {contactPhone && (
                  <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 text-xs text-background/50 hover:text-primary transition-colors">
                    <Phone className="h-3.5 w-3.5" />
                    {contactPhone}
                  </a>
                )}
              </div>

              <div className="flex gap-2">
                {socialIcons.length > 0 ? (
                  socialIcons.map((social, i) => (
                    <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" aria-label={social.label}
                      className="h-8 w-8 rounded-md bg-background/5 border border-background/10 flex items-center justify-center hover:bg-primary/20 hover:border-primary/40 hover:text-primary transition-all">
                      <social.icon className="h-3.5 w-3.5" />
                    </a>
                  ))
                ) : (
                  [Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
                    <span key={i} className="h-8 w-8 rounded-md bg-background/5 border border-background/10 flex items-center justify-center opacity-25">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-xs font-bold text-background mb-4 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2">
                {company.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-sm text-background/50 hover:text-primary transition-colors">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-xs font-bold text-background mb-4 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2">
                {resources.map((item) => (
                  <li key={item.path}>
                    <Link to={item.path} className="text-sm text-background/50 hover:text-primary transition-colors">{item.name}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Locations */}
            <div className="col-span-2 lg:col-span-2">
              <h4 className="text-xs font-bold text-background mb-4 uppercase tracking-wider">Find Dentists</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-semibold text-background/30 uppercase tracking-wider mb-2">By Emirate</p>
                  <ul className="space-y-1.5">
                    {ACTIVE_STATES.map((emirate) => (
                      <li key={emirate.slug}>
                        <Link to={`/${emirate.slug}/`} className="text-sm text-background/50 hover:text-primary transition-colors flex items-center gap-1.5">
                          <MapPin className="h-3 w-3 text-background/20" />
                          {emirate.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-background/30 uppercase tracking-wider mb-2">Popular Areas</p>
                  <ul className="space-y-1.5">
                    {(areasByEmirate?.['dubai'] || []).slice(0, 8).map((area) => (
                      <li key={area.slug}>
                        <Link to={`/dubai/${area.slug}/`} className="text-sm text-background/50 hover:text-primary transition-colors">
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
          <div className="border-t border-background/10 mt-8 pt-6">
            <nav aria-label="Dental Services" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              <span className="text-xs font-semibold text-background/30 uppercase">Services:</span>
              {TOP_SERVICES.map((service, idx) => (
                <Link key={service.slug} to={`/services/${service.slug}/`} className="text-xs text-background/40 hover:text-primary transition-colors">
                  {service.name}{idx < TOP_SERVICES.length - 1 && <span className="text-background/15 ml-5">·</span>}
                </Link>
              ))}
            </nav>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-background/10 mt-5 pt-4">
            <p className="text-[10px] text-background/25 text-center max-w-3xl mx-auto leading-relaxed">
              Pricing ranges displayed are estimates. Clinics set their own ranges. Please confirm final treatment plans and costs at your consultation.
              Aligned with local best practices as per Dubai Health Authority (DHA), Department of Health Abu Dhabi (DoH), and MOHAP guidelines.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-background/10">
          <div className="container py-4 px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-[11px] text-background/35">
                <span>{copyrightText}</span>
                {legal.map((item, idx) => (
                  <span key={item.path}>
                    <span className="text-background/15 mr-3">|</span>
                    <Link to={item.path} className="hover:text-background/60 transition-colors">{item.name}</Link>
                  </span>
                ))}
              </div>

              <Link
                to="/list-your-practice/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 border border-primary/25 text-primary text-xs font-semibold hover:bg-primary/20 transition-all"
              >
                For Dentists: List Your Practice
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  });

Footer.displayName = 'Footer';
