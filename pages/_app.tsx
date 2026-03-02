import '@/index.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/hooks/useAuth';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { MetaTagInjector } from '@/components/analytics/MetaTagInjector';
import { CriticalResourceLoader } from '@/components/common/CriticalResourceLoader';
import { PandaBot } from '@/components/PandaBot';
import { DynamicFavicon } from '@/components/common/DynamicFavicon';
import { VisitorTracker } from '@/components/common/VisitorTracker';

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
