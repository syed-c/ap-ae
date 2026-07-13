'use client';
import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { DentistListFrame } from "@/components/location";
import { SEOContentBlock } from "@/components/seo/SEOContentBlock";
import { PageIntroSection } from "@/components/seo/PageIntroSection";
import { GeographicLinkBlock } from "@/components/seo/GeographicLinkBlock";
import { BudgetFilterSidebar, useBudgetFilters } from "@/components/filters";
import { Skeleton } from "@/components/ui/skeleton";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { useState as useStateData, useCitiesByStateSlug } from "@/hooks/useLocations";
import { useTreatments } from "@/hooks/useTreatments";
import { useSeoPageContent, parseMarkdownContent, parseFaqFromContent } from "@/hooks/useSeoPageContent";
import { usePinnedProfiles, sortWithPinnedFirst } from "@/hooks/usePinnedProfiles";
import { normalizeStateSlug } from "@/lib/slug/normalizeStateSlug";
import { sanitizeCmsHtml } from "@/lib/security/sanitizeCmsHtml";
import NotFound from "./NotFound";
import {
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

interface StatePageProps {
  stateSlugProp?: string;
  stateDataProp?: any;
  citiesDataProp?: any[];
  dehydratedStateProp?: any;
  seoDataProp?: {
    title: string | null;
    description: string | null;
    canonical: string;
  };
  faqsProp?: { question: string; answer: string }[];
  seoH1Prop?: string | null;
  stateRatingsProp?: { avgRating: number; totalReviews: number; clinicCount: number };
  topClinicsProp?: { name: string; slug: string; rating: number; review_count: number }[];
  allSeoDataProp?: any;
  pageContentDataProp?: any;
  clinicProfilesProp?: any[];
}

const StatePage = ({ stateSlugProp, stateDataProp, citiesDataProp, seoDataProp, faqsProp, seoH1Prop, stateRatingsProp, topClinicsProp, allSeoDataProp, pageContentDataProp, clinicProfilesProp }: StatePageProps = {}) => {
  const router = useRouter();
  const isServerRender = typeof window === 'undefined';
  const stateSlug = isServerRender
    ? (stateSlugProp || '')
    : (stateSlugProp || (typeof router.query?.stateSlug === 'string' ? router.query.stateSlug : ''));

  const normalizedStateSlug = normalizeStateSlug(stateSlug);

  // Check if this is actually a static page route or reserved path
  const staticRoutes = [
    'about', 'contact', 'faq', 'how-it-works', 'privacy', 'terms',
    'auth', 'admin', 'dashboard', 'search', 'services', 'insurance',
    'blog', 'claim-profile', 'list-your-practice', 'onboarding',
    'gmb-select', 'find-dentist', 'clinic', 'dentist', 'sitemap',
    'pricing', 'appointment', 'review', 'rq', 'tools', 'emergency-dentist',
    'editorial-policy', 'medical-review-policy', 'verification-policy',
    'home-v2', 'dashboard-v2', 'form', 'book'
  ];

  const isInvalidSlug = !stateSlug || staticRoutes.includes(stateSlug) || stateSlug.includes('/');

  // All hooks must be called before any conditional returns
  const { data: state, isLoading: stateLoading } = useStateData(normalizedStateSlug || '', stateDataProp);
  // Use SSR data if available, otherwise fetch client-side
  const { data: cities, isLoading: citiesLoading } = useCitiesByStateSlug(normalizedStateSlug || '', citiesDataProp);

  // SEO content is passed from getStaticProps - no client-side fetch needed
  const seoContent = allSeoDataProp; // From seo_pages table
  const pageContent = pageContentDataProp; // From page_content table
  
  const seoContentLoading = false;
  const seoContentFetching = false;
  const isSeoContentPending = false;

  // Fetch pinned profiles for this state page
  const { data: pinnedProfiles } = usePinnedProfiles('state', normalizedStateSlug);

  // City-level clinic counts (fallback when dentist_count is 0)
  const cityIds = (cities || []).map((c) => c.id);
  const { data: cityClinicCounts } = useQuery({
    queryKey: ["city-clinic-counts", stateSlug, cityIds.join(",")],
    queryFn: async () => {
      if (!cityIds.length) return {} as Record<string, number>;

      const { data, error } = await supabase
        .from("clinics")
        .select("city_id")
        .in("city_id", cityIds)
        .eq("is_active", true);

      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const id = row.city_id as string | null;
        if (!id) continue;
        counts[id] = (counts[id] || 0) + 1;
      }
      return counts;
    },
    enabled: cityIds.length > 0,
  });

  // Fetch profiles for this state - includes pinned clinics explicitly
  const hasServerProfiles = !!(clinicProfilesProp && clinicProfilesProp.length > 0 && state);
  const { data: rawProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['state-profiles', stateSlug, pinnedProfiles?.map(p => p.id).join(',')],
    queryFn: async () => {
      const pinnedIds = (pinnedProfiles || []).map(p => p.id);

      const { data: stateCities } = await supabase
        .from('cities')
        .select('id')
        .eq('state_id', state.id);

      if (!stateCities?.length) return [];

      const stateCityIds = stateCities.map(c => c.id);

      const { data: clinics } = await supabase
        .from('clinics')
        .select(`
          id, name, slug, description, cover_image_url, rating, review_count,
          address, phone, verification_status, claim_status,
          city:cities(name, slug, state:states(name, abbreviation))
        `)
        .in('city_id', stateCityIds)
        .eq('is_active', true)
        .order('rating', { ascending: false });

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
        location: c.city ? `${c.city.name}, ${c.city.state?.name || c.city.state?.abbreviation || ''}` : '',
        rating: c.rating || 0,
        reviewCount: c.review_count || 0,
        image: c.cover_image_url,
        isVerified: c.verification_status === 'verified',
        isClaimed: c.claim_status === 'claimed',
        isPinned: false,
      }));
    },
    enabled: !!state && !hasServerProfiles,
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
          location: c.city ? `${c.city.name}, ${c.city.state?.name || c.city.state?.abbreviation || ''}` : '',
          rating: c.rating || 0,
          reviewCount: c.review_count || 0,
          image: c.cover_image_url,
          isVerified: c.is_verified,
          isClaimed: c.is_claimed,
          isPinned: c.is_pinned,
        }))
      : undefined
  );

  // Sort profiles with pinned ones first
  const profiles = useMemo(() => {
    const source = hasServerProfiles && serverProfiles ? serverProfiles : rawProfiles;
    if (!source) return [];
    const sorted = sortWithPinnedFirst(source as any[], (pinnedProfiles || []) as any[]) as any[];
    // Mark pinned profiles
    const pinnedIds = new Set((pinnedProfiles || []).map(p => p.id));
    return sorted.map(p => ({ ...p, isPinned: pinnedIds.has(p.id) }));
  }, [rawProfiles, serverProfiles, hasServerProfiles, pinnedProfiles]);

  // Filters for state page (same as city page)
  const { filters: stateFilters, setFilters: setStateFilters } = useBudgetFilters();

  const filteredStateProfiles = useMemo(() => {
    let result = [...profiles];
    if (stateFilters.minRating > 0) {
      result = result.filter(p => (p.rating || 0) >= stateFilters.minRating);
    }
    if (stateFilters.verifiedOnly) {
      result = result.filter(p => p.isVerified);
    }
    return result;
  }, [profiles, stateFilters]);

  const hasActiveStateFilters = stateFilters.maxBudget !== null || stateFilters.minRating > 0 || stateFilters.verifiedOnly;
  const { data: treatments, isLoading: treatmentsLoading } = useTreatments();

  // Check if state data is available from server prefetch
  const hasStateData = !!state;
  
  // Signal prerender when ALL data is ready (including SEO content)
  const isDataReady = !stateLoading && !citiesLoading && !profilesLoading && !treatmentsLoading && !seoContentLoading && !seoContentFetching && !!state;

  // Now check for invalid slug after all hooks
  if (isInvalidSlug) {
    return <NotFound />;
  }

  // Redirect legacy full-name state slugs to canonical abbreviation slugs
  if (stateSlug && normalizedStateSlug && stateSlug !== normalizedStateSlug) {
    if (typeof window !== 'undefined') router.replace(`/${normalizedStateSlug}/`);
    return null;
  }

  // Build SEO data from available data
  const stateName = state?.name || '';
  const stateAbbr = state?.abbreviation || '';
  const seoTitle = seoContent?.meta_title || null;
  const seoDescription = seoContent?.meta_description || null;

  // If we don't have state data and it's still loading, show loading state with SEO
  if (!hasStateData && stateLoading) {
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
          canonical={seoDataProp?.canonical ?? `/${normalizedStateSlug}/`}
        />
        <div className="container py-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
      </PageLayout>
    );
  }

  if (!state) {
    return <NotFound />;
  }

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: stateName },
  ];

  // Parse SEO content if available
  const parsedContent = seoContent?.content ? parseMarkdownContent(seoContent.content) : null;
  // Use dedicated faqs column first (has question/answer format), fallback to parsing from content (now returns q/a format)
  const rawSeoFaqs = seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0
    ? seoContent.faqs
    : seoContent?.content ? parseFaqFromContent(seoContent.content) : [];
  // Normalize to { q, a } format for consistent rendering
  const seoFaqs = rawSeoFaqs.map(f => ('q' in f ? f : { q: (f as any).question, a: (f as any).answer }));

  // SSR FAQ data takes priority, then use client-fetched SEO content, then defaults
  const serverFaqs = faqsProp && faqsProp.length > 0 ? faqsProp : [];

  // Use SEO content if optimized, otherwise use defaults
  const pageTitle = pageContentDataProp?.meta_title || seoContent?.meta_title || seoDataProp?.title || null;
  const pageDescription = pageContentDataProp?.meta_description || seoContent?.meta_description || seoDataProp?.description || null;
  const pageH1 = pageContentDataProp?.h1 || seoContent?.h1 || seoH1Prop || null;

  // Use SEO FAQs if available, otherwise use defaults
  // Note: parseFaqFromContent now returns { q, a }[] format
  const faqs = serverFaqs.length > 0 ? serverFaqs : seoFaqs.length > 0 ? seoFaqs : [
    {
      q: `How do I find a dentist in ${stateName}?`,
      a: `Browse our verified list of dentists across ${stateName}. Select your city, then filter by specialty, rating, and insurance to find the perfect match.`,
    },
    {
      q: `Are dentists in ${stateName} verified?`,
      a: `All dentists on our platform are licensed professionals. Profiles with the "Verified" badge have completed our additional verification process.`,
    },
    {
      q: `What cities in ${stateName} do you cover?`,
      a: `We cover major cities across ${stateName} including ${cities?.slice(0, 5).map(c => c.name).join(', ') || 'multiple locations'}. More cities are being added regularly.`,
    },
    {
      q: `Can I book same-day appointments?`,
      a: `Many dental offices in ${stateName} offer same-day or next-day appointments. Use our search filters to find clinics with immediate availability.`,
    },
  ];

  const totalClinicCount = Object.values(cityClinicCounts || {}).reduce((a, b) => a + b, 0) || profiles?.length || 0;
  const popularTreatments = (treatments || []).slice(0, 8).map(t => ({ name: t.name, slug: t.slug }));
  const isDubaiFlagship = normalizedStateSlug === 'dubai';
  const featuredCityOrder = ['business-bay', 'jumeirah', 'palm-jumeirah', 'dubai-marina', 'downtown-dubai', 'deira', 'al-barsha', 'jlt', 'jumeirah-beach-residence', 'mirdif', 'bur-dubai', 'healthcare-city'];
  const orderedCities = [...(cities || [])].sort((left, right) => {
    if (!isDubaiFlagship) {
      return left.name.localeCompare(right.name);
    }

    const leftIndex = featuredCityOrder.indexOf(left.slug);
    const rightIndex = featuredCityOrder.indexOf(right.slug);

    if (leftIndex === -1 && rightIndex === -1) return left.name.localeCompare(right.name);
    if (leftIndex === -1) return 1;
    if (rightIndex === -1) return -1;
    return leftIndex - rightIndex;
  });
  const featuredCities = orderedCities.slice(0, 12);
  const remainingCities = orderedCities.slice(12);
  const heroDescription = isDubaiFlagship
    ? 'Explore Dubai dentist pages built as real landing destinations across Business Bay, Jumeirah, Palm Jumeirah, Dubai Marina, Downtown Dubai, Deira, and more. Each area routes directly into live providers and treatment pages.'
    : `Browse clinics and dentists across ${stateName}, compare trust signals, and move from discovery to booking through a more structured marketplace experience.`;
  const sanitizedStateBodyHtml = sanitizeCmsHtml(
    pageContent?.body_content
      ? pageContent.body_content
          .replace(/^##\s+(.+)$/gm, '<h2 class="text-2xl font-bold mb-4 mt-8">$1</h2>')
          .replace(/\n/g, '<br/>')
      : ''
  );

  return (
    <PageLayout>
      <SEOHead
        title={seoDataProp?.title ?? pageTitle}
        description={seoDataProp?.description ?? pageDescription}
        canonical={seoDataProp?.canonical ?? `/${normalizedStateSlug}/`}
        keywords={[`dentists ${stateName}`, `dental clinics ${stateName}`, `find dentist ${stateName}`, 'book dental appointment']}
      />
      <StructuredData
        data={{
          type: 'breadcrumb',
          items: [
            { name: 'Home', url: '/' },
            { name: stateName, url: `/${normalizedStateSlug}/` },
          ],
        }}
      />
      <StructuredData
        data={{
          type: 'faq',
          questions: faqs.map(f => ({ question: f.q || f.question, answer: f.a || f.answer })),
        }}
      />

      <MarketplaceHero
        align="center"
        breadcrumbs={breadcrumbs}
        badge={isDubaiFlagship ? 'Flagship Emirate Landing' : 'Emirate Marketplace'}
        title={pageH1 || `Find dentists across ${stateName}`}
        description={heroDescription}
        actions={[
          { href: '/search/', label: 'Search the Directory' },
          { href: '#browse-areas', label: isDubaiFlagship ? 'Browse Dubai Areas' : 'Browse Areas', variant: 'outline' },
        ]}
        stats={[
          { label: 'Areas in this emirate', value: `${cities?.length || 0}` },
          { label: 'Marketplace rating signal', value: '4.8' },
          { label: 'Booking speed', value: '60s' },
          { label: 'Trust layer', value: 'Licensed' },
        ]}
      />

      {/* Page Intro Section - CMS Content from page_content table - ONLY hero_intro, no heading */}
      <PageIntroSection
        title={null}
        content={pageContent?.hero_intro || null}
        isLoading={isSeoContentPending}
      />

      {isDubaiFlagship && featuredCities.length > 0 && (
        <Section size="sm">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-6 md:px-8">
            <div className="mb-5 flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Dubai Highlights</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">Start with Dubai&apos;s highest-demand districts</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">These area pages are the strongest navigation hubs for Dubai dentist discovery and treatment-level browsing.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {featuredCities.slice(0, 8).map((city, index) => (
                <Link
                  key={city.id}
                  href={`/${normalizedStateSlug}/${city.slug}/`}
                  className="rounded-3xl border border-border bg-background px-5 py-5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-lg font-semibold text-foreground">{city.name}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">#{index + 1}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Open local provider listings, dentist detail pages, and service-specific landing routes.</p>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Main Content: Dentists + Filters */}
      <Section size="lg">
        <div className="container px-4">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:gap-8">
            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full rounded-xl font-bold gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle>Filter Results</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto max-h-[calc(100vh-80px)]">
                    <BudgetFilterSidebar
                      filters={stateFilters}
                      onFiltersChange={setStateFilters}
                      availableServices={treatments?.map(t => ({ id: t.id, name: t.name, slug: t.slug })) || []}
                      locationName={stateName}
                      totalResults={filteredStateProfiles?.length || 0}
                      className="border-0 rounded-none shadow-none"
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0 self-start">
              <div className="sticky top-24">
                <BudgetFilterSidebar
                  filters={stateFilters}
                  onFiltersChange={setStateFilters}
                  availableServices={treatments?.map(t => ({ id: t.id, name: t.name, slug: t.slug })) || []}
                  locationName={stateName}
                  totalResults={filteredStateProfiles?.length || 0}
                />
              </div>
            </aside>

            {/* Main Content Column */}
            <div className="min-w-0 flex-1 space-y-6">
              <DentistListFrame
                profiles={filteredStateProfiles}
                isLoading={profilesLoading}
                locationName={stateName}
                emptyMessage={`We're adding dentists in ${stateName}. Check back soon!`}
                hasActiveFilters={hasActiveStateFilters}
                onClearFilters={() => setStateFilters({ maxBudget: null, minRating: 0, verifiedOnly: false, selectedServices: [] })}
                maxHeight={700}
                initialCount={10}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* SECTION 3: Areas (Text Links) */}
      <Section id="browse-areas" size="md">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-6 md:px-8">
          <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Browse by Area</span>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Areas in <span className="text-primary">{stateName}</span>
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                {isDubaiFlagship
                  ? 'Start with the highest-intent Dubai districts and move directly into their live clinic and service pages.'
                  : `Open the strongest area pages in ${stateName} and jump straight into local provider discovery.`}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">{cities?.length || 0} live area pages</div>
          </div>

          {citiesLoading ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-3xl" />
              ))}
            </div>
          ) : featuredCities.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featuredCities.map((city) => (
                <Link
                  key={city.id}
                  href={`/${normalizedStateSlug}/${city.slug}/`}
                  className="group rounded-3xl border border-border bg-background px-5 py-5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground group-hover:text-primary">{city.name}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Explore live dentist listings, local treatment pages, and booking-ready provider inventory.
                      </p>
                    </div>
                    <span className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Area page
                    </span>
                  </div>
                  <div className="mt-4 text-sm font-medium text-primary">Open {city.name}</div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">We're adding areas in {stateName}. Check back soon!</p>
          )}
        </div>
      </Section>

      {remainingCities.length > 0 && (
        <Section size="sm">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-6 md:px-8">
            <div className="mb-5 flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Full Location Index</p>
                <h2 className="mt-1 text-2xl font-bold text-foreground">All live area pages in {stateName}</h2>
              </div>
              <p className="text-sm text-muted-foreground">Every linked area below opens its dedicated landing page.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {orderedCities.map((city) => (
                <Link
                  key={city.id}
                  href={`/${normalizedStateSlug}/${city.slug}/`}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                >
                  {city.name}
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* SEO Content Section */}
      <Section size="lg">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-6 md:px-8">
          <SEOContentBlock
            variant="state"
            locationName={stateName}
            stateAbbr={stateAbbr}
            stateSlug={stateSlug}
            clinicCount={totalClinicCount}
            cityCount={cities?.length || 0}
            parsedContent={parsedContent}
            popularTreatments={popularTreatments}
            isLoading={seoContentLoading || seoContentFetching}
          />
        </div>
      </Section>

      {/* Content Section - from page_content body_content */}
      {sanitizedStateBodyHtml && (
        <Section size="md">
          <div className="container px-4 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border bg-card px-6 py-6 md:px-8 prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: sanitizedStateBodyHtml }} />
            </div>
          </div>
        </Section>
      )}

      {/* SECTION 6: Geographic Link Block - SEO Authority Distribution */}
      <Section size="md">
        <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-6 md:px-8">
          <GeographicLinkBlock
            pageType="state"
            stateSlug={normalizedStateSlug || ''}
            stateName={stateName}
            topCities={(orderedCities || []).slice(0, 8).map(c => ({ name: c.name, slug: c.slug }))}
            services={popularTreatments}
          />
        </div>
      </Section>

      {/* SECTION 7: Services Links */}
      {treatments && treatments.length > 0 && (
        <Section size="md">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border bg-card px-6 py-6 md:px-8">
            <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Browse Services</span>
                <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  Dental Treatments in <span className="text-primary">{stateName}</span>
                </h2>
              </div>
              <div className="text-sm text-muted-foreground">{treatments.length} treatment routes</div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {treatments.map((treatment) => (
                <Link
                  key={treatment.id}
                  href={`/${normalizedStateSlug}/services/${treatment.slug}/`}
                  className="rounded-3xl border border-border bg-background px-5 py-5 transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <p className="text-lg font-semibold text-foreground">{treatment.name}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Compare live providers for {treatment.name.toLowerCase()} across {stateName}.</p>
                  <div className="mt-4 text-sm font-medium text-primary">Open treatment page</div>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* FAQs Section from page_content - after Browse Services */}
      {pageContent?.faqs && Array.isArray(pageContent.faqs) && pageContent.faqs.length > 0 && (
        <Section size="md">
          <div className="container px-4 max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border bg-card px-6 py-6 md:px-8 space-y-4">
              {pageContent.faqs.map((faq: any, index: number) => (
                <div key={index} className="rounded-2xl border border-border bg-background p-4">
                  <h3 className="font-semibold mb-2">{faq.question || faq.q}</h3>
                  <p className="text-muted-foreground">{faq.answer || faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}
    </PageLayout>
  );
};

export default StatePage;
