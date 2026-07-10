'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Filter,
  Loader2,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Star,
  Stethoscope,
  User,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { PageLayout } from '@/components/layout/PageLayout';
import { ProfileCard } from '@/components/ProfileCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SEOHead } from '@/components/seo/SEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import type { Profile } from '@/hooks/useProfiles';
import { supabase } from '@/integrations/supabase/client';

interface SearchFilters {
  query: string;
  profileType: '' | 'dentist' | 'clinic';
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
  type: 'dentist' | 'clinic';
  title?: string;
  rating: number;
  reviewCount: number;
  image?: string;
  isVerified: boolean;
  clinicName?: string;
  emirateName?: string;
  areaName?: string;
  languages?: string[];
  gender?: string;
  specializations?: string[];
}

const ITEMS_PER_PAGE = 24;

const PROFILE_TYPE_OPTIONS = [
  { label: 'All Listings', value: '' },
  { label: 'Dentists', value: 'dentist' },
  { label: 'Clinics', value: 'clinic' },
] as const;

const GENDER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

const RATING_OPTIONS = [
  { label: 'Any Rating', value: 0 },
  { label: '3+ Stars', value: 3 },
  { label: '4+ Stars', value: 4 },
  { label: '4.5+ Stars', value: 4.5 },
];

const SORT_OPTIONS = [
  { label: 'Highest Rated', value: 'rating' },
  { label: 'Most Reviewed', value: 'reviews' },
  { label: 'Name A-Z', value: 'name' },
];

interface UseQueryOptions<T> {
  initialData?: T;
}

