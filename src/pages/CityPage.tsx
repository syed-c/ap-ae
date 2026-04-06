'use client';
import { useState as useReactState, useMemo } from "react";
import { useRouter } from "next/router";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';
import { supabase } from "@/integrations/supabase/client";
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
  SlidersHorizontal
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
}

const CityPage = ({ citySlugProp, stateSlugProp, stateDataProp, cityDataProp, seoDataProp, faqsProp, seoH1Prop }: CityPageProps = {}) => {
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
      const { count, error } = await supabase
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
  const { data: rawProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['city-profiles', citySlug, pinnedProfiles?.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!city) return [];

      const pinnedIds = (pinnedProfiles || []).map(p => p.id);

      const { data: clinics } = await supabase
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
        const { data: extraPinned } = await supabase
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
    enabled: !!city,
  });

  // Sort profiles with pinned ones first and apply filters
  const filteredProfiles = useMemo(() => {
    if (!rawProfiles) return [];
    const sorted = sortWithPinnedFirst(rawProfiles, pinnedProfiles || []);
    const pinnedIds = new Set((pinnedProfiles || []).map(p => p.id));
    let result = sorted.map(p => ({ ...p, isPinned: pinnedIds.has(p.id) }));

    if (filters.minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= filters.minRating);
    }
    if (filters.verifiedOnly) {
      result = result.filter(p => p.isVerified);
    }

    return result;
  }, [rawProfiles, pinnedProfiles, filters]);

  const profiles = filteredProfiles;

  // Fetch treatments (cached via useTreatments hook)
  const { data: treatments, isLoading: treatmentsLoading } = useTreatments();

  // Fetch nearby cities for internal linking
  const { data: nearbyCities, isLoading: nearbyCitiesLoading } = useCitiesByStateSlug(normalizedStateSlug || '');

  // Signal prerender when ALL SEO-critical data loads
  // Includes: location data, profiles (for listings), treatments, nearby cities (internal links), and SEO content
  const isDataReady = !stateLoading && !cityLoading && !profilesLoading && !treatmentsLoading && !nearbyCitiesLoading && !seoContentLoading && !seoContentFetching;

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

  // Parse SEO content
  const parsedContent = seoContent?.content ? parseMarkdownContent(seoContent.content) : null;
  // Use dedicated faqs column first (has question/answer format), fallback to parsing from content (now returns q/a format)
  const rawSeoFaqs = seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0
    ? seoContent.faqs
    : seoContent?.content ? parseFaqFromContent(seoContent.content) : [];
  // Normalize to { q, a } format for consistent rendering
  const seoFaqs = rawSeoFaqs.map(f => ('q' in f ? f : { q: (f as any).question, a: (f as any).answer }));

  // SSR FAQ data takes priority, then use client-fetched SEO content, then defaults
  const serverFaqs = faqsProp && faqsProp.length > 0 ? faqsProp : [];

  const pageTitle = seoContent?.meta_title || seoDataProp?.title || null;
  const pageDescription = seoContent?.meta_description || seoDataProp?.description || null;
  const pageH1 = seoContent?.h1 || seoH1Prop || null;

  // Note: parseFaqFromContent now returns { q, a }[] format (same as seoContent.faqs after parseFaqs validation)
  const faqs = serverFaqs.length > 0 ? serverFaqs : seoFaqs.length > 0 ? seoFaqs : [];

  // Always false - city pages are always indexable per SEO registry
