'use client';
import { useState, useCallback, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

const InsuranceDetailPage = () => {
  const { insuranceSlug, emirateSlug, citySlug: urlCitySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
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
  });

  const { cities } = useInsuranceFilterOptions(insurance?.id);

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
  });

  // Handlers
  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams);
    if (page === 1) params.delete("page"); else params.set("page", String(page));
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

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
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleSortChange = useCallback((sort: "rating" | "reviews" | "name") => {
    setSortBy(sort);
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    params.set("sort", sort);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleRatingChange = useCallback((rating: number | undefined) => {
    setMinRating(rating);
    const params = new URLSearchParams(searchParams);
    params.delete("page");
    if (rating) params.set("rating", String(rating)); else params.delete("rating");
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleClearFilters = useCallback(() => {
    setMinRating(undefined);
    setSortBy("rating");
    setSearchParams({});
  }, [setSearchParams]);

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
              <Button asChild><Link to="/insurance/"><Shield className="h-4 w-4 mr-2" />Browse All Insurance</Link></Button>
              <Button asChild variant="outline"><Link to="/"><ArrowLeft className="h-4 w-4 mr-2" />Home</Link></Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const canonicalUrl = buildInsuranceUrl(insurance.slug, emirateSlug, urlCitySlug);

  return (
    <PageLayout>
      <SEOHead
        title={`${insurance.name} Dentists${locationSuffix} - Find Providers | UAE`}
        description={`Find ${totalCount}+ dental clinics accepting ${insurance.name}${locationSuffix}. Direct billing, pre-approval assistance. Book today.`}
        canonical={canonicalUrl}
        keywords={[`${insurance.name} dental`, `${insurance.name} dentist UAE`, `dental insurance ${locationSuffix}`]}
      />

      {/* Hero */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b border-border">
        <div className="container py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span>/</span>}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                ) : (
                  <Link to={crumb.href} className="hover:text-primary transition-colors">{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="shrink-0 h-20 w-20 rounded-2xl bg-card border border-border flex items-center justify-center">
              {insurance.logo_url ? (
                <img src={insurance.logo_url} alt={insurance.name} className="h-14 w-14 object-contain" />
              ) : (
                <Shield className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
                {insurance.name}{locationSuffix}
              </h1>
              <p className="text-muted-foreground mb-3">
                {(insurance as any).description || `Find dental clinics that accept ${insurance.name} insurance with direct billing${locationSuffix}.`}
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-primary" />
                  <span className="font-bold">{totalCount}</span>
                  <span className="text-muted-foreground">Clinics</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Verified Providers</span>
                </div>
              </div>
            </div>
          </div>

          {/* Coverage info if available */}
          {(insurance as any).coverage_notes && (
            <div className="mt-6 p-4 rounded-xl bg-card border border-border">
              <h3 className="font-bold text-sm mb-1">Coverage Notes</h3>
              <p className="text-sm text-muted-foreground">{(insurance as any).coverage_notes}</p>
            </div>
          )}

          {/* Emirate Quick Links */}
          {availableEmirates && availableEmirates.length > 0 && !urlCitySlug && (
            <div className="mt-6">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
                Browse {insurance.name} by Emirate
              </h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={buildInsuranceUrl(insurance.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    !emirateSlug
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  All Emirates
                </Link>
                {availableEmirates.map((em) => (
                  <Link
                    key={em.slug}
                    to={buildInsuranceUrl(insurance.slug, em.slug)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      emirateSlug === em.slug
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-primary/10 hover:text-primary"
                    }`}
                  >
                    {em.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: FileCheck, title: "Direct Billing", desc: "No upfront payment required" },
              { icon: Sparkles, title: "Pre-Approval", desc: "Clinics handle paperwork" },
              { icon: HeadphonesIcon, title: "Claims Help", desc: "Assistance with claims" },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <b.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{b.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
            <Link to="/contact/"><Phone className="h-4 w-4 mr-2" />Contact Us</Link>
          </Button>
        </div>
      </Section>
    </PageLayout>
  );
};

export default InsuranceDetailPage;
