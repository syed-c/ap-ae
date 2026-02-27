'use client';
import { useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
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
import { useSeoPageContent, parseMarkdownContent, parseFaqFromContent } from "@/hooks/useSeoPageContent";
import { usePrerenderReady } from "@/hooks/usePrerenderReady";
import { usePinnedProfiles, sortWithPinnedFirst } from "@/hooks/usePinnedProfiles";
import { normalizeStateSlug } from "@/lib/slug/normalizeStateSlug";
import NotFound from "./NotFound";
import { 
  Star, Shield, Clock, Building2, ArrowRight, SlidersHorizontal
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

const StatePage = () => {
  const { stateSlug } = useParams();

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
  const { data: state, isLoading: stateLoading } = useStateData(normalizedStateSlug || '');
  const { data: cities, isLoading: citiesLoading } = useCitiesByStateSlug(normalizedStateSlug || '');
  
  // Fetch SEO content from seo_pages table
  const { data: seoContent, isLoading: seoContentLoading, isFetching: seoContentFetching } = useSeoPageContent(normalizedStateSlug || '');

  // IMPORTANT: Don't hide content during background refetches - only show loading state when no data exists
  const isSeoContentPending = !seoContent && (seoContentLoading || seoContentFetching);

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
  const { data: rawProfiles, isLoading: profilesLoading } = useQuery({
    queryKey: ['state-profiles', stateSlug, pinnedProfiles?.map(p => p.id).join(',')],
    queryFn: async () => {
      if (!state) return [];
      
      // Get IDs of pinned clinics
      const pinnedIds = (pinnedProfiles || []).map(p => p.id);
      
      // Get city IDs for this state
      const { data: stateCities } = await supabase
        .from('cities')
        .select('id')
        .eq('state_id', state.id);
      
      if (!stateCities?.length) return [];
      
      const stateCityIds = stateCities.map(c => c.id);
      
      // Get clinics in these cities
      const { data: clinics } = await supabase
        .from('clinics')
        .select(`
          id, name, slug, description, cover_image_url, rating, review_count,
          address, phone, verification_status, claim_status,
          city:cities(name, slug, state:states(name, abbreviation))
        `)
        .in('city_id', stateCityIds)
        .eq('is_active', true)
        .order('rating', { ascending: false })
        .limit(50);
      
      // If there are pinned IDs not in the result, fetch them separately
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
      
      // Combine and dedupe
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
    enabled: !!state,
  });

  // Sort profiles with pinned ones first
  const profiles = useMemo(() => {
    if (!rawProfiles) return [];
    const sorted = sortWithPinnedFirst(rawProfiles, pinnedProfiles || []);
    // Mark pinned profiles
    const pinnedIds = new Set((pinnedProfiles || []).map(p => p.id));
    return sorted.map(p => ({ ...p, isPinned: pinnedIds.has(p.id) }));
  }, [rawProfiles, pinnedProfiles]);

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
  const { data: treatments, isLoading: treatmentsLoading } = useQuery({
    queryKey: ["treatments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("treatments")
        .select("*")
        .eq("is_active", true)
        .order("display_order")
        .limit(8);
      return data || [];
    },
  });

  // Signal prerender when ALL data is ready (including SEO content)
  const isDataReady = !stateLoading && !citiesLoading && !profilesLoading && !treatmentsLoading && !seoContentLoading && !seoContentFetching && !!state;
  usePrerenderReady(isDataReady);

  // Now check for invalid slug after all hooks
  if (isInvalidSlug) {
    return <NotFound />;
  }

  // Redirect legacy full-name state slugs to canonical abbreviation slugs
  if (stateSlug && normalizedStateSlug && stateSlug !== normalizedStateSlug) {
    return <Navigate to={`/${normalizedStateSlug}/`} replace />;
  }

  if (stateLoading) {
    return (
      <PageLayout>
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

  const stateName = state.name;
  const stateAbbr = state.abbreviation;

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: stateName },
  ];

  // Parse SEO content if available
  const parsedContent = seoContent?.content ? parseMarkdownContent(seoContent.content) : null;
  // Use dedicated faqs column first, fallback to parsing from content for legacy pages
  const seoFaqs = seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0
    ? seoContent.faqs
    : seoContent?.content ? parseFaqFromContent(seoContent.content) : [];

  // Use SEO content if optimized, otherwise use defaults
  const pageTitle = seoContent?.meta_title || `Find Dentists in ${stateName} - Top Dental Clinics in ${stateName}`;
  const pageDescription = seoContent?.meta_description || `Find and book appointments with top-rated dental professionals in ${stateName}. Compare verified clinics across ${cities?.length || 0}+ areas.`;
  const pageH1 = seoContent?.h1 || `Find Dentists in ${stateName}`;

  // Use SEO FAQs if available, otherwise use defaults
  const faqs = seoFaqs.length > 0 ? seoFaqs.map(f => ({ q: f.question, a: f.answer })) : [
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
  const popularTreatments = (treatments || []).map(t => ({ name: t.name, slug: t.slug }));

  return (
    <PageLayout>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`/${normalizedStateSlug}/`}
        keywords={[`dentists ${stateName}`, `dental clinics ${stateName}`, `find dentist ${stateName}`, 'book dental appointment']}
      />
      <StructuredData
        type="breadcrumb"
        items={[
          { name: 'Home', url: '/' },
          { name: stateName, url: `/${normalizedStateSlug}/` },
        ]}
      />
      <StructuredData
        type="faq"
        questions={faqs.map(f => ({ question: f.q, answer: f.a }))}
      />
      
      {/* SECTION 1: Hero — Dark theme matching homepage */}
      <section className="relative overflow-hidden min-h-[50vh] flex items-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-teal/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
        </div>
        
        <div className="container relative z-10 py-16 md:py-20 px-5 md:px-8">
          <div className="flex justify-center mb-6">
            <Breadcrumbs items={breadcrumbs} className="[&_a]:text-white/60 [&_span]:text-white/40 [&_svg]:text-white/30" />
          </div>
          
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/15 backdrop-blur-md border border-primary/30 rounded-full px-4 py-2 mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-primary">Licensed Dental Professionals</span>
            </div>
            
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 px-2" style={{ fontFamily: "'Varela Round', system-ui, sans-serif" }}>
              {pageH1.includes(stateName) ? (
                <>
                  <span className="text-white">{pageH1.split(stateName)[0]}</span>
                  <span className="text-primary">{stateName}</span>
                </>
              ) : (
                <span className="text-white">{pageH1}</span>
              )}
            </h1>
            
            <p className="text-lg md:text-xl text-white/40 mb-8 max-w-2xl mx-auto">
              Discover top-rated dental professionals across {stateName}. Browse by city, compare reviews, and book your appointment online.
            </p>

            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Link to="/search">
                <Button size="lg" className="h-12 px-6 font-bold rounded-2xl">
                  Find a Dentist <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 md:flex md:flex-wrap md:justify-center md:gap-4 px-2">
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl px-3 py-2 md:px-5 md:py-3">
                <Building2 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span className="font-bold text-sm md:text-base text-white">{cities?.length || 0}</span>
                <span className="text-[10px] md:text-sm text-white/50 hidden md:inline">Areas</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl px-3 py-2 md:px-5 md:py-3">
                <Star className="h-4 w-4 md:h-5 md:w-5 text-gold fill-gold" />
                <span className="font-bold text-sm md:text-base text-white">4.8</span>
                <span className="text-[10px] md:text-sm text-white/50 hidden md:inline">Avg. Rating</span>
              </div>
              <div className="flex flex-col md:flex-row items-center gap-1 md:gap-2 bg-white/[0.06] backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl px-3 py-2 md:px-5 md:py-3">
                <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                <span className="font-bold text-sm md:text-base text-white">60s</span>
                <span className="text-[10px] md:text-sm text-white/50 hidden md:inline">Book</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full h-12 md:h-16" preserveAspectRatio="none">
            <path d="M0 80V40C240 10 480 0 720 20C960 40 1200 50 1440 30V80H0Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* Page Intro Section - CMS Content */}
      <PageIntroSection
        title={parsedContent?.sections?.[0]?.heading || `About Dental Care in ${stateName}`}
        content={(seoContent as any)?.page_intro || parsedContent?.intro || parsedContent?.sections?.[0]?.content || `Discover top-rated dental professionals across ${stateName}. Browse by city, compare reviews, and book your appointment online.`}
        isLoading={isSeoContentPending}
      />

      {/* Main Content: Dentists + Filters */}
      <Section size="lg">
        <div className="container px-4">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 max-w-6xl mx-auto">
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
            <aside className="hidden lg:block w-72 shrink-0">
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
            <div className="flex-1 min-w-0 space-y-8">
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
      <Section size="md">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Browse by Area</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Areas in <span className="text-primary">{stateName}</span>
            </h2>
          </div>
          
          {citiesLoading ? (
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          ) : cities && cities.length > 0 ? (
            <div className="flex flex-wrap gap-x-1 gap-y-1.5">
              {cities.map((city, i) => (
                <span key={city.id}>
                  <Link
                    to={`/${normalizedStateSlug}/${city.slug}/`}
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                  >
                    {city.name}
                  </Link>
                  {i < cities.length - 1 && <span className="text-muted-foreground mx-1">·</span>}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">We're adding areas in {stateName}. Check back soon!</p>
          )}
        </div>
      </Section>

      {/* SEO Content Section */}
      <Section size="lg">
        <div className="max-w-5xl mx-auto">
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

      {/* SECTION 5: FAQ */}
      <Section size="lg" className="bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Have Questions?</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Frequently Asked <span className="text-primary">Questions</span>
            </h2>
          </div>
          
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="bg-card border border-border rounded-2xl px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left font-bold hover:no-underline py-5">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* SECTION 6: Geographic Link Block - SEO Authority Distribution */}
      <Section size="md">
        <div className="max-w-5xl mx-auto">
          <GeographicLinkBlock
            pageType="state"
            stateSlug={normalizedStateSlug || ''}
            stateName={stateName}
            topCities={(cities || []).slice(0, 8).map(c => ({ name: c.name, slug: c.slug }))}
            services={popularTreatments}
          />
        </div>
      </Section>

      {/* SECTION 7: Services Links */}
      {treatments && treatments.length > 0 && (
        <Section size="md">
          <div className="max-w-4xl mx-auto">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-widest mb-2">Browse Services</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">
              Dental Treatments in <span className="text-primary">{stateName}</span>
            </h2>
            <div className="flex flex-wrap gap-x-2 gap-y-2">
              {treatments.map((treatment, idx) => (
                <span key={treatment.id} className="inline-flex items-center">
                  <Link
                    to={`/${normalizedStateSlug}/${treatment.slug}/`}
                    className="text-primary hover:text-primary/80 font-semibold hover:underline transition-colors"
                  >
                    {treatment.name}
                  </Link>
                  {idx < treatments.length - 1 && <span className="text-muted-foreground ml-2">·</span>}
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}
    </PageLayout>
  );
};

export default StatePage;
