'use client';

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, Search, User, Phone, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRoutePrefetch } from "@/hooks/useRoutePrefetch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useStates, useCities } from "@/hooks/useLocations";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const { data: states } = useStates();
  const { data: cities } = useCities();
  const { data: siteSettings } = useSiteSettings();
  const { onMouseEnter, onMouseLeave } = useRoutePrefetch();

  const { data: treatments } = useQuery({
    queryKey: ['navbar-treatments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('name, slug')
        .eq('is_active', true)
        .order('display_order')
        .limit(12);
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
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
            <Link to="/emergency-dentist" className="flex items-center gap-1 text-background/70 hover:text-background transition-colors" onMouseEnter={() => onMouseEnter('/emergency-dentist')} onMouseLeave={onMouseLeave}>
              <Phone className="h-3 w-3" />
              Emergency
            </Link>
            <Link to="/insurance" className="flex items-center gap-1 text-background/70 hover:text-background transition-colors" onMouseEnter={() => onMouseEnter('/insurance')} onMouseLeave={onMouseLeave}>
              <Shield className="h-3 w-3" />
              Insurance
            </Link>
            <Link to="/blog" className="text-background/70 hover:text-background transition-colors" onMouseEnter={() => onMouseEnter('/blog')} onMouseLeave={onMouseLeave}>Blog</Link>
            <Link to="/faq" className="text-background/70 hover:text-background transition-colors" onMouseEnter={() => onMouseEnter('/faq')} onMouseLeave={onMouseLeave}>FAQ</Link>
            <Link to="/contact" className="text-background/70 hover:text-background transition-colors" onMouseEnter={() => onMouseEnter('/contact')} onMouseLeave={onMouseLeave}>Contact</Link>
          </div>
          <Link to="/list-your-practice" className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors">
            Are you a dentist? List your practice →
          </Link>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled 
          ? 'bg-card/98 backdrop-blur-sm border-b border-border shadow-sm' 
          : 'bg-card border-b border-border/60'
      }`}>
        <div className="container">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={siteSettings?.siteName || 'AppointPanda'} 
                  className="h-8 w-auto max-w-[160px] object-contain"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <span className="text-xs font-bold">AP</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-foreground leading-none">
                      Appoint<span className="text-primary">Panda</span>
                    </span>
                    <span className="text-[9px] text-muted-foreground font-medium">
                      {siteSettings?.siteTagline || 'Dental Directory'}
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Center: Search trigger (desktop) */}
            <button
              onClick={() => navigate("/search")}
              className="hidden lg:flex items-center gap-2 bg-muted/60 hover:bg-muted border border-border/60 rounded-lg px-4 py-2 text-sm text-muted-foreground transition-colors min-w-[280px] xl:min-w-[360px]"
            >
              <Search className="h-4 w-4 text-muted-foreground/60" />
              <span>Search dentists, services, locations...</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-md hover:bg-muted/50">
                  Services
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 rounded-lg p-1.5 bg-card border border-border shadow-lg z-50">
                  <DropdownMenuItem asChild className="rounded-md font-semibold text-foreground cursor-pointer">
                    <Link to="/services">All Services</Link>
                  </DropdownMenuItem>
                  <div className="h-px bg-border my-1" />
                  {(treatments || []).map((item) => (
                    <DropdownMenuItem key={item.slug} asChild className="rounded-md font-medium text-foreground/80 cursor-pointer">
                      <Link to={`/services/${item.slug}`}>{item.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-md hover:bg-muted/50">
                  Locations
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 rounded-lg p-1.5 bg-card border border-border shadow-lg z-50">
                  {states?.map((state) => (
                    <DropdownMenuItem key={state.slug} asChild className="rounded-md font-semibold text-foreground cursor-pointer">
                      <Link to={`/${state.slug}`}>{state.name}</Link>
                    </DropdownMenuItem>
                  ))}
                  {states && states.length > 0 && topAreas.length > 0 && (
                    <div className="h-px bg-border my-1" />
                  )}
                  <p className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 mt-1">Popular Areas</p>
                  {topAreas.map((area) => (
                    <DropdownMenuItem key={area.slug} asChild className="rounded-md font-medium text-foreground/80 cursor-pointer">
                      <Link to={`/${area.stateSlug}/${area.slug}`}>{area.name}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link 
                to="/pricing" 
                className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors rounded-md hover:bg-muted/50"
                onMouseEnter={() => onMouseEnter('/pricing')}
                onMouseLeave={onMouseLeave}
              >
                Pricing
              </Link>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-sm font-medium text-foreground/70 hover:text-foreground" asChild>
                <Link to="/list-your-practice">For Dentists</Link>
              </Button>
              <Button variant="ghost" size="icon" className="rounded-lg text-foreground/60 hover:text-foreground h-9 w-9" asChild>
                <Link to="/auth"><User className="h-4 w-4" /></Link>
              </Button>
              <Button 
                size="sm" 
                className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-9 px-4"
                onClick={() => navigate("/search")}
              >
                Find Dentist
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-border animate-fade-in bg-card">
              {/* Mobile Search */}
              <button
                onClick={() => { setMobileMenuOpen(false); navigate("/search"); }}
                className="flex items-center gap-2 w-full bg-muted/60 border border-border/60 rounded-lg px-4 py-3 text-sm text-muted-foreground mb-3"
              >
                <Search className="h-4 w-4" />
                Search dentists, services...
              </button>

              <div className="space-y-0.5">
                <Link to="/services" className="flex items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>
                  Services <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Locations</p>
                {states?.map((state) => (
                  <Link 
                    key={state.slug} 
                    to={`/${state.slug}`} 
                    className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg" 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {state.name}
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                <Link to="/insurance" className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>Insurance</Link>
                <Link to="/pricing" className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>Pricing</Link>
                <Link to="/emergency-dentist" className="block px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>Emergency Dentist</Link>
                <div className="h-px bg-border my-2" />
                <Link to="/blog" className="block px-3 py-2.5 text-sm text-foreground/70 hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                <Link to="/faq" className="block px-3 py-2.5 text-sm text-foreground/70 hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>FAQ</Link>
                <Link to="/contact" className="block px-3 py-2.5 text-sm text-foreground/70 hover:bg-muted rounded-lg" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              </div>
              <div className="mt-4 space-y-2">
                <Button variant="outline" className="w-full rounded-lg font-semibold border-border text-foreground" asChild>
                  <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                </Button>
                <Button className="w-full rounded-lg bg-primary text-primary-foreground font-semibold" onClick={() => { setMobileMenuOpen(false); navigate("/search"); }}>
                  Find Dentist
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
