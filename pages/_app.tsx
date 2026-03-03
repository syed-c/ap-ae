import '@/index.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { AuthProvider } from '@/hooks/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { MetaTagInjector } from '@/components/analytics/MetaTagInjector';

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