function useEmirates(options?: UseQueryOptions<{ id: string; name: string; slug: string }[]>) {
  return useQuery({
    queryKey: ['search-emirates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('states')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    initialData: options?.initialData,
  });
}

function useAreas(emirateId: string) {
  return useQuery({
    queryKey: ['search-areas', emirateId],
    queryFn: async () => {
      if (!emirateId) {
        return [];
      }

      const { data } = await supabase
        .from('cities')
        .select('id, name, slug')
        .eq('state_id', emirateId)
        .eq('is_active', true)
        .order('name');

      return data || [];
    },
    enabled: !!emirateId,
    staleTime: 1000 * 60 * 30,
  });
}

function useTreatments(options?: UseQueryOptions<{ id: string; name: string; slug: string }[]>) {
  return useQuery({
    queryKey: ['search-treatments'],
    queryFn: async () => {
      const { data } = await supabase
        .from('treatments')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    initialData: options?.initialData,
  });
}

function useInsurances(options?: UseQueryOptions<{ id: string; name: string }[]>) {
  return useQuery({
    queryKey: ['search-insurances'],
    queryFn: async () => {
      const { data } = await supabase
        .from('insurances')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      return data || [];
    },
    staleTime: 1000 * 60 * 30,
    initialData: options?.initialData,
  });
}

function useSearchResults(
  filters: SearchFilters,
  page: number,
  options?: UseQueryOptions<{ results: SearchResultItem[]; total: number }>
) {
  return useQuery({
    queryKey: ['search-results', filters, page],
    queryFn: async () => {
      const results: SearchResultItem[] = [];
      let eligibleClinicIds: Set<string> | null = null;

      if (filters.areaId) {
        const { data: clinics } = await supabase
          .from('clinics')
          .select('id')
          .eq('city_id', filters.areaId)
          .eq('is_active', true);

        eligibleClinicIds = new Set((clinics || []).map((clinic) => clinic.id));

        if (eligibleClinicIds.size === 0) {
          return { results: [], total: 0 };
        }
      } else if (filters.emirateId) {
        const { data: cities } = await supabase
          .from('cities')
          .select('id')
          .eq('state_id', filters.emirateId)
          .eq('is_active', true);

        const cityIds = (cities || []).map((city) => city.id);

        if (cityIds.length === 0) {
          return { results: [], total: 0 };
        }

        const { data: clinics } = await supabase
          .from('clinics')
          .select('id')
          .in('city_id', cityIds)
          .eq('is_active', true);

        eligibleClinicIds = new Set((clinics || []).map((clinic) => clinic.id));

        if (eligibleClinicIds.size === 0) {
          return { results: [], total: 0 };
        }
      }

      if (filters.treatmentId) {
        const { data: clinicTreatments } = await supabase
          .from('clinic_treatments')
          .select('clinic_id')
          .eq('treatment_id', filters.treatmentId);

        const treatmentClinicIds = new Set((clinicTreatments || []).map((row) => row.clinic_id));

        eligibleClinicIds = eligibleClinicIds
          ? new Set([...eligibleClinicIds].filter((id) => treatmentClinicIds.has(id)))
          : treatmentClinicIds;

        if (eligibleClinicIds.size === 0) {
          return { results: [], total: 0 };
        }
      }

      if (filters.insuranceId) {
        const { data: clinicInsurances } = await supabase
          .from('clinic_insurances')
          .select('clinic_id')
          .eq('insurance_id', filters.insuranceId);

        const insuranceClinicIds = new Set((clinicInsurances || []).map((row) => row.clinic_id));

        eligibleClinicIds = eligibleClinicIds
          ? new Set([...eligibleClinicIds].filter((id) => insuranceClinicIds.has(id)))
          : insuranceClinicIds;

        if (eligibleClinicIds.size === 0) {
          return { results: [], total: 0 };
        }
      }

      const clinicIdArray = eligibleClinicIds ? [...eligibleClinicIds] : null;

      if (filters.profileType !== 'clinic') {
        let dentistQuery = supabase
          .from('dentists')
          .select(`
            id, name, slug, title, image_url, rating, review_count, languages, gender, specializations,
            clinic:clinics(
              id, name, verification_status, claim_status, cover_image_url,
              city:cities(name, slug, state_id, state:states(name, slug)),
              area:areas(name, slug)
            )
          `)
          .eq('is_active', true);

        if (clinicIdArray && clinicIdArray.length > 0) {
          dentistQuery = dentistQuery.in('clinic_id', clinicIdArray);
        } else if (clinicIdArray && clinicIdArray.length === 0) {
          dentistQuery = dentistQuery.eq('id', 'impossible-match');
        }

        if (filters.gender) {
          dentistQuery = dentistQuery.eq('gender', filters.gender);
        }

        if (filters.minRating > 0) {
          dentistQuery = dentistQuery.gte('rating', filters.minRating);
        }

        if (filters.query) {
          dentistQuery = dentistQuery.ilike('name', `%${filters.query}%`);
        }

        if (filters.sortBy === 'reviews') {
          dentistQuery = dentistQuery.order('review_count', { ascending: false });
        } else if (filters.sortBy === 'name') {
          dentistQuery = dentistQuery.order('name', { ascending: true });
        } else {
          dentistQuery = dentistQuery.order('rating', { ascending: false });
        }

        const { data: dentists } = await dentistQuery;

        for (const dentist of dentists || []) {
          const clinic = dentist.clinic as any;
          const isVerified = clinic?.claim_status === 'claimed' && clinic?.verification_status === 'verified';

          if (filters.verifiedOnly && !isVerified) {
            continue;
          }

          results.push({
            id: dentist.id,
            name: dentist.name,
            slug: dentist.slug,
            type: 'dentist',
            title: dentist.title || 'Dental Professional',
            rating: Number(dentist.rating) || 0,
            reviewCount: dentist.review_count || 0,
            image: dentist.image_url || clinic?.cover_image_url || undefined,
            isVerified,
            clinicName: clinic?.name,
            emirateName: clinic?.city?.state?.name,
            areaName: clinic?.area?.name || clinic?.city?.name,
            languages: dentist.languages || [],
            gender: dentist.gender || undefined,
            specializations: dentist.specializations || [],
          });
        }
      }

      if (filters.profileType !== 'dentist') {
        let clinicQuery = supabase
          .from('clinics')
          .select(`
            id, name, slug, cover_image_url, rating, review_count, verification_status, claim_status,
            city:cities(name, slug, state_id, state:states(name, slug)),
            area:areas(name, slug)
          `)
          .eq('is_active', true);

        if (clinicIdArray && clinicIdArray.length > 0) {
          clinicQuery = clinicQuery.in('id', clinicIdArray);
        } else if (filters.areaId) {
          clinicQuery = clinicQuery.eq('city_id', filters.areaId);
        }

        if (filters.minRating > 0) {
          clinicQuery = clinicQuery.gte('rating', filters.minRating);
        }

        if (filters.query) {
          clinicQuery = clinicQuery.ilike('name', `%${filters.query}%`);
        }

        if (filters.sortBy === 'reviews') {
          clinicQuery = clinicQuery.order('review_count', { ascending: false });
        } else if (filters.sortBy === 'name') {
          clinicQuery = clinicQuery.order('name', { ascending: true });
        } else {
          clinicQuery = clinicQuery.order('rating', { ascending: false });
        }

        const { data: clinics } = await clinicQuery;

        for (const clinic of clinics || []) {
          const isVerified = clinic.claim_status === 'claimed' && clinic.verification_status === 'verified';

          if (filters.verifiedOnly && !isVerified) {
            continue;
          }

          results.push({
            id: clinic.id,
            name: clinic.name,
            slug: clinic.slug,
            type: 'clinic',
            title: 'Dental Clinic',
            rating: Number(clinic.rating) || 0,
            reviewCount: clinic.review_count || 0,
            image: clinic.cover_image_url || undefined,
            isVerified,
            clinicName: clinic.name,
            emirateName: (clinic.city as any)?.state?.name,
            areaName: (clinic.area as any)?.name || (clinic.city as any)?.name,
          });
        }
      }

      if (filters.sortBy === 'reviews') {
        results.sort((a, b) => b.reviewCount - a.reviewCount);
      } else if (filters.sortBy === 'name') {
        results.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        results.sort((a, b) => b.rating - a.rating);
      }

      const total = results.length;
      const start = (page - 1) * ITEMS_PER_PAGE;

      return {
        results: results.slice(start, start + ITEMS_PER_PAGE),
        total,
      };
    },
  });
}

function toProfileCardData(item: SearchResultItem): Profile {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    type: item.type,
    specialty:
      item.title ||
      item.specializations?.[0] ||
      (item.type === 'clinic' ? 'Dental Clinic' : 'Dental Professional'),
    location: [item.areaName, item.emirateName].filter(Boolean).join(', ') || 'UAE',
    rating: item.rating,
    reviewCount: item.reviewCount,
    image: item.image,
    isVerified: item.isVerified,
    clinicName: item.clinicName,
    languages: item.languages,
  } as Profile;
}

interface SearchPageProps {
  emiratesProp?: { id: string; name: string; slug: string }[];
  treatmentsProp?: { id: string; name: string; slug: string }[];
  insurancesProp?: { id: string; name: string }[];
  initialResultsProp?: {
    results: {
      id: string;
      name: string;
      slug: string;
      type: 'dentist' | 'clinic';
      title?: string;
      rating: number;
      reviewCount: number;
      image?: string;
      isVerified: boolean;
      clinicName?: string;
      emirateName?: string;
      areaName?: string;
      languages?: string[];
      gender?: string;
      specializations?: string[];
    }[];
    total: number;
  };
}

export default function SearchPage({
  emiratesProp = [],
  treatmentsProp = [],
  insurancesProp = [],
  initialResultsProp = { results: [], total: 0 },
}: SearchPageProps) {
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    profileType: (searchParams.get('type') as SearchFilters['profileType']) || '',
    emirateId: searchParams.get('emirate') || '',
    areaId: searchParams.get('area') || '',
    treatmentId: searchParams.get('treatment') || '',
    insuranceId: searchParams.get('insurance') || '',
    gender: searchParams.get('gender') || '',
    minRating: Number(searchParams.get('rating')) || 0,
    verifiedOnly: searchParams.get('verified') === 'true',
    sortBy: searchParams.get('sort') || 'rating',
  });

  const { data: emirates } = useEmirates({ initialData: emiratesProp });
  const { data: areas } = useAreas(filters.emirateId);
  const { data: treatments } = useTreatments({ initialData: treatmentsProp });
  const { data: insurances } = useInsurances({ initialData: insurancesProp });
  const { data: searchData, isLoading } = useSearchResults(filters, page, { initialData: initialResultsProp });

  const updateFilter = useCallback((key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    setFilters((currentFilters) => {
      if (key === 'emirateId') {
        return {
          ...currentFilters,
          emirateId: value as string,
          areaId: '',
        };
      }

      return {
        ...currentFilters,
        [key]: value,
      };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      profileType: '',
      emirateId: '',
      areaId: '',
      treatmentId: '',
      insuranceId: '',
      gender: '',
      minRating: 0,
      verifiedOnly: false,
      sortBy: 'rating',
    });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.profileType) count++;
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

  const filterSidebar = (
    <div className="space-y-6">
      <FilterSection title="Listing Type" icon={<Sparkles className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {PROFILE_TYPE_OPTIONS.map((option) => (
            <Button
              key={option.value || 'all'}
              variant={filters.profileType === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('profileType', option.value)}
              className="rounded-full text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Emirate" icon={<MapPin className="h-4 w-4" />}>
        <Select value={filters.emirateId} onValueChange={(value) => updateFilter('emirateId', value === 'all' ? '' : value)}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue placeholder="All Emirates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emirates</SelectItem>
            {emirates?.map((emirate) => (
              <SelectItem key={emirate.id} value={emirate.id}>
                {emirate.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {filters.emirateId && areas && areas.length > 0 && (
        <FilterSection title="Area" icon={<MapPin className="h-4 w-4" />}>
          <Select value={filters.areaId} onValueChange={(value) => updateFilter('areaId', value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full rounded-xl">
              <SelectValue placeholder="All Areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Areas</SelectItem>
              {areas.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterSection>
      )}

      <FilterSection title="Treatment" icon={<Stethoscope className="h-4 w-4" />}>
        <Select value={filters.treatmentId} onValueChange={(value) => updateFilter('treatmentId', value === 'all' ? '' : value)}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue placeholder="All Treatments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Treatments</SelectItem>
            {treatments?.map((treatment) => (
              <SelectItem key={treatment.id} value={treatment.id}>
                {treatment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Insurance" icon={<Shield className="h-4 w-4" />}>
        <Select value={filters.insuranceId} onValueChange={(value) => updateFilter('insuranceId', value === 'all' ? '' : value)}>
          <SelectTrigger className="w-full rounded-xl">
            <SelectValue placeholder="All Insurances" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Insurances</SelectItem>
            {insurances?.map((insurance) => (
              <SelectItem key={insurance.id} value={insurance.id}>
                {insurance.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      <FilterSection title="Gender Preference" icon={<User className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((option) => (
            <Button
              key={option.value || 'all'}
              variant={filters.gender === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('gender', option.value)}
              className="rounded-full text-xs"
            >
              {option.label}
            </Button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Minimum Rating" icon={<Star className="h-4 w-4" />}>
        <div className="flex flex-wrap gap-2">
          {RATING_OPTIONS.map((option) => (
            <Button
              key={option.value}
              variant={filters.minRating === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateFilter('minRating', option.value)}
              className="rounded-full text-xs"
            >
              {option.value > 0 && <Star className="mr-1 h-3 w-3 fill-current" />}
              {option.label}
            </Button>
          ))}
        </div>
      </FilterSection>

      <div className="flex items-center gap-2">
        <Checkbox
          id="verified-only"
          checked={filters.verifiedOnly}
          onCheckedChange={(checked) => updateFilter('verifiedOnly', !!checked)}
        />
        <label htmlFor="verified-only" className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-foreground">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Verified providers only
        </label>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full justify-start text-[#6B7280]">
          <X className="mr-2 h-4 w-4" />
          Clear all filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <PageLayout>
      <SEOHead
        title="Find Dentists & Clinics in UAE | AppointPanda"
        description="Search and compare dentists and dental clinics across all 7 Emirates. Filter by location, treatment, insurance, rating and more."
        canonical="/search/"
        keywords={['find dentist UAE', 'dental clinic Dubai', 'dentist near me', 'dental search']}
      />
      <StructuredData
        data={{
          type: 'breadcrumb',
          items: [
            { name: 'Home', url: '/' },
            { name: 'Search Dentists', url: '/search/' },
          ],
        }}
      />

      <section className="relative overflow-hidden bg-gradient-to-b from-[#F9FAFB] to-white">
        <div className="container relative px-4 py-10 md:px-6 md:py-14">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Find the right dentist for you
            </div>
            <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-[#111827] md:text-5xl lg:text-6xl">
              Search dentists & clinics across the UAE
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6B7280] md:text-base lg:text-lg">
              Compare provider types, treatment fit, insurance compatibility, trust signals, and location coverage in one focused interface.
            </p>
          </div>

          <div className="mt-8 flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <Input
                value={filters.query}
                onChange={(event) => updateFilter('query', event.target.value)}
                placeholder="Search by dentist, clinic, service, or specialty..."
                className="h-12 rounded-[8px] border-[#E5E7EB] bg-white text-[#111827]"
              />
            </div>

            <div className="lg:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative h-12 rounded-[8px]">
                    <Filter className="h-4 w-4" />
                    {activeFilterCount > 0 && (
                      <Badge className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center p-0 text-[10px]">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px] overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">{filterSidebar}</div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-sm text-[#6B7280]">
            <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-2">Verified providers</span>
            <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-2">Insurance-aware search</span>
            <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-2">Dentist and clinic listings</span>
          </div>
        </div>
      </section>

      <main className="container w-full px-4 py-8 md:px-6 md:py-10">
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
              <div className="marketplace-panel sticky top-28 p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#111827]">
                  <Filter className="h-4 w-4 text-primary" />
                  Marketplace Filters
                  {activeFilterCount > 0 && <Badge variant="secondary" className="text-[10px]">{activeFilterCount}</Badge>}
              </div>
              <p className="mt-2 text-sm text-[#6B7280]">
                Refine provider type, location, treatment, insurance, and trust signals.
              </p>
              <div className="mt-6">{filterSidebar}</div>
            </div>
          </aside>

          <div className="min-w-0">
            <section className="marketplace-panel p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-primary">
                    <Search className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em]">Results</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold text-[#111827]">Search results</h2>
                </div>

                <div className="flex items-center gap-3">
                  <p className="text-sm text-[#6B7280]">
                    {isLoading ? 'Searching...' : `${searchData?.total || 0} results found`}
                  </p>
                  <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
                    <SelectTrigger className="h-10 w-[180px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeFilterCount > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1.5 text-xs">
                    {activeFilterCount} active filters
                  </Badge>
                  {filters.profileType && <Badge variant="outline" className="rounded-full">{filters.profileType}</Badge>}
                  {filters.verifiedOnly && <Badge variant="outline" className="rounded-full">verified only</Badge>}
                  {filters.gender && <Badge variant="outline" className="rounded-full">{filters.gender}</Badge>}
                  {filters.minRating > 0 && <Badge variant="outline" className="rounded-full">{filters.minRating}+ stars</Badge>}
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}

              {!isLoading && searchData?.results.length === 0 && (
                <div className="rounded-[12px] border border-dashed border-[#E5E7EB] bg-[#F9FAFB] py-20 text-center">
                  <Search className="mx-auto h-12 w-12 text-[#9CA3AF]/30" />
                  <h3 className="mt-5 text-xl font-semibold text-[#111827]">No results found</h3>
                  <p className="mt-2 text-sm text-[#6B7280]">Try broadening your search or removing a few filters.</p>
                  <Button variant="outline" className="mt-5" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              )}

              {!isLoading && searchData && searchData.results.length > 0 && (
                <>
                  <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    {searchData.results.map((item) => (
                      <ProfileCard key={`${item.type}-${item.id}`} profile={toProfileCardData(item)} variant="compact" />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((currentPage) => currentPage - 1)}>
                        Previous
                      </Button>
                      <span className="px-3 text-sm text-[#6B7280]">
                        Page {page} of {totalPages}
                      </span>
                      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((currentPage) => currentPage + 1)}>
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </PageLayout>
  );
}

function FilterSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#6B7280]">
        {icon}
        {title}
      </label>
      {children}
    </div>
  );
}
