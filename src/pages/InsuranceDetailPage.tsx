'use client';
import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { PageLayout } from "@/components/layout/PageLayout";
import { Section } from "@/components/layout/Section";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { InsuranceInternalLinks } from "@/components/seo/InsuranceInternalLinks";
import {
  useInsuranceClinics,
  useInsuranceFilterOptions
} from "@/hooks/useInsuranceClinics";
import { InsuranceClinicRow } from "@/components/insurance/InsuranceClinicRow";
import { InsurancePagination } from "@/components/insurance/InsurancePagination";
import { InsuranceFilters } from "@/components/insurance/InsuranceFilters";
import { InsuranceFAQ } from "@/components/insurance/InsuranceFAQ";
import { buildInsuranceUrl } from "@/lib/url/buildProfileUrl";
import { withTrailingSlash } from "@/lib/url/withTrailingSlash";
import {
  Shield, Building2, BadgeCheck, Phone, ArrowLeft,
  FileCheck, Sparkles, HeadphonesIcon, MapPin
} from "lucide-react";

const PAGE_SIZE = 20;

interface InsuranceDetailPageProps {
  insuranceSlugProp?: string;
  emirateSlugProp?: string;
  citySlugProp?: string;
  insuranceDataProp?: any;
  emirateDataProp?: any;
  cityDataProp?: any;
  clinicCountProp?: number;
  seoDataProp?: { title: string; description: string; canonical: string };
  initialClinicsProp?: any[];
  availableEmiratesProp?: { name: string; slug: string }[];
  filterCitiesProp?: any[];
  insuranceLinksProp?: { name: string; slug: string }[];
  serviceLinksProp?: { name: string; slug: string }[];
  dehydratedStateProp?: any;
}