const shouldNoIndex = false;

  const popularTreatments = (treatments || []).map(t => ({ name: t.name, slug: t.slug }));
  const nearbyLocations = (nearbyCities || [])
    .filter(c => c.slug !== citySlug)
    .slice(0, 6)
    .map(c => ({ name: c.name, slug: c.slug }));

  const hasActiveFilters = filters.maxBudget !== null || filters.minRating > 0 || filters.verifiedOnly;

  return (
    <PageLayout>
      <SEOHead
        title={seoDataProp?.title ?? pageTitle}
        description={seoDataProp?.description ?? pageDescription}
        canonical={seoDataProp?.canonical ?? `/${normalizedStateSlug}/${citySlug}/`}
        keywords={[`dentists ${cityName}`, `dental clinics ${cityName} ${stateAbbr}`, `best dentist ${cityName}`]}
        noindex={shouldNoIndex}
      />
      {/* Synchronous JSON-LD structured data for SEO */}
      <SyncStructuredData
        data={[
          {
            type: 'breadcrumb',
            items: [
              { name: 'Home', url: '/' },
              { name: stateName, url: `/${normalizedStateSlug}/` },
              { name: cityName, url: `/${normalizedStateSlug}/${citySlug}/` },
            ],
          },
          {
            type: 'faq',
            questions: faqs.map(f => ({ question: f.q || f.question, answer: f.a || f.answer })).filter(f => f.question && f.answer),
          },
          {
            type: 'itemList',
            name: `Dentists in ${cityName}, ${stateAbbr}`,
            description: `Top-rated dental clinics and dentists in ${cityName}`,
            items: (profiles || []).slice(0, 10).map((p, i) => ({
              name: p.name,
              url: `/clinic/${p.slug}/`,
              position: i + 1,
              image: p.image,
            })),
          },
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

      {/* Hero Section — Dark theme matching homepage */}
      <section className="relative overflow-hidden min-h-[45vh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-teal/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="container relative z-10 py-14 md:py-18 px-4">
          <div className="flex justify-center mb-4">
            <Breadcrumbs items={breadcrumbs} className="[&_a]:text-white/60 [&_span]:text-white/40 [&_svg]:text-white/30" />
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-md border border-primary/30 rounded-full px-4 py-2 mb-4"
            >
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-xs md:text-sm font-bold text-primary">Licensed Dental Specialists</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-4"
            >
              {pageH1 && pageH1.includes(cityName) ? (
                <>
                  <span className="text-white">{pageH1.split(cityName)[0]}</span>
                  <span className="text-primary">{cityName}</span>
                  <span className="text-white">{pageH1.split(cityName)[1] || ''}</span>
                </>
              ) : (
                <span className="text-white">{pageH1 || 'Loading...'}</span>
              )}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base lg:text-lg text-white/40 mb-6 max-w-2xl mx-auto px-2"
            >
              {pageDescription}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl md:max-w-2xl mx-auto mb-6"
            >
              <SearchBox variant="hero" stateSlug={stateSlug} defaultCity={`${citySlug}|${stateSlug}`} />
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-2 md:gap-3"
            >
              <div className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-white">{profiles?.length || 0}+</span>
                <span className="text-xs text-white/50 hidden sm:inline">Specialists</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
                <Star className="h-4 w-4 text-gold fill-gold" />
                <span className="font-bold text-sm text-white">4.8</span>
                <span className="text-xs text-white/50 hidden sm:inline">Avg. Rating</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl px-3 py-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-white">60s</span>
                <span className="text-xs text-white/50 hidden sm:inline">to Book</span>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Page Intro Section - CMS Content */}
      <PageIntroSection
        title={parsedContent?.sections?.[0]?.heading || null}
        content={(seoContent as any)?.page_intro || parsedContent?.intro || parsedContent?.sections?.[0]?.content || null}
        isLoading={isSeoContentPending}
      />

      {/* Main Content: Dentists + SEO Content */}
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
                hasActiveFilters={hasActiveFilters}
                onClearFilters={() => setFilters({ maxBudget: null, minRating: 0, verifiedOnly: false, selectedServices: [] })}
                maxHeight={700}
                initialCount={10}
              />

              {/* SEO Content Block */}
              <SEOContentBlock
                variant="city"
                locationName={cityName}
                stateName={stateName}
                stateAbbr={stateAbbr}
                stateSlug={stateSlug}
                citySlug={citySlug}
                clinicCount={totalClinicCount || profiles?.length || 0}
                parsedContent={parsedContent}
                popularTreatments={popularTreatments}
                nearbyLocations={nearbyLocations}
                isLoading={isSeoContentPending}
              />

              {/* SEO Internal Links - 8-15 contextual links for crawlability */}
              <InternalLinkBlock
                title="Explore Dental Care Options"
                links={generateCityInternalLinks(
                  normalizedStateSlug || '',
                  citySlug || '',
                  cityName,
                  stateName,
                  popularTreatments,
                  nearbyLocations
                )}
                variant="grid"
                showDescriptions
                className="mt-8"
              />

              {/* Geographic Link Block - SEO Authority Distribution */}
              <GeographicLinkBlock
                pageType="city"
                stateSlug={normalizedStateSlug || ''}
                stateName={stateName}
                citySlug={citySlug}
                cityName={cityName}
                nearbyCities={nearbyLocations}
                services={popularTreatments}
              />

              {/* Nearby Cities Links */}
              {nearbyLocations.length > 0 && (
                <LocationQuickLinks
                  variant="nearby"
                  stateSlug={stateSlug}
                  items={nearbyLocations}
                />
              )}
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
