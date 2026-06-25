'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface PageLayoutProps {
  children: ReactNode;
  showWhatsApp?: boolean;
  whatsAppNumber?: string;
  whatsAppMessage?: string;
  hideNavbar?: boolean;
  hideFooter?: boolean;
}

export function PageLayout({
  children,
  showWhatsApp = true,
  whatsAppNumber = '97141234567',
  whatsAppMessage = 'Hi! I need help finding a dentist.',
  hideNavbar = false,
  hideFooter = false,
}: PageLayoutProps) {
  const whatsAppUrl = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(whatsAppMessage)}`;

  return (
    <div className="relative min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {!hideNavbar && <Navbar />}

      <main className={hideNavbar ? '' : 'pt-16 lg:pt-20'}>
        {children}
      </main>

      {!hideFooter && <Footer />}

      {showWhatsApp && (
        <div className="fixed bottom-6 right-6 z-50">
          <Link
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-14 h-14 bg-[#2D9C84] rounded-full shadow-[0_4px_24px_rgba(45,156,132,0.4)] hover:shadow-[0_6px_32px_rgba(45,156,132,0.5)] hover:bg-[#3AB89E] transition-all duration-300 hover:-translate-y-[2px]"
          >
            <MessageCircle className="h-7 w-7 text-white" />
          </Link>
        </div>
      )}
    </div>
  );
}
