import '@/index.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Nunito } from 'next/font/google';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';

const Toaster = dynamic(() => import('@/components/ui/toaster').then(m => m.Toaster));
const Sonner = dynamic(() => import('@/components/ui/sonner').then(m => m.Toaster));
const MetaTagInjector = dynamic(() => import('@/components/analytics/MetaTagInjector').then(m => m.MetaTagInjector));

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

// Lazy-load non-critical components — keeps initial JS bundle lean
const AnalyticsProvider = dynamic(
  () => import('@/components/analytics/AnalyticsProvider').then(m => m.AnalyticsProvider),
  { ssr: false }
);
const CriticalResourceLoader = dynamic(
  () => import('@/components/common/CriticalResourceLoader').then(m => m.CriticalResourceLoader),
  { ssr: false }
);
const PandaBot = dynamic(
  () => import('@/components/PandaBot').then(m => m.PandaBot),
  { ssr: false }
);
const DynamicFavicon = dynamic(
  () => import('@/components/common/DynamicFavicon').then(m => m.DynamicFavicon),
  { ssr: false }
);
const VisitorTracker = dynamic(
  () => import('@/components/common/VisitorTracker').then(m => m.VisitorTracker),
  { ssr: false }
);

export default function App({ Component, pageProps }: AppProps) {
  const fontClass = `${nunito.variable} ${plusJakartaSans.variable}`;
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={pageProps.dehydratedState}>
        <AuthProvider>
          <TooltipProvider>
            <AnalyticsProvider>
              <MetaTagInjector />
              <Toaster />
              <Sonner />
              <VisitorTracker />
              <DynamicFavicon />
              <CriticalResourceLoader delay={3000} />
              <PandaBot />
              <Component {...pageProps} />
            </AnalyticsProvider>
          </TooltipProvider>
        </AuthProvider>
      </HydrationBoundary>
    </QueryClientProvider>
  );
}
