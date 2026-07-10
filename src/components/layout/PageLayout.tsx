'use client';

import { ReactNode } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface PageLayoutProps {
  children: ReactNode;
  hideNavbar?: boolean;
  hideFooter?: boolean;
}

export function PageLayout({
  children,
  hideNavbar = false,
  hideFooter = false,
}: PageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-[#fafafa] text-zinc-900 overflow-x-hidden" style={{ fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif" }}>
      {!hideNavbar && <Navbar />}
      <main>{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
