'use client';
import { useState, Suspense, lazy } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, Heart, Loader2 } from 'lucide-react';

const PageIdentityReportTab = lazy(() => import('./PageIdentityReportTab'));
const HumanContentQualityTab = lazy(() => import('./HumanContentQualityTab'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center py-20">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

export default function QualityIdentityTab() {
  const [activeTab, setActiveTab] = useState('identity');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500/10 via-rose-500/10 to-primary/10 p-6 border border-primary/20">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-violet-500 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-rose-500 blur-3xl" />
        </div>
        <div className="relative">
          <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center">
              <Fingerprint className="h-6 w-6 text-white" />
            </div>
            Quality & Identity Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Unified content quality analysis — duplicate detection, AI-sounding content, page value scoring, and one-click AI fixes
          </p>
        </div>
      </div>

      {/* Sub-tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-12 p-1 gap-1">
          <TabsTrigger value="identity" className="flex items-center gap-2 px-6 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-primary data-[state=active]:text-white">
            <Fingerprint className="h-4 w-4" />
            Page Identity & Similarity
          </TabsTrigger>
          <TabsTrigger value="quality" className="flex items-center gap-2 px-6 text-sm font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white">
            <Heart className="h-4 w-4" />
            Content Quality & AI Detection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="identity" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <PageIdentityReportTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="quality" className="mt-6">
          <Suspense fallback={<LoadingFallback />}>
            <HumanContentQualityTab />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
