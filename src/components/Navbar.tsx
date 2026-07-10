'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Menu, X, ChevronDown, Phone, Sparkles, Languages, LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet, SheetContent, SheetTrigger,
} from '@/components/ui/sheet';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { navLinks, SITE_NAME, PHONE_NUMBER, PHONE_HREF } from '@/lib/site-data';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  return (
    <header className="relative z-50">
      {/* Emergency Hotline Bar */}
      <div className="bg-zinc-900 hidden lg:block">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-9">
          <a
            href={`tel:${PHONE_HREF}`}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 hover:text-amber-400 transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
            </span>
            24/7 Dental Emergency hotline: {PHONE_NUMBER}
          </a>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <span className="hover:text-zinc-200 transition-colors cursor-default">Trusted by 200,000+ UAE residents</span>
            <span className="opacity-50">|</span>
            <button className="flex items-center gap-1 hover:text-zinc-200 transition-colors">
              <Languages className="h-3 w-3" />
              English / العربية
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="bg-[#fafafa]/85 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="size-7 rounded-md bg-zinc-900 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-zinc-900 font-bold text-lg tracking-tight">
                {SITE_NAME}<span className="text-amber-700 font-semibold">.ae</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                if (link.dropdown) {
                  return (
                    <div
                      key={link.label}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(link.label)}
                      onMouseLeave={() => setOpenDropdown(null)}
                    >
                      <button className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors rounded-lg hover:bg-zinc-100">
                        {link.label}
                        <ChevronDown className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          openDropdown === link.label && 'rotate-180'
                        )} />
                      </button>
                      <div className={cn(
                        'absolute top-full left-0 pt-2 opacity-0 invisible transition-all duration-200 translate-y-1',
                        openDropdown === link.label && 'opacity-100 visible translate-y-0'
                      )}>
                        <div className="w-56 bg-white border border-zinc-200 rounded-xl shadow-lg p-2">
                          {link.children?.map((child) => (
                            <NavLink
                              key={child.href}
                              to={child.href}
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                              {child.label}
                            </NavLink>
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
                    className="px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors rounded-lg hover:bg-zinc-100"
                  >
                    {link.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right Side - Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/auth/"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors px-3 py-2 rounded-full hover:bg-zinc-100"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </Link>
              <Link
                href="/for-clinics"
                className="inline-flex items-center px-4 py-2 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 hover:scale-[1.02] transition-all duration-200"
              >
                List your Clinic
              </Link>
            </div>

            {/* Mobile Trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors touch-target">
                  {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm bg-[#fafafa] border-l border-zinc-200 p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                      <div className="size-7 rounded-md bg-zinc-900 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-zinc-900 font-bold">{SITE_NAME}<span className="text-amber-700">.ae</span></span>
                    </Link>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {navLinks.map((link) => {
                      if (link.dropdown && link.children) {
                        return (
                          <div key={link.label} className="space-y-1">
                            <div className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-400 uppercase tracking-widest text-[11px]">
                              {link.label}
                            </div>
                            <div className="ml-4 space-y-0.5 border-l border-zinc-200 pl-3">
                              {link.children.map((child) => (
                                <NavLink
                                  key={child.href}
                                  to={child.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                                >
                                  {child.label}
                                </NavLink>
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
                          className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                        >
                          {link.label}
                        </NavLink>
                      );
                    })}

                    <div className="pt-4 space-y-2 border-t border-zinc-200 mt-4">
                      <Link
                        href="/auth/"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-zinc-500 hover:text-zinc-900 rounded-full transition-colors"
                      >
                        <LogIn className="h-3.5 w-3.5 mr-1.5" />
                        Sign in
                      </Link>
                      <Link
                        href="/for-clinics"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center justify-center px-3 py-2.5 text-sm font-semibold bg-zinc-900 text-white rounded-full hover:bg-zinc-800 transition-colors"
                      >
                        List your Clinic
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
