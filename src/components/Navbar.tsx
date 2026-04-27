'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, ChevronDown, Search, User, Phone, Shield, ChevronRight, MapPin, Stethoscope, CalendarCheck, Star, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
import { useStates, useCities } from "@/hooks/useLocations";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { RiHospitalFill, RiShieldCheckFill, RiStarSmileFill } from "react-icons/ri";
import { FaTooth, FaStar } from "react-icons/fa";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { data: states } = useStates();
  const { data: cities } = useCities();
  const { data: siteSettings } = useSiteSettings();

  const { data: treatments } = useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const { data } = await supabaseAdmin
        .from('treatments')
        .select('name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(12);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  // Always use the uploaded logo from public folder, not from database settings
  const logoUrl = '/logo.png';

  const topAreas = cities?.slice(0, 6).map(c => ({
    name: c.name,
    slug: c.slug,
    stateSlug: (c as any).state?.slug || 'dubai',
  })) || [];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Slim top utility bar */}
      <div className="bg-foreground text-background hidden lg:block">
        <div className="container flex items-center justify-between h-8">
          <div className="flex items-center gap-5 text-[11px] font-medium">
            <Link href="/emergency-dentist/" className="flex items-center gap-1 text-background/70 hover:text-background transition-colors">
              <Phone className="h-3 w-3" />
              Emergency
            </Link>
            <Link href="/insurance/" className="flex items-center gap-1 text-background/70 hover:text-background transition-colors">
              <Shield className="h-3 w-3" />
              Insurance
            </Link>
            <Link href="/blog/" className="text-background/70 hover:text-background transition-colors">Blog</Link>
            <Link href="/faq/" className="text-background/70 hover:text-background transition-colors">FAQ</Link>
            <Link href="/contact/" className="text-background/70 hover:text-background transition-colors">Contact</Link>
          </div>
          <Link href="/list-your-practice/" className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
            Are you a dentist? List your practice →
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled
        ? 'bg-white/95 backdrop-blur-xl border-b border-gray-200/80 shadow-md shadow-black/[0.06]'
        : 'bg-white/90 backdrop-blur-md border-b border-gray-200/60'
        }`}>
        <div className="container">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={siteSettings?.siteName || 'AppointPanda'}
                  className="h-7 w-auto max-w-[140px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <FaTooth className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                      Appoint<span className="text-primary">Panda</span>
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {siteSettings?.siteTagline || 'UAE Dental Directory'}
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Desktop Right Section */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Desktop Navigation */}
              <div className="flex items-center gap-0.5">
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors">
                    Services
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-lg p-1.5 bg-card border border-border shadow-lg z-50">
                    <DropdownMenuItem asChild className="rounded-md font-semibold text-foreground cursor-pointer">
                      <Link href="/services/">All Services</Link>
                    </DropdownMenuItem>
                    <div className="h-px bg-border my-1" />
                    {(treatments || []).map((item) => (
                      <DropdownMenuItem key={item.slug} asChild className="rounded-md font-medium text-foreground/80 cursor-pointer">
                        <Link href={`/services/${item.slug}/`}>{item.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors">
                    Locations
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-lg p-1.5 bg-card border border-border shadow-lg z-50">
                    {states?.map((state) => (
                      <DropdownMenuItem key={state.slug} asChild className="rounded-md font-semibold text-foreground cursor-pointer">
                        <Link href={`/${state.slug}/`}>{state.name}</Link>
                      </DropdownMenuItem>
                    ))}
                    {states && states.length > 0 && topAreas.length > 0 && (
                      <div className="h-px bg-border my-1" />
                    )}
                    <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-1">Popular Areas</p>
                    {topAreas.map((area) => (
                      <DropdownMenuItem key={area.slug} asChild className="rounded-md font-medium text-foreground/80 cursor-pointer">
                        <Link href={`/${area.stateSlug}/${area.slug}/`}>{area.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link
                  href="/pricing/"
                  className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  Pricing
                </Link>
              </div>

              {/* Desktop Actions */}
              <div className="flex items-center gap-2 border-l border-border/60 pl-3">
                <Button variant="ghost" size="sm" className="text-sm font-medium text-foreground/70 hover:text-foreground" asChild>
                  <Link href="/list-your-practice/">For Dentists</Link>
                </Button>
                <Button variant="ghost" size="icon" className="rounded-lg text-foreground/60 hover:text-foreground h-9 w-9" asChild>
                  <Link href="/auth/"><User className="h-4 w-4" /></Link>
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 px-4"
                  onClick={() => router.push("/search/")}
                >
                  Find Dentist
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

{/* Mobile Menu - Modern & Organized (Light Theme) */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-border bg-white">
              <div className="px-4 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Quick Actions - Modern Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); router.push("/search/"); }}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    <RiStarSmileFill className="h-5 w-5 text-primary" />
                    <span className="text-xs font-semibold text-primary">Find Dentist</span>
                  </button>
                  <Link
                    href="/emergency-dentist/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                  >
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-xs font-semibold text-red-500">Emergency</span>
                  </Link>
                </div>

                {/* Services */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Services</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link href="/services/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" />
                      All Services
                    </Link>
                    {(treatments || []).slice(0, 3).map((item) => (
                      <Link
                        key={item.slug}
                        href={`/services/${item.slug}/`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <FaTooth className="h-3.5 w-3.5 text-primary" />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Locations</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link href="/search/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      All Emirates
                    </Link>
                    {(states || []).slice(0, 3).map((state) => (
                      <Link
                        key={state.slug}
                        href={`/${state.slug}/`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors"
                      >
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        {state.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Quick Links</p>
                  <Link href="/insurance/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                    Insurance Guide <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/pricing/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                    Pricing <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/about/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/50 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                    About Us <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Support Links */}
                <div className="space-y-1 pt-2 border-t border-border">
                  <Link href="/faq/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    FAQ <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/contact/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Contact <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href="/blog/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Blog <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" className="rounded-lg font-semibold border-border text-foreground bg-white hover:bg-muted h-10" asChild>
                    <Link href="/list-your-practice/" onClick={() => setMobileMenuOpen(false)}>
                      <RiHospitalFill className="h-4 w-4 mr-1.5" /> List Practice
                    </Link>
                  </Button>
                  <Button size="sm" className="rounded-lg bg-primary text-primary-foreground font-semibold h-10" onClick={() => { setMobileMenuOpen(false); router.push("/search/"); }}>
                    <Search className="h-4 w-4 mr-1.5" /> Find Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
