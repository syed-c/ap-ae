'use client';
import { useState as useReactState, useMemo } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageLayout } from "@/components/layout/PageLayout";
import { ConversationalQABlock, AIDiscoveryMeta } from "@/components/ai-seo";
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
import { useSeoPageContent, parseMarkdownContent, parseFaqFromContent } from "@/hooks/useSeoPageContent";
import { usePrerenderReady } from "@/hooks/usePrerenderReady";
import { usePinnedProfiles, sortWithPinnedFirst } from "@/hooks/usePinnedProfiles";
import { useAreaLocalContent, generateAreaIntro } from "@/hooks/useAreaLocalContent";
import { normalizeStateSlug } from "@/lib/slug/normalizeStateSlug";
import NotFound from "./NotFound";
import StateServicePage from "./StateServicePage";
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

const MIN_DENTIST_COUNT = 2; // noindex pages with fewer than 2 dentists

const CityPage = () => {
  const { stateSlug, citySlug } = useParams();
  const normalizedStateSlug = normalizeStateSlug(stateSlug);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useReactState(false);
  const { filters, setFilters } = useBudgetFilters();
  
  const { data: state, isLoading: stateLoading } = useStateData(normalizedStateSlug || '');
  const { data: city, isLoading: cityLoading } = useCity(citySlug || '', normalizedStateSlug || '');

  // Check if "citySlug" is actually a treatment slug (for state-level service pages like /dubai/teeth-whitening/)
  const { data: treatmentMatch, isLoading: treatmentMatchLoading } = useQuery({
    queryKey: ['treatment-match', citySlug],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('id, name, slug, description')
        .eq('slug', citySlug || '')
        .eq('is_active', true)
        .maybeSingle();
      return data;
    },
    enabled: !!citySlug,
  });

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

  // Fetch treatments
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

  // Fetch nearby cities for internal linking
  const { data: nearbyCities, isLoading: nearbyCitiesLoading } = useCitiesByStateSlug(normalizedStateSlug || '');

  // Signal prerender when ALL SEO-critical data loads
  // Includes: location data, profiles (for listings), treatments, nearby cities (internal links), and SEO content
  const isDataReady = !stateLoading && !cityLoading && !profilesLoading && !treatmentsLoading && !nearbyCitiesLoading && !seoContentLoading && !seoContentFetching;
  usePrerenderReady(isDataReady, { delay: 600 });

  if (!stateSlug || !citySlug) {
    return <NotFound />;
  }

  if (stateSlug && normalizedStateSlug && stateSlug !== normalizedStateSlug) {
    return <Navigate to={`/${normalizedStateSlug}/${citySlug}/`} replace />;
  }

  if (stateSlug === "clinic") {
    return <Navigate to={`/clinic/${citySlug}/`} replace />;
  }
  if (stateSlug === "dentist") {
    return <Navigate to={`/dentist/${citySlug}/`} replace />;
  }
  
  if (stateLoading || cityLoading) {
    return (
      <PageLayout>
        <div className="container py-12">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>
      </PageLayout>
    );
  }

  if (!state || !city) {
    // If city not found but the slug matches a treatment, render state-level service page
    if (state && !city && treatmentMatch && !treatmentMatchLoading) {
      return (
        <StateServicePage
          stateSlug={stateSlug || ''}
          serviceSlug={citySlug || ''}
          stateName={state.name}
          stateId={state.id}
          treatment={treatmentMatch}
        />
      );
    }
    // Still loading treatment check
    if (!city && treatmentMatchLoading) {
      return (
        <PageLayout>
          <div className="container py-12">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
        </PageLayout>
      );
    }
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
  // Use dedicated faqs column first, fallback to parsing from content for legacy pages
  const seoFaqs = seoContent?.faqs && Array.isArray(seoContent.faqs) && seoContent.faqs.length > 0
    ? seoContent.faqs
    : seoContent?.content ? parseFaqFromContent(seoContent.content) : [];

  const pageTitle = seoContent?.meta_title || `Best Dentists in ${cityName}, ${stateAbbr} - Find Dental Clinics`;
  const pageDescription = seoContent?.meta_description || `Find and book appointments with top-rated dental professionals in ${cityName}, ${stateName}. Compare ${profiles?.length || 0}+ verified clinics.`;
  const pageH1 = seoContent?.h1 || `Best Dentists in ${locationDisplay}`;
  
  const faqs = seoFaqs.length > 0 ? seoFaqs.map(f => ({ q: f.question, a: f.answer })) : [
    {
      q: `How do I find a good dentist in ${cityName}?`,
      a: `Browse our verified list of dentists in ${cityName}. Look for verified badges, patient reviews, and specializations that match your needs.`,
    },
    {
      q: `Are the dentists in ${cityName} verified?`,
      a: `All dentists on our platform are licensed professionals. Profiles with the "Verified" badge have claimed and completed our verification process.`,
    },
    {
      q: `How much does dental treatment cost in ${cityName}?`,
      a: `Dental costs vary by treatment. A basic checkup typically ranges from 150-400 AED, while specialized treatments can range from 2,500-6,000 AED.`,
    },
    {
      q: `Can I book emergency dental appointments in ${cityName}?`,
      a: `Yes, many clinics in ${cityName} offer same-day emergency appointments. Use our search to find clinics with emergency availability.`,
    },
  ];

  const shouldNoIndex = !profilesLoading && (!profiles || profiles.length < MIN_DENTIST_COUNT);

  const popularTreatments = (treatments || []).map(t => ({ name: t.name, slug: t.slug }));
  const nearbyLocations = (nearbyCities || [])
    .filter(c => c.slug !== citySlug)
    .slice(0, 6)
    .map(c => ({ name: c.name, slug: c.slug }));

  const hasActiveFilters = filters.maxBudget !== null || filters.minRating > 0 || filters.verifiedOnly;

  return (
    <PageLayout>
      <SEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={`/${normalizedStateSlug}/${citySlug}/`}
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
            questions: faqs.map(f => ({ question: f.q, answer: f.a })),
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
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3 px-2" 
              style={{ fontFamily: "'Varela Round', system-ui, sans-serif" }}
            >
              {pageH1.includes(cityName) ? (
                <>
                  <span className="text-white">{pageH1.split(cityName)[0]}</span>
                  <span className="text-primary">{cityName}</span>
                  <span className="text-white">{pageH1.split(cityName)[1] || ''}</span>
                </>
              ) : (
                <span className="text-white">{pageH1}</span>
              )}
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base lg:text-lg text-white/40 mb-6 max-w-2xl mx-auto px-2"
            >
              {areaLocalContent.hasLocalContext
                ? `Discover dental clinics serving ${areaLocalContent.demographics} in this ${areaLocalContent.character} community.`
                : `Find and book appointments with top-rated dental professionals in ${cityName}. Compare verified clinics and read patient reviews.`
              }
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
        title={parsedContent?.sections?.[0]?.heading || `About Dental Care in ${cityName}`}
        content={(seoContent as any)?.page_intro || parsedContent?.intro || parsedContent?.sections?.[0]?.content || generateAreaIntro(cityName, stateName, totalClinicCount || profiles?.length || 0, areaLocalContent)}
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
              ...faqs.map(f => ({ question: f.q, answer: f.a })),
              ...generateCityQA({ name: cityName, stateName, clinicCount: profiles?.length })
                .filter(cq => !faqs.some(f => f.q.toLowerCase().includes(cq.question.split(' ').slice(0, 4).join(' ').toLowerCase())))
                .slice(0, 3),
            ]}
            contextLabel={`city-${citySlug}`}
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
        faqs={faqs.map(f => ({ question: f.q, answer: f.a }))}
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
