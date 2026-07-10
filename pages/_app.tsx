import '@/index.css';
import '@fontsource/instrument-sans/400.css';
import '@fontsource/instrument-sans/500.css';
import '@fontsource/instrument-sans/600.css';
import '@fontsource/instrument-sans/700.css';
import type { AppProps } from 'next/app';
import { QueryClient, QueryClientProvider, HydrationBoundary } from '@tanstack/react-query';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Noto_Sans_Arabic } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';

const Toaster = dynamic(() => import('@/components/ui/toaster').then(m => m.Toaster));
const Sonner = dynamic(() => import('@/components/ui/sonner').then(m => m.Toaster));
const MetaTagInjector = dynamic(() => import('@/components/analytics/MetaTagInjector').then(m => m.MetaTagInjector));

const arabicFont = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

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
  const fontClass = `${arabicFont.variable}`;
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
    <div className={fontClass} style={{ fontFamily: "'Instrument Sans', system-ui, -apple-system, sans-serif" }}>
      <QueryClientProvider client={queryClient}>
        <HydrationBoundary state={pageProps.dehydratedState}>
          <AuthProvider>
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
          </AuthProvider>
        </HydrationBoundary>
      </QueryClientProvider>
    </div>
  );
}
