'use client';
import { useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Search, MapPin, Star, Shield, ChevronRight,
  Filter, X, Building2, User, Loader2, Stethoscope,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SEOHead } from "@/components/seo/SEOHead";
import { StructuredData } from "@/components/seo/StructuredData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

import { getLetterAvatarUrl } from "@/hooks/useProfiles";

// ── Types ──────────────────────────────────────────────────
interface SearchFilters {
  query: string;
  emirateId: string;
  areaId: string;
  treatmentId: string;
  insuranceId: string;
  gender: string;
  minRating: number;
  verifiedOnly: boolean;
  sortBy: string;
}

interface SearchResultItem {
  id: string;
  name: string;
  slug: string;
  type: "dentist" | "clinic";
  title?: string;
  rating: number;
  reviewCount: number;
  image?: string;
  isVerified: boolean;
  clinicName?: string;
  clinicSlug?: string;
  emirateName?: string;
  areaName?: string;
  languages?: string[];
  gender?: string;
  specializations?: string[];
}

const ITEMS_PER_PAGE = 24;

const GENDER_OPTIONS = [
  { label: "All", value: "" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const RATING_OPTIONS = [
  { label: "Any Rating", value: 0 },
  { label: "3+ Stars", value: 3 },
  { label: "4+ Stars", value: 4 },
  { label: "4.5+ Stars", value: 4.5 },
];

const SORT_OPTIONS = [
  { label: "Highest Rated", value: "rating" },
  { label: "Most Reviewed", value: "reviews" },
  { label: "Name A-Z", value: "name" },
];

// ── Data hooks ─────────────────────────────────────────────
function useEmirates() {
  return useQuery({
    queryKey: ["search-emirates"],
    queryFn: async () => {
      const { data } = await supabase
        .from("states")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

function useAreas(emirateId: string) {
  return useQuery({
    queryKey: ["search-areas", emirateId],
    queryFn: async () => {
      if (!emirateId) return [];
      // Get city IDs for this emirate
      const { data: cities } = await supabase
        .from("cities")
        .select("id, name, slug")
        .eq("state_id", emirateId)
        .eq("is_active", true)
        .order("name");
      return cities || [];
    },
    enabled: !!emirateId,
    staleTime: 1000 * 60 * 30,
  });
}

function useTreatments() {
  return useQuery({
    queryKey: ["search-treatments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("treatments")
        .select("id, name, slug")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

function useInsurances() {
  return useQuery({
    queryKey: ["search-insurances"],
    queryFn: async () => {
      const { data } = await supabase
        .from("insurances")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ── Main search query ──────────────────────────────────────
function useSearchResults(filters: SearchFilters, page: number) {
  return useQuery({
    queryKey: ["search-results", filters, page],
    queryFn: async () => {
      const results: SearchResultItem[] = [];

      // Build eligible clinic IDs based on filters
      let eligibleClinicIds: Set<string> | null = null;

      // Filter by area (city) 
      if (filters.areaId) {
        const { data: clinics } = await supabase
          .from("clinics")
          .select("id")
          .eq("city_id", filters.areaId)
          .eq("is_active", true);
        eligibleClinicIds = new Set((clinics || []).map((c) => c.id));
        if (eligibleClinicIds.size === 0) return { results: [], total: 0 };
      } else if (filters.emirateId) {
        // Get all cities in this emirate
        const { data: cities } = await supabase
          .from("cities")
          .select("id")
          .eq("state_id", filters.emirateId)
          .eq("is_active", true);
        const cityIds = (cities || []).map((c) => c.id);
        if (cityIds.length === 0) return { results: [], total: 0 };

        const { data: clinics } = await supabase
          .from("clinics")
          .select("id")
          .in("city_id", cityIds)
          .eq("is_active", true);
        eligibleClinicIds = new Set((clinics || []).map((c) => c.id));
        if (eligibleClinicIds.size === 0) return { results: [], total: 0 };
      }

      // Filter by treatment
      if (filters.treatmentId) {
        const { data: ct } = await supabase
          .from("clinic_treatments")
          .select("clinic_id")
          .eq("treatment_id", filters.treatmentId);
        const treatmentClinicIds = new Set((ct || []).map((c) => c.clinic_id));
        if (treatmentClinicIds.size > 0) {
          if (eligibleClinicIds) {
            eligibleClinicIds = new Set([...eligibleClinicIds].filter((id) => treatmentClinicIds.has(id)));
          } else {
            eligibleClinicIds = treatmentClinicIds;
          }
        }
      }

      // Filter by insurance
      if (filters.insuranceId) {
        const { data: ci } = await supabase
          .from("clinic_insurances")
          .select("clinic_id")
          .eq("insurance_id", filters.insuranceId);
        const insuranceClinicIds = new Set((ci || []).map((c) => c.clinic_id));
        if (insuranceClinicIds.size > 0) {
          if (eligibleClinicIds) {
            eligibleClinicIds = new Set([...eligibleClinicIds].filter((id) => insuranceClinicIds.has(id)));
          } else {
            eligibleClinicIds = insuranceClinicIds;
          }
        }
        if (eligibleClinicIds && eligibleClinicIds.size === 0) return { results: [], total: 0 };
      }

      const clinicIdArray = eligibleClinicIds ? [...eligibleClinicIds] : null;

      // Fetch dentists
      let dentistQuery = supabase
        .from("dentists")
        .select(`
          id, name, slug, title, image_url, rating, review_count, languages, gender, specializations,
          clinic:clinics(
            id, name, slug, verification_status, claim_status, cover_image_url,
            city:cities(name, slug, state_id, state:states(name, slug)),
            area:areas(name, slug)
          )
        `)
        .eq("is_active", true);

      if (clinicIdArray && clinicIdArray.length > 0) {
        dentistQuery = dentistQuery.in("clinic_id", clinicIdArray);
      } else if (clinicIdArray && clinicIdArray.length === 0) {
        dentistQuery = dentistQuery.eq("id", "impossible-match");
      }

      if (filters.gender) {
        dentistQuery = dentistQuery.eq("gender", filters.gender);
      }
      if (filters.minRating > 0) {
        dentistQuery = dentistQuery.gte("rating", filters.minRating);
      }
      if (filters.query) {
        dentistQuery = dentistQuery.ilike("name", `%${filters.query}%`);
      }

      // Sort
      if (filters.sortBy === "reviews") {
        dentistQuery = dentistQuery.order("review_count", { ascending: false });
      } else if (filters.sortBy === "name") {
        dentistQuery = dentistQuery.order("name", { ascending: true });
      } else {
        dentistQuery = dentistQuery.order("rating", { ascending: false });
      }

      const { data: dentists } = await dentistQuery;

      const clinicsWithDentists = new Set<string>();

      if (dentists) {
        for (const d of dentists) {
          const clinic = d.clinic as any;
          if (clinic?.id) clinicsWithDentists.add(clinic.id);
          const isVerified = clinic?.claim_status === "claimed" && clinic?.verification_status === "verified";
          if (filters.verifiedOnly && !isVerified) continue;

          results.push({
            id: d.id,
            name: d.name,
            slug: d.slug,
            type: "dentist",
            title: d.title || "General Dentist",
            rating: Number(d.rating) || 0,
            reviewCount: d.review_count || 0,
            image: d.image_url || clinic?.cover_image_url || undefined,
            isVerified,
            clinicName: clinic?.name,
            clinicSlug: clinic?.slug,
            emirateName: clinic?.city?.state?.name,
            areaName: clinic?.area?.name || clinic?.city?.name,
            languages: d.languages || [],
            gender: d.gender || undefined,
            specializations: d.specializations || [],
          });
        }
      }

      // Fetch clinics without dentists
      let clinicQuery = supabase
        .from("clinics")
        .select(`
          id, name, slug, cover_image_url, rating, review_count, verification_status, claim_status,
          city:cities(name, slug, state_id, state:states(name, slug)),
          area:areas(name, slug)
        `)
        .eq("is_active", true);

      if (clinicIdArray && clinicIdArray.length > 0) {
        clinicQuery = clinicQuery.in("id", clinicIdArray);
      } else if (filters.areaId) {
        clinicQuery = clinicQuery.eq("city_id", filters.areaId);
      }

      if (filters.minRating > 0) {
        clinicQuery = clinicQuery.gte("rating", filters.minRating);
      }
      if (filters.query) {
        clinicQuery = clinicQuery.ilike("name", `%${filters.query}%`);
      }
      if (filters.sortBy === "reviews") {
        clinicQuery = clinicQuery.order("review_count", { ascending: false });
      } else if (filters.sortBy === "name") {
        clinicQuery = clinicQuery.order("name", { ascending: true });
      } else {
        clinicQuery = clinicQuery.order("rating", { ascending: false });
      }

      const { data: clinics } = await clinicQuery;

      if (clinics) {
        for (const c of clinics) {
          if (clinicsWithDentists.has(c.id)) continue;
          const isVerified = c.claim_status === "claimed" && c.verification_status === "verified";
          if (filters.verifiedOnly && !isVerified) continue;

          results.push({
            id: c.id,
            name: c.name,
            slug: c.slug,
            type: "clinic",
            title: "Dental Clinic",
            rating: Number(c.rating) || 0,
            reviewCount: c.review_count || 0,
            image: c.cover_image_url || undefined,
            isVerified,
            clinicName: c.name,
            clinicSlug: c.slug,
            emirateName: (c.city as any)?.state?.name,
            areaName: (c.area as any)?.name || (c.city as any)?.name,
          });
        }
      }

      // Sort combined
      if (filters.sortBy === "reviews") {
        results.sort((a, b) => b.reviewCount - a.reviewCount);
      } else if (filters.sortBy === "name") {
        results.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        results.sort((a, b) => b.rating - a.rating);
      }

      const total = results.length;
      const start = (page - 1) * ITEMS_PER_PAGE;
      return { results: results.slice(start, start + ITEMS_PER_PAGE), total };
    },
  });
}

// ── Page Component ─────────────────────────────────────────
export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get("q") || "",
    emirateId: searchParams.get("emirate") || "",
    areaId: searchParams.get("area") || "",
    treatmentId: searchParams.get("treatment") || "",
    insuranceId: searchParams.get("insurance") || "",
    gender: searchParams.get("gender") || "",
    minRating: Number(searchParams.get("rating")) || 0,
    verifiedOnly: searchParams.get("verified") === "true",
    sortBy: searchParams.get("sort") || "rating",
  });

  const { data: emirates } = useEmirates();
  const { data: areas } = useAreas(filters.emirateId);
  const { data: treatments } = useTreatments();
  const { data: insurances } = useInsurances();
  const { data: searchData, isLoading } = useSearchResults(filters, page);

  // Reset area when emirate changes
  useEffect(() => {
    setFilters((prev) => ({ ...prev, areaId: "" }));
  }, [filters.emirateId]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const updateFilter = useCallback((key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: "",
      emirateId: "",
      areaId: "",
      treatmentId: "",
      insuranceId: "",
      gender: "",
      minRating: 0,
      verifiedOnly: false,
      sortBy: "rating",
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.emirateId) count++;
    if (filters.areaId) count++;
    if (filters.treatmentId) count++;
    if (filters.insuranceId) count++;
    if (filters.gender) count++;
    if (filters.minRating > 0) count++;
    if (filters.verifiedOnly) count++;
    return count;
  }, [filters]);

  const totalPages = Math.ceil((searchData?.total || 0) / ITEMS_PER_PAGE);

  // ── Filter sidebar content ──────────────────────────────
  const FilterSidebar = () => (
    <div className="space-y-6">
      {/* Emirate */}
      <FilterSection title="Emirate" icon={<MapPin className="h-4 w-4" />}>
        <Select value={filters.emirateId} onValueChange={(v) => updateFilter("emirateId", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All Emirates" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emirates</SelectItem>
            {emirates?.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Area */}
      {filters.emirateId && areas && areas.length > 0 && (
        <FilterSection title="Area" icon={<MapPin className="h-4 w-4" />}>
          <Select value={filters.areaId} onValueChange={(v) => updateFilter("areaId", v === "all" ? "" : v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="All Areas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>
      )}

      {/* Treatment / Specialty */}
      <FilterSection title="Treatment" icon={<Stethoscope className="h-4 w-4" />}>
        <Select value={filters.treatmentId} onValueChange={(v) => updateFilter("treatmentId", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All Treatments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Treatments</SelectItem>
            {treatments?.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Insurance */}
      <FilterSection title="Insurance" icon={<Shield className="h-4 w-4" />}>
        <Select value={filters.insuranceId} onValueChange={(v) => updateFilter("insuranceId", v === "all" ? "" : v)}>
          <SelectTrigger className="w-full"><SelectValue placeholder="All Insurances" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Insurances</SelectItem>
            {insurances?.map((ins) => (
              <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Gender */}
      <FilterSection title="Gender Preference" icon={<User className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={filters.gender === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("gender", opt.value)}
              className="rounded-full text-xs"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Minimum Rating" icon={<Star className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={filters.minRating === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("minRating", opt.value)}
              className="rounded-full text-xs"
            >
              {opt.value > 0 && <Star className="h-3 w-3 mr-1 fill-current" />}
              {opt.label}
            </Button>
          ))}
        </div>
      </FilterSection>

      {/* Verified Only */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="verified-only"
          checked={filters.verifiedOnly}
          onCheckedChange={(checked) => updateFilter("verifiedOnly", !!checked)}
        />
        <label htmlFor="verified-only" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Verified Practices Only
        </label>
      </div>

      {/* Clear */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full text-muted-foreground">
          <X className="h-4 w-4 mr-2" /> Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead
        title="Find Dentists & Clinics in UAE | AppointPanda"
        description="Search and compare dentists and dental clinics across all 7 Emirates. Filter by location, treatment, insurance, rating and more."
        canonical="/search/"
        keywords={["find dentist UAE", "dental clinic Dubai", "dentist near me", "dental search"]}
      />
      <StructuredData
        type="breadcrumb"
        items={[
          { name: "Home", url: "/" },
          { name: "Search Dentists", url: "/search/" },
        ]}
      />
      <Navbar />

      {/* Hero Search Bar */}
      <div className="bg-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            Find a Dentist in UAE
          </h1>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={filters.query}
                onChange={(e) => updateFilter("query", e.target.value)}
                placeholder="Search by name, clinic, or specialty..."
                className="pl-10 h-12 rounded-xl bg-background"
              />
            </div>
            {/* Mobile filter trigger */}
            <div className="md:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-12 rounded-xl relative">
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterSidebar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden md:block w-[280px] shrink-0">
            <div className="sticky top-24 space-y-1">
              <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">{activeFilterCount}</Badge>
                )}
              </h2>
              <FilterSidebar />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Results header */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? (
                  "Searching..."
                ) : (
                  <>{searchData?.total || 0} results found</>
                )}
              </p>
              <Select value={filters.sortBy} onValueChange={(v) => updateFilter("sortBy", v)}>
                <SelectTrigger className="w-[160px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* No results */}
            {!isLoading && searchData?.results.length === 0 && (
              <div className="text-center py-20">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-bold text-foreground mb-2">No results found</h3>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search query.</p>
                <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
              </div>
            )}

            {/* Results grid */}
            {!isLoading && searchData && searchData.results.length > 0 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchData.results.map((item) => (
                    <ResultCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-3">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ── Filter Section ─────────────────────────────────────────
function FilterSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {icon} {title}
      </label>
      {children}
    </div>
  );
}

// ── Result Card ────────────────────────────────────────────
function ResultCard({ item }: { item: SearchResultItem }) {
  const linkTo = item.type === "dentist"
    ? `/dentist/${item.slug}`
    : `/clinic/${item.slug}`;

  const avatarUrl = item.image || getLetterAvatarUrl(item.name);

  return (
    <Link
      to={linkTo}
      className="group block bg-card border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all"
    >
      {/* Image */}
      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
        <img
          src={avatarUrl}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = getLetterAvatarUrl(item.name);
          }}
        />
        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {item.isVerified && (
            <Badge className="bg-primary text-primary-foreground text-[10px] rounded-full gap-1">
              <Shield className="h-3 w-3" /> Verified
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px] rounded-full capitalize">
            {item.type === "dentist" ? <User className="h-3 w-3 mr-0.5" /> : <Building2 className="h-3 w-3 mr-0.5" />}
            {item.type}
          </Badge>
        </div>
        {/* Rating */}
        {item.rating > 0 && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span className="text-xs font-bold">{item.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        {item.title && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.title}</p>
        )}
        {item.clinicName && item.type === "dentist" && (
          <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
            <Building2 className="h-3 w-3 shrink-0" /> {item.clinicName}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {[item.areaName, item.emirateName].filter(Boolean).join(", ") || "UAE"}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t">
          <span className="text-[10px] text-muted-foreground">
            {item.reviewCount} review{item.reviewCount !== 1 ? "s" : ""}
          </span>
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            View Profile <ChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}