const InsuranceDetailPage = ({ 
  insuranceSlugProp, 
  emirateSlugProp, 
  citySlugProp,
  insuranceDataProp,
  emirateDataProp,
  cityDataProp,
  clinicCountProp,
  seoDataProp,
  initialClinicsProp,
  availableEmiratesProp,
  filterCitiesProp,
  insuranceLinksProp,
  serviceLinksProp,
}: InsuranceDetailPageProps) => {
  const router = useRouter();
  const routerSlug = router.query.slug;
  const slugSegments = Array.isArray(routerSlug) ? routerSlug : [];
  const insuranceSlug = insuranceSlugProp || slugSegments[0] || "";
  const emirateSlug = emirateSlugProp || slugSegments[1] || "";
  const urlCitySlug = citySlugProp || slugSegments[2] || "";
  const searchParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const slug = insuranceSlug || "";

  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const sortParam = searchParams.get("sort") as "rating" | "reviews" | "name" | null;
  const ratingParam = searchParams.get("rating");

  // Use URL segments for location filtering
  const cityFilter = urlCitySlug || searchParams.get("city");
  const stateFilter = emirateSlug || searchParams.get("state");

  const [sortBy, setSortBy] = useState<"rating" | "reviews" | "name">(sortParam || "rating");
  const [minRating, setMinRating] = useState<number | undefined>(
    ratingParam ? parseFloat(ratingParam) : undefined
  );

  // Fetch insurance details
  const { data: insurance, isLoading: insuranceLoading } = useQuery({
    queryKey: ["insurance", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("insurances")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      return data;
    },
    initialData: insuranceDataProp || undefined,
  });

  // Fetch emirate data if URL segment present
  const { data: emirateData } = useQuery({
    queryKey: ["emirate-info", emirateSlug],
    queryFn: async () => {
      if (!emirateSlug) return null;
      const { data } = await supabase
        .from("states")
        .select("id, name, slug, abbreviation")
        .eq("slug", emirateSlug)
        .maybeSingle();
      return data;
    },
    initialData: emirateDataProp || undefined,
    enabled: !!emirateSlug,
  });

  // Fetch city data if URL segment present
  const { data: cityData } = useQuery({
    queryKey: ["city-info", urlCitySlug, emirateSlug],
    queryFn: async () => {
      if (!urlCitySlug) return null;
      const { data } = await supabase
        .from("cities")
        .select("id, name, slug, state:states(slug, name)")
        .eq("slug", urlCitySlug)
        .maybeSingle();
      return data;
    },
    enabled: !!urlCitySlug,
  });

  // Fetch paginated clinics
  const { clinics, totalCount, totalPages, isLoading: clinicsLoading } = useInsuranceClinics({
    insuranceId: insurance?.id,
    cityFilter,
    stateFilter,
    page: currentPage,
    pageSize: PAGE_SIZE,
    sortBy,
    minRating,
    initialData: initialClinicsProp ? { clinics: initialClinicsProp as any[], totalCount: clinicCountProp || initialClinicsProp.length } : undefined,
  });

  const { cities } = useInsuranceFilterOptions(insurance?.id, filterCitiesProp);

  // Fetch emirates that have clinics with this insurance
  const { data: availableEmirates } = useQuery({
    queryKey: ["insurance-emirates", insurance?.id],
    queryFn: async () => {
      if (!insurance?.id) return [];
      const { data } = await supabase
        .from("states")
        .select("name, slug")
        .eq("is_active", true)
        .order("display_order");
      return data || [];
    },
    enabled: !!insurance?.id,
    initialData: availableEmiratesProp || undefined,
  });

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) params.delete("page"); else params.set("page", String(page));
    router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, { shallow: true });
  }, [searchParams, router]);

  const handleCityChange = useCallback((citySlug: string | null, stateSlug: string | null) => {
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (citySlug && stateSlug) {
      params.set("city", citySlug);
      params.set("state", stateSlug);
    } else {
      params.delete("city");
      params.delete("state");
    }
    router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, { shallow: true });
  }, [searchParams, router]);

  const handleSortChange = useCallback((sort: "rating" | "reviews" | "name") => {
    setSortBy(sort);
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    params.set("sort", sort);
    router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, { shallow: true });
  }, [searchParams, router]);

  const handleRatingChange = useCallback((rating: number | undefined) => {
    setMinRating(rating);
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (rating) params.set("rating", String(rating)); else params.delete("rating");
    router.replace({ pathname: router.pathname, query: Object.fromEntries(params) }, undefined, { shallow: true });
  }, [searchParams, router]);

  const handleClearFilters = useCallback(() => {
    setMinRating(undefined);
    setSortBy("rating");
    const path = router.asPath.split('?')[0];
    router.replace(path);
  }, [router]);

  // Build breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { label: "Home", href: "/" },
      { label: "Insurance", href: "/insurance/" },
    ];
    if (insurance) {
      crumbs.push({ label: insurance.name, href: buildInsuranceUrl(insurance.slug) });
    }
    if (emirateData) {
      crumbs.push({ label: emirateData.name, href: buildInsuranceUrl(slug, emirateData.slug) });
    }
    if (cityData) {
      const cityName = (cityData as any)?.name || urlCitySlug;
      crumbs.push({ label: cityName, href: buildInsuranceUrl(slug, emirateSlug!, urlCitySlug!) });
    }
    return crumbs;
  }, [insurance, emirateData, cityData, slug, emirateSlug, urlCitySlug]);

  // Location title suffix
  const locationSuffix = cityData
    ? ` in ${(cityData as any)?.name}`
    : emirateData
      ? ` in ${emirateData.name}`
      : "";

  if (insuranceLoading) {
    return (
      <PageLayout>
        <SEOHead title="Loading Insurance Provider" description="Loading dental insurance provider information." canonical={`/insurance/${slug}/`} />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!insurance) {
    return (
      <PageLayout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center px-4 max-w-md">
            <span className="text-8xl font-black bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">404</span>
            <h1 className="mb-3 text-2xl font-bold">Insurance Not Found</h1>
            <p className="mb-6 text-muted-foreground">This insurance provider doesn't exist or has been removed.</p>
            <div className="flex gap-3 justify-center">
              <Button asChild><Link href="/insurance/"><Shield className="h-4 w-4 mr-2" />Browse All Insurance</Link></Button>
              <Button asChild variant="outline"><Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Home</Link></Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const canonicalUrl = seoDataProp?.canonical || buildInsuranceUrl(insurance.slug, emirateSlug, urlCitySlug);

  return (
    <PageLayout>
      <SEOHead
        title={seoDataProp?.title || `${insurance.name} Dentists${locationSuffix} - Find Providers | UAE`}
        description={seoDataProp?.description || `Find ${totalCount}+ dental clinics accepting ${insurance.name}${locationSuffix}. Direct billing, pre-approval assistance. Book today.`}
        canonical={canonicalUrl}
        keywords={[`${insurance.name} dental`, `${insurance.name} dentist UAE`, `dental insurance ${locationSuffix}`]}
      />

      <MarketplaceHero
        breadcrumbs={breadcrumbs}
        badge="Insurance Marketplace"
        title={`${insurance.name}${locationSuffix}`}
        description={(insurance as any).description || `Find dental clinics that accept ${insurance.name} insurance with direct billing${locationSuffix}.`}
        actions={[
          { href: '/search/', label: 'Search All Providers' },
          { href: '/insurance/', label: 'All Insurance Networks', variant: 'outline' },
        ]}
        stats={[
          { label: 'Clinics accepting this plan', value: `${totalCount}`, icon: <Building2 className="h-5 w-5" /> },
          { label: 'Provider quality', value: 'Verified', icon: <BadgeCheck className="h-5 w-5" /> },
          { label: 'Claims flow', value: 'Direct billing', icon: <FileCheck className="h-5 w-5" /> },
          { label: 'Coverage focus', value: locationSuffix ? 'Local view' : 'UAE-wide', icon: <MapPin className="h-5 w-5" /> },
        ]}
      >
        {(insurance as any).coverage_notes && (
          <div className="marketplace-panel max-w-3xl p-4 md:p-5">
            <h3 className="text-sm font-black text-foreground">Coverage Notes</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">{(insurance as any).coverage_notes}</p>
          </div>
        )}

        {availableEmirates && availableEmirates.length > 0 && !urlCitySlug && (
          <div className="mt-4 flex max-w-4xl flex-wrap gap-2">
            <Link
              href={buildInsuranceUrl(insurance.slug)}
              className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${!emirateSlug ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 bg-white/5 text-white/75 hover:border-primary/35 hover:text-white'}`}
            >
              All Emirates
            </Link>
            {availableEmirates.map((em) => (
              <Link
                key={em.slug}
                href={buildInsuranceUrl(insurance.slug, em.slug)}
                className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${emirateSlug === em.slug ? 'border-primary bg-primary text-primary-foreground' : 'border-white/10 bg-white/5 text-white/75 hover:border-primary/35 hover:text-white'}`}
              >
                {em.name}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { icon: FileCheck, title: 'Direct Billing', desc: 'No upfront payment required' },
            { icon: Sparkles, title: 'Pre-Approval', desc: 'Clinics handle paperwork' },
            { icon: HeadphonesIcon, title: 'Claims Help', desc: 'Assistance with claims' },
          ].map((benefit) => (
            <div key={benefit.title} className="marketplace-panel max-w-sm p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <benefit.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-foreground">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </MarketplaceHero>

      {/* Main Content */}
      <Section size="md">
        <InsuranceFilters
          totalCount={totalCount}
          cities={cities}
          selectedCity={cityFilter}
          selectedState={stateFilter}
          sortBy={sortBy}
          minRating={minRating}
          onCityChange={handleCityChange}
          onSortChange={handleSortChange}
          onRatingChange={handleRatingChange}
          onClearFilters={handleClearFilters}
        />

        {clinicsLoading ? (
          <div className="space-y-3 mt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : clinics.length > 0 ? (
          <>
            <div className="space-y-3 mt-6">
              {clinics.map((clinic) => (
                <InsuranceClinicRow key={clinic.id} clinic={clinic} insuranceName={insurance.name} />
              ))}
            </div>
            <div className="mt-8">
              <InsurancePagination
                currentPage={currentPage}
                totalPages={totalPages}
                baseUrl={canonicalUrl}
                onPageChange={handlePageChange}
              />
            </div>
          </>
        ) : (
          <div className="text-center py-16 rounded-xl border border-dashed border-border mt-6">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No Clinics Found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {cityFilter ? "No clinics match your filters." : `Adding clinics accepting ${insurance.name}${locationSuffix}.`}
            </p>
            {cityFilter && <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>}
          </div>
        )}
      </Section>

      {/* FAQ */}
      <Section variant="muted" size="md">
        <InsuranceFAQ insuranceName={insurance.name} />
      </Section>

      {/* Internal Links */}
      <Section size="md">
        <InsuranceInternalLinks
          currentInsuranceSlug={insurance.slug}
          currentStateSlug={emirateSlug}
          currentCitySlug={urlCitySlug}
          insurancesProp={insuranceLinksProp}
          servicesProp={serviceLinksProp}
          emiratesProp={availableEmiratesProp}
        />
      </Section>

      {/* CTA */}
      <Section size="sm">
        <div className="rounded-2xl p-6 md:p-8 bg-gradient-to-br from-primary/5 to-teal/5 border border-primary/20 text-center">
          <h2 className="font-display text-xl md:text-2xl font-bold mb-2">Need Help Finding Coverage?</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Contact us and we'll help you find clinics that accept your insurance.
          </p>
          <Button asChild className="rounded-xl font-bold">
            <Link href="/contact/"><Phone className="h-4 w-4 mr-2" />Contact Us</Link>
          </Button>
        </div>
      </Section>
    </PageLayout>
  );
};

export default InsuranceDetailPage;
