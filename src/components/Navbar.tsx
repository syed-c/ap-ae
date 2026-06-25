'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Menu,
  X,
  Search,
  MapPin,
  ChevronDown,
  Phone,
  Stethoscope,
  Building2,
  ShieldCheck,
  DollarSign,
  UserRound,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useCities, useStates } from '@/hooks/useLocations';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useTreatments } from '@/hooks/useTreatments';

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  default: <Stethoscope className="h-4 w-4" />,
};

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { data: states } = useStates();
  const { data: cities } = useCities();
  const { data: settings } = useSiteSettings();
  const { data: treatments } = useTreatments();

  const topTreatments = useMemo(() => (treatments || []).slice(0, 8), [treatments]);
  const topCities = useMemo(() => (cities || []).slice(0, 8), [cities]);

  const navLinks = [
    {
      label: 'Services',
      key: 'services',
      dropdown: true,
      icon: <Stethoscope className="h-4 w-4" />,
      children: topTreatments.map((t) => ({
        label: t.name,
        href: `/treatment/${t.slug}/`,
      })),
    },
    {
      label: 'Locations',
      key: 'locations',
      dropdown: true,
      icon: <MapPin className="h-4 w-4" />,
      children: [
        ...(states || []).map((s) => ({
          label: s.name,
          href: `/${s.slug}/`,
        })),
        { label: 'View all cities', href: '/sitemap/', divider: true },
        ...topCities.map((c) => ({
          label: c.name,
          href: `/${c.state?.slug || ''}/${c.slug}/`,
        })),
      ],
    },
    { label: 'Pricing', href: '/pricing/', icon: <DollarSign className="h-4 w-4" /> },
    { label: 'Insurance', href: '/insurance/', icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  const rightLinks = [
    { label: 'For Dentists', href: '/list-your-practice/', icon: <Building2 className="h-4 w-4" /> },
    { label: 'Find Dentist', href: '/search/', icon: <Search className="h-4 w-4" /> },
    { label: 'Sign In', href: '/auth/', icon: <LogIn className="h-4 w-4" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-xl border-b border-[#1E1E1E]">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#2D9C84] flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">
              {settings?.siteName || 'AppointPanda'}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              if (link.dropdown) {
                return (
                  <div
                    key={link.key}
                    className="relative group"
                    onMouseEnter={() => setOpenDropdown(link.key!)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#62626B] hover:text-white transition-all duration-300 rounded-lg hover:bg-[rgba(45,156,132,0.08)]">
                      {link.icon}
                      {link.label}
                      <ChevronDown className={cn(
                        'h-3.5 w-3.5 transition-transform duration-300',
                        openDropdown === link.key && 'rotate-180'
                      )} />
                    </button>
                    <div className={cn(
                      'absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-1 group-hover:translate-y-0',
                    )}>
                      <div className="w-56 bg-[#161616] border border-[#1E1E1E] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl p-2">
                        {link.children?.map((child: any, i: number) => (
                          child.divider ? (
                            <div key={i} className="h-px bg-[#1E1E1E] my-2 mx-2" />
                          ) : (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#62626B] hover:text-white hover:bg-[rgba(45,156,132,0.08)] rounded-lg transition-all duration-300"
                            >
                              {child.label}
                            </NavLink>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <NavLink
                  key={link.href}
                  to={link.href!}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#62626B] hover:text-white transition-all duration-300 rounded-lg hover:bg-[rgba(45,156,132,0.08)]"
                >
                  {link.icon}
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right Side - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {rightLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href!}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#62626B] hover:text-white transition-all duration-300 rounded-lg hover:bg-[rgba(45,156,132,0.08)]"
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
            <Button variant="default" size="sm" className="ml-2">
              <Phone className="h-4 w-4" />
              Book Now
            </Button>
          </div>

          {/* Mobile Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 text-white hover:bg-[rgba(45,156,132,0.08)] rounded-lg transition-all duration-300">
                {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-sm bg-[#161616] border-l border-[#1E1E1E] p-0">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E1E]">
                  <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                    <div className="w-8 h-8 rounded-lg bg-[#2D9C84] flex items-center justify-center">
                      <Stethoscope className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white font-bold">{settings?.siteName || 'AppointPanda'}</span>
                  </Link>
                </div>

                {/* Mobile Nav */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                  {([...navLinks, ...rightLinks] as any[]).map((link: any) => {
                    if (link.dropdown) {
                      return (
                        <div key={link.key} className="space-y-1">
                          <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#62626B]">
                            {link.icon}
                            {link.label}
                          </div>
                          <div className="ml-4 space-y-0.5 border-l border-[#1E1E1E] pl-3">
                            {link.children?.map((child: any) => (
                              child.divider ? null : (
                                <NavLink
                                  key={child.href}
                                  to={child.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#62626B] hover:text-white hover:bg-[rgba(45,156,132,0.08)] rounded-lg transition-all duration-300"
                                >
                                  {child.label}
                                </NavLink>
                              )
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <NavLink
                        key={link.href}
                        to={link.href!}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#62626B] hover:text-white hover:bg-[rgba(45,156,132,0.08)] rounded-lg transition-all duration-300"
                      >
                        {link.icon}
                        {link.label}
                      </NavLink>
                    );
                  })}

                  <div className="pt-4">
                    <Button variant="default" className="w-full">
                      <Phone className="h-4 w-4" />
                      Book Now
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
