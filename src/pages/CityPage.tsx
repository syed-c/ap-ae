'use client';
import { useState as useReactState, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { supabase, supabaseAdmin } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { generateCityQA } from "@/lib/ai-seo/generateQAContent";
import { Section } from "@/components/layout/Section";
import { SearchBox } from "@/components/SearchBox";
import { BudgetFilterSidebar, useBudgetFilters } from "@/components/filters";
import { DentistListFrame, LocationQuickLinks } from "@/components/location";
import { SEOContentBlock } from "@/components/seo/SEOContentBlock";
import { PageIntroSection } from "@/components/seo/PageIntroSection";
import { GeographicLinkBlock } from "@/components/seo/GeographicLinkBlock";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo/SEOHead";
import { SyncStructuredData } from "@/components/seo/SyncStructuredData";
import { InternalLinkBlock, generateCityInternalLinks } from "@/components/seo/InternalLinkBlock";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useCity, useState as useStateData, useCitiesByStateSlug } from "@/hooks/useLocations";
import { useTreatments } from "@/hooks/useTreatments";
import { useSeoPageContent, parseMarkdownContent, parseFaqFromContent } from "@/hooks/useSeoPageContent";
import { usePinnedProfiles, sortWithPinnedFirst } from "@/hooks/usePinnedProfiles";
import { useAreaLocalContent, generateAreaIntro } from "@/hooks/useAreaLocalContent";
import { normalizeStateSlug } from "@/lib/slug/normalizeStateSlug";
import NotFound from "./NotFound";
import {
  Star,
  Users,
  Clock,
  Stethoscope,
  SlidersHorizontal,
  MapPin,
  ArrowRight,
  Shield
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const ConversationalQABlock = dynamic(
  () => import('@/components/ai-seo/ConversationalQABlock').then(m => ({ default: m.ConversationalQABlock })),
  { ssr: false, loading: () => <div className="animate-pulse bg-muted rounded-xl h-48" /> }
);
const AIDiscoveryMeta = dynamic(
  () => import('@/components/ai-seo/AIDiscoveryMeta').then(m => ({ default: m.AIDiscoveryMeta })),
  { ssr: false }
);

// City pages are always indexable - SEO registry handles noindex for private pages
const MIN_DENTIST_COUNT = 0; // Disabled - all city pages should be indexed

interface CityPageProps {
  citySlugProp?: string;
  stateSlugProp?: string;
  stateDataProp?: any;
  cityDataProp?: any;
  dehydratedStateProp?: any;
  seoDataProp?: {
    title: string | null;
    description: string | null;
    canonical: string;
  };
  faqsProp?: { question: string; answer: string }[];
  seoH1Prop?: string | null;
  cityRatingsProp?: { avgRating: number; totalReviews: number; clinicCount: number };
  topClinicsProp?: { name: string; slug: string; rating: number; review_count: number }[];
  allSeoDataProp?: any;
  pageContentDataProp?: any;
  clinicProfilesProp?: any[];
}

const CityPage = ({ citySlugProp, stateSlugProp, stateDataProp, cityDataProp, seoDataProp, faqsProp, seoH1Prop, cityRatingsProp, topClinicsProp, allSeoDataProp, pageContentDataProp, clinicProfilesProp }: CityPageProps = {}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isServerRender = typeof window === 'undefined';
  const stateSlug = isServerRender
    ? (stateSlugProp || '')
    : (stateSlugProp || (typeof router.query?.stateSlug === 'string' ? router.query.stateSlug : ''));
  const citySlug = isServerRender
    ? (citySlugProp || '')
    : (citySlugProp || (typeof router.query?.citySlug === 'string' ? router.query.citySlug : ''));
  const normalizedStateSlug = normalizeStateSlug(stateSlug);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useReactState(false);
  const { filters, setFilters } = useBudgetFilters();

  const { data: state, isLoading: stateLoading } = useStateData(normalizedStateSlug || '', stateDataProp);
  const { data: city, isLoading: cityLoading } = useCity(citySlug || '', normalizedStateSlug || '', cityDataProp);

  // Fetch SEO content from seo_pages table
  const seoSlug = `${normalizedStateSlug || ''}/${citySlug || ''}`;
  const { data: seoContent, isLoading: seoContentLoading, isFetching: seoContentFetching } = useSeoPageContent(seoSlug);

  // IMPORTANT: Don't hide content during background refetches - only show loading state when no data exists
  const isSeoContentPending = !seoContent && (seoContentLoading || seoContentFetching);

  // Fetch pinned profiles for this city page
  const { data: pinnedProfiles } = usePinnedProfiles('city', normalizedStateSlug, citySlug);

  // Get area-specific local content for unique page differentiation
  const areaLocalContent = useAreaLocalContent(citySlug);

  // Fetch TOTAL clinic count for this city (for SEO content - not limited)
  const { data: totalClinicCount } = useQuery({
    queryKey: ['city-clinic-count', city?.id],
    queryFn: async () => {
      if (!city) return 0;
      const { count, error } = await supabaseAdmin
        .from('clinics')
        .select('id', { count: 'exact', head: true })
        .eq('city_id', city.id)
        .eq('is_active', true);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!city,
  });

  // Fetch profiles for this city (limited for display)
  const hasServerProfiles = !!(clinicProfilesProp && clinicProfilesProp.length > 0 && city);
  const { data: rawProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['city-profiles', citySlug, pinnedProfiles?.map(p => p.id).join(',')],
    queryFn: async () => {
      const pinnedIds = (pinnedProfiles || []).map(p => p.id);

      const { data: clinics } = await supabaseAdmin
        .from('clinics')
        .select(`
          id, name, slug, description, cover_image_url, rating, review_count,
          address, phone, verification_status, claim_status,
          city:cities(name, slug, state:states(name, abbreviation))
        `)
        .eq('city_id', city.id)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(50);

      const resultIds = new Set((clinics || []).map(c => c.id));
      const missingPinnedIds = pinnedIds.filter(id => !resultIds.has(id));

      let pinnedClinics: any[] = [];
      if (missingPinnedIds.length > 0) {
        const { data: extraPinned } = await supabaseAdmin
          .from('clinics')
          .select(`
            id, name, slug, description, cover_image_url, rating, review_count,
            address, phone, verification_status, claim_status,
            city:cities(name, slug, state:states(name, abbreviation))
          `)
          .in('id', missingPinnedIds)
          .eq('is_active', true);
        pinnedClinics = extraPinned || [];
      }

      const seenIds = new Set<string>();
      const allClinics = [...(clinics || []), ...pinnedClinics].filter(c => {
        if (seenIds.has(c.id)) return false;
        seenIds.add(c.id);
        return true;
      });

      return allClinics.map(c => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        type: 'clinic' as const,
        specialty: 'Dental Clinic',
        location: c.city ? `${c.city.name}, ${c.city.state?.abbreviation || ''}` : '',
        rating: c.rating || 0,
        reviewCount: c.review_count || 0,
        image: c.cover_image_url,
        isVerified: c.verification_status === 'verified',
        isClaimed: c.claim_status === 'claimed',
        isPinned: false,
      }));
    },
    enabled: !!city && !hasServerProfiles,
  });

  // Server-side profiles for SSR (Googlebot sees this immediately)
  const [serverProfiles] = useState(() =>
    hasServerProfiles
      ? clinicProfilesProp.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: 'clinic' as const,
          specialty: 'Dental Clinic',
          location: c.state ? `${c.state.name || ''}, ${c.state.slug?.substring(0, 2).toUpperCase() || ''}` : '',
          rating: c.rating || 0,
          reviewCount: c.review_count || 0,
          image: c.cover_image_url || c.image_url,
          isVerified: c.is_verified,
          isClaimed: c.is_claimed,
          isPinned: c.is_pinned,
        }))
      : undefined
  );

  // Sort profiles with pinned ones first and apply filters
  const filteredProfiles = useMemo(() => {
    if (!rawProfiles && !serverProfiles) return [];
    const source = hasServerProfiles ? serverProfiles : rawProfiles;
    const sorted = sortWithPinnedFirst(source as any[], (pinnedProfiles || []) as any[]) as any[];
    const pinnedIds = new Set((pinnedProfiles || []).map(p => p.id));
    let result = sorted.map(p => ({ ...p, isPinned: pinnedIds.has(p.id) }));

    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= filters.minRating);
    }
    if (filters.verifiedOnly) {
      result = result.filter(p => p.isVerified);
    }

    return result;
  }, [rawProfiles, serverProfiles, hasServerProfiles, pinnedProfiles, filters]);

  const profiles = filteredProfiles;

  // Fetch treatments (cached via useTreatments hook)
  const { data: treatments, isLoading: treatmentsLoading } = useTreatments();

  // Fetch nearby cities for internal linking - filtered by emirate using state_id
  const { data: nearbyCities, isLoading: nearbyCitiesLoading } = useQuery({
    queryKey: ['cities-by-emirate', normalizedStateSlug],
    queryFn: async () => {
      // First get the state to get its ID
      const { data: stateData, error: stateError } = await supabaseAdmin
        .from('states')
        .select('id')
        .eq('slug', normalizedStateSlug)
        .eq('is_active', true)
        .maybeSingle();
      
      if (stateError || !stateData) {
        console.error('State not found:', normalizedStateSlug, stateError);
        return [];
      }
      
      // Then get cities by state_id
      const { data: citiesData, error: citiesError } = await supabaseAdmin
        .from('cities')
        .select('id, name, slug')
        .eq('state_id', stateData.id)
        .eq('is_active', true)
        .order('name');
      
      if (citiesError) {
        console.error('Cities fetch error:', citiesError);
        throw citiesError;
      }
      
      return citiesData || [];
    },
    enabled: !!normalizedStateSlug,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch service-location pages from seo_pages for this city (all services)
  const { data: serviceLocationPages, isLoading: serviceLocationsLoading } = useQuery({
    queryKey: ['service-locations', normalizedStateSlug, citySlug],
    queryFn: async () => {
      const slugPattern = `/${normalizedStateSlug}/${citySlug}/`;
      const { data, error } = await supabaseAdmin
        .from('seo_pages')
        .select('slug, title, h1, meta_title')
        .eq('page_type', 'service-location' as any)
        .like('slug', `%${slugPattern}%`)
        .eq('is_published', true)
        .order('title');
      
      if (error) {
        console.error('Service locations fetch error:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!normalizedStateSlug && !!citySlug,
    staleTime: 5 * 60 * 1000,
  });

  // Signal prerender when ALL SEO-critical data loads
  // Includes: location data, profiles (for listings), treatments, nearby cities (internal links), SEO content, and service locations
  const isDataReady = !stateLoading && !cityLoading && !profilesLoading && !treatmentsLoading && !nearbyCitiesLoading && !seoContentLoading && !seoContentFetching && !serviceLocationsLoading;

  if (!stateSlug || !citySlug) {
    return <NotFound />;
  }

  if (stateSlug && normalizedStateSlug && stateSlug !== normalizedStateSlug) {
    return router.replace(`/${normalizedStateSlug}/${citySlug}/`);
  }

  if (stateSlug === "clinic") {
    return router.replace(`/clinic/${citySlug}/`);
  }
  if (stateSlug === "dentist") {
    return router.replace(`/dentist/${citySlug}/`);
  }

  // Check if we have data from prefetch
  const hasStateData = !!state;
  const hasCityData = !!city;

  // Build SEO data - use existing seoSlug variable
  const locationName = city?.name || citySlug || '';
  const seoTitle = seoContent?.meta_title || null;
  const seoDescription = seoContent?.meta_description || null;

  // If we have state data from prefetch, render full page
  if (!hasStateData && (stateLoading || cityLoading)) {
    // If we have server-side SEO data from getStaticProps, render meaningful SSR content
    if (seoDataProp) {
      return (
        <PageLayout>
          <SEOHead
            title={seoDataProp.title}
            description={seoDataProp.description}
            canonical={seoDataProp.canonical}
          />
          <div className="container py-12">
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-2">{seoDataProp.title}</h1>
            <p className="text-muted-foreground">{seoDataProp.description}</p>
          </div>
        </PageLayout>
      );
    }
    // Only render visual skeleton for client-side navigations
    return (
      <PageLayout>
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          canonical={seoDataProp?.canonical ?? `/${seoSlug}/`}
        />
        <div className="container py-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
      </PageLayout>
    );
  }

  if (!state || !city) {
    return <NotFound />;
  }

  const cityName = city.name;
  const stateName = state.name;
  const stateAbbr = state.abbreviation;
  const locationDisplay = `${cityName}, ${stateAbbr}`;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: stateName, href: `/${normalizedStateSlug}/` },
    { label: cityName },
  ];

  const section1Title = pageContentDataProp?.section_1_title || null;
  const section1Content = pageContentDataProp?.section_1_content || null;
  const section2Title = pageContentDataProp?.section_2_title || null;
  const section2Content = pageContentDataProp?.section_2_content || null;
  const section3Title = pageContentDataProp?.section_3_title || null;
  const section3Content = pageContentDataProp?.section_3_content || null;
  
  // Parse seo_pages content for PageIntroSection
  const parsedContent = seoContent?.content ? parseMarkdownContent(seoContent.content) : null;
  
  // Use dedicated faqs column first (has question/answer format), fallback to parsing from content (now returns q/a format)
  const rawSeoFaqs = seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0
    ? seoContent.faqs
    : seoContent?.content ? parseFaqFromContent(seoContent.content) : [];
  // Normalize to { q, a } format for consistent rendering
  const seoFaqs = rawSeoFaqs.map(f => ('q' in f ? f : { q: (f as any).question, a: (f as any).answer }));

  // SSR FAQ data takes priority, then use client-fetched SEO content, then defaults
  const serverFaqs = faqsProp && faqsProp.length > 0 ? faqsProp : [];

  const pageTitle = pageContentDataProp?.meta_title || seoContent?.meta_title || seoDataProp?.title || null;
  const pageDescription = pageContentDataProp?.meta_description || seoContent?.meta_description || seoDataProp?.description || null;
  const pageH1 = pageContentDataProp?.h1 || seoContent?.h1 || seoH1Prop || null;

  // Note: parseFaqFromContent now returns { q, a }[] format (same as seoContent.faqs after parseFaqs validation)
  const faqs = serverFaqs.length > 0 ? serverFaqs : seoFaqs.length > 0 ? seoFaqs : [];

  // Always false - city pages are always indexable per SEO registry
const shouldNoIndex = false;

  const popularTreatments = (treatments || []).map(t => ({ name: t.name, slug: t.slug }));
  
  // Get ALL cities in the emirate for "Explore Areas" section
  const allEmirateCities = (nearbyCities || [])
    .map(c => ({ name: c.name, slug: c.slug }));
  
  // Current city excluded from nearby
  const nearbyLocations = (nearbyCities || [])
    .filter(c => c.slug !== citySlug)
    .slice(0, 6)
    .map(c => ({ name: c.name, slug: c.slug }));

  const hasActiveFilters = filters.maxBudget !== null || filters.minRating > 0 || filters.verifiedOnly;

   return (
     <PageLayout>
       {/* Synchronous JSON-LD structured data for SEO - avoid duplicating what's in wrapper */}
       <SyncStructuredData
         data={[
           {
             type: 'place' as const,
             name: cityName,
             description: `Find the best dentists and dental clinics in ${cityName}, ${stateName}`,
             url: `/${normalizedStateSlug}/${citySlug}/`,
             containedInPlace: stateName,
           },
         ]}
          id="city-page-schema"
        />

      {/* Hero Section — Full viewport banner */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-[#0e0e0e] mx-4 mb-4 rounded-[3rem]">
        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full border-r border-b border-white/10 [mask-image:radial-gradient(ellipse_at_center,black,transparent)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full rotate-45" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full -rotate-12" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto w-full text-center space-y-12 p-8 md:p-12">
          <div className="flex justify-center mb-4">
            <Breadcrumbs items={breadcrumbs} className="[&_a]:text-white/60 [&_span]:text-white/40 [&_svg]:text-white/30" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#73ebdc] mx-auto mb-6">
            <Shield className="text-sm h-4 w-4" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Verified Provider Directory</span>
          </div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-tight max-w-4xl mx-auto"
            >
              {pageH1 && pageH1.includes(cityName) ? (
                <>
                  {pageH1.split(cityName)[0]}
                  <span className="text-[#73ebdc]">{cityName}</span>
                  {pageH1.split(cityName)[1] || ''}
                </>
              ) : (
                pageH1 || 'Loading...'
              )}
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm md:text-base lg:text-lg text-white/50 mb-8 max-w-2xl mx-auto px-2"
          >
            {pageDescription}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <SearchBox variant="hero" stateSlug={stateSlug} defaultCity={`${citySlug}|${stateSlug}`} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 md:gap-16 pt-8"
          >
            {(totalClinicCount || profiles?.length || 0) > 0 ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white">{profiles?.length || 0}+</span>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Verified<br/>Clinics</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white">{(profiles?.length || 0) * 5}+</span>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Active<br/>Specialists</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white">4.8</span>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Average<br/>Rating</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white">DHA</span>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Licensed<br/>Dentists</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white">Verified</span>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Clinic<br/>Profiles</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-white">24/7</span>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest text-left leading-tight">Patient<br/>Support</span>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </section>

      {/* Hero Intro Section - CMS Content Only (no heading) */}
      {pageContentDataProp?.hero_intro && (
        <section className="py-8 px-4">
          <div className="container max-w-4xl mx-auto">
            <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: pageContentDataProp.hero_intro }} />
          </div>
        </section>
      )}

      {/* Main Content: Dentists */}
      <Section size="lg">
        <div className="container px-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full rounded-xl font-bold gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {hasActiveFilters && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {(filters.maxBudget !== null ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (filters.verifiedOnly ? 1 : 0)}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Filter Results</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
                    <BudgetFilterSidebar
                      filters={filters}
                      onFiltersChange={setFilters}
                      availableServices={treatments?.map(t => ({ id: t.id, name: t.name, slug: t.slug })) || []}
                      locationName={cityName}
                      totalResults={profiles?.length || 0}
                      className="border-0 rounded-none shadow-none"
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24">
                <BudgetFilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  availableServices={treatments?.map(t => ({ id: t.id, name: t.name, slug: t.slug })) || []}
                  locationName={cityName}
                  totalResults={profiles?.length || 0}
                />
              </div>
            </aside>

            {/* Main Content Column */}
            <div className="flex-1 min-w-0 space-y-8">
              {/* Dentist List Frame */}
              <DentistListFrame
                profiles={profiles}
                isLoading={profilesLoading}
                locationName={cityName}
                stateSlug={normalizedStateSlug}
                nearbyLocations={nearbyLocations}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => setFilters({ maxBudget: null, minRating: 0, verifiedOnly: false, selectedServices: [] })}
                maxHeight={700}
                initialCount={10}
              />

              {/* Content Sections from page_content - section_1 to section_3 */}
              {(section1Title && section1Content) || (section2Title && section2Content) || (section3Title && section3Content) ? (
                <Section size="md">
                  <div className="container px-4 max-w-4xl mx-auto space-y-8">
                    {section1Title && section1Content && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4">{section1Title}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: section1Content.replace(/\n/g, '<br/>') }} />
                      </div>
                    )}
                    {section2Title && section2Content && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4">{section2Title}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: section2Content.replace(/\n/g, '<br/>') }} />
                      </div>
                    )}
                    {section3Title && section3Content && (
                      <div>
                        <h2 className="text-2xl font-bold mb-4">{section3Title}</h2>
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: section3Content.replace(/\n/g, '<br/>') }} />
                      </div>
                    )}
                  </div>
                </Section>
              ) : null}

              {/* NEW: All Service-Location Pages - Premium Dark Design */}
              {(serviceLocationPages?.length || 0) > 0 ? (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6 px-5">
                  {/* Background decorative elements */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/15 rounded-full blur-[80px]" />
                  </div>
                  
                  <div className="relative z-10">
                    {/* Section Header */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">All Dental Services in {cityName}</h3>
                        <p className="text-xs text-white/50">{serviceLocationPages?.length || 0} services available</p>
                      </div>
                    </div>

                    {/* Services Grid from seo_pages */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                      {serviceLocationPages?.map((service) => {
                        // Extract service slug from the full slug (e.g., /abu-dhabi/al-ain/teeth-cleaning -> teeth-cleaning)
                        const slugParts = service.slug?.split('/') || [];
                        const serviceSlug = slugParts[slugParts.length - 1];
                        
                        // Get the clean service name from treatments list
                        const treatment = treatments?.find(t => t.slug === serviceSlug);
                        const serviceName = treatment?.name || serviceSlug?.replace(/-/g, ' ') || service.slug;
                        
                        return (
                          <Link
                            key={service.slug}
                            href={`/${service.slug}/`}
                            className="group flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/15 border border-white/10 hover:border-primary/30 text-white/80 hover:text-primary transition-all duration-300 text-center"
                          >
                            <span className="whitespace-normal">{serviceName}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : popularTreatments.length > 0 ? (
                /* Fallback: show all treatments if no service-location pages exist yet */
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6 px-5">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-teal-500/15 rounded-full blur-[80px]" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">All Dental Services in {cityName}</h3>
                        <p className="text-xs text-white/50">{popularTreatments.length} services available</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {popularTreatments.map((treatment) => (
                        <Link
                          key={treatment.slug}
                          href={`/${normalizedStateSlug}/${citySlug}/${treatment.slug}/`}
                          className="group flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/15 border border-white/10 hover:border-primary/30 text-white/80 hover:text-primary transition-all duration-300"
                        >
                          <span className="truncate">{treatment.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* NEW: All Areas in Emirate - Premium Card Design */}
              {allEmirateCities.length > 0 && (
                <div className="bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl p-5 border border-border/50">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Explore {stateName}</h3>
                        <p className="text-xs text-muted-foreground">{allEmirateCities.length} areas available</p>
                      </div>
                    </div>
                    <Link 
                      href={`/${normalizedStateSlug}/`}
                      className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1.5"
                    >
                      View all <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Premium Pills Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-2">
                    {allEmirateCities.map((cityItem) => {
                      const isCurrentCity = cityItem.slug === citySlug;
                      return (
                        <Link
                          key={cityItem.slug}
                          href={`/${normalizedStateSlug}/${cityItem.slug}/`}
                          className={`group relative flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 text-center ${
                            isCurrentCity
                              ? 'bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/25'
                              : 'bg-white hover:bg-primary/5 border border-border hover:border-primary/30 text-foreground hover:text-primary'
                          }`}
                        >
                          {isCurrentCity && (
                            <MapPin className="h-3 w-3 mr-1.5 opacity-80 shrink-0" />
                          )}
                          <span className="whitespace-normal">{cityItem.name}</span>
                          {!isCurrentCity && (
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 to-primary/0 group-hover:from-primary/5 group-hover:to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Removed duplicate Nearby Cities - keeping only GeographicLinkBlock if needed */}

              {/* Geographic Link Block - Show only parent state link, remove duplicate services/cities */}
              <GeographicLinkBlock
                pageType="city"
                stateSlug={normalizedStateSlug || ''}
                stateName={stateName}
                citySlug={citySlug}
                cityName={cityName}
                nearbyCities={nearbyLocations}
                services={popularTreatments}
                showOnlyStateLink={true}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* AI-Optimized FAQ Section */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <ConversationalQABlock
            title={`Dental Care in ${cityName}`}
            subtitle={`Common questions about finding a dentist in ${cityName}, ${stateAbbr}`}
            items={[
              ...faqs.map(f => ({ question: f.q || f.question, answer: f.a || f.answer })).filter(f => f.question && f.answer),
              ...generateCityQA({ name: cityName, stateName, clinicCount: profiles?.length })
                .filter(cq => !faqs.some(f => ((f.q || f.question) || '').toLowerCase().includes(cq.question.split(' ').slice(0, 4).join(' ').toLowerCase())))
                .slice(0, 3),
            ]}
            contextLabel={`city-${citySlug}`}
            defaultOpen={true}
          />
        </div>
      </Section>

      {/* AI Discovery Meta */}
      <AIDiscoveryMeta
        pageTitle={pageTitle}
        aiSummary={`Find ${profiles?.length || 0}+ verified dental clinics in ${cityName}, ${stateName}, UAE. Compare ratings, read patient reviews, and book appointments online through AppointPanda.`}
        entityType="location"
        location={{ city: cityName, country: "UAE" }}
        url={`/${normalizedStateSlug}/${citySlug}/`}
        faqs={faqs.map(f => ({ question: f.q || f.question, answer: f.a || f.answer })).filter(f => f.question && f.answer)}
        keyFacts={[
          `${profiles?.length || 0}+ dental clinics listed in ${cityName}`,
          "All clinics verified with DHA/MOHAP licensing",
          "Online booking with instant confirmation",
          "Patient reviews and transparent AED pricing",
        ]}
      />
    </PageLayout>
  );
};

export default CityPage;
