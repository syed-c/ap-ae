import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { State, City, Area } from '@/types/database';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';
import { ACTIVE_STATE_SLUGS, isActiveState } from '@/lib/constants/activeStates';

export function useStates(initialData?: State[]) {
  return useQuery({
    queryKey: ['states'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('is_active', true)
        .in('slug', ACTIVE_STATE_SLUGS)
        .order('display_order');
      
      if (error) throw error;
      return data as State[];
    },
    staleTime: 10 * 60 * 1000, // 10 min cache (rarely change)
    gcTime: 30 * 60 * 1000,
    initialData: initialData ?? undefined,
  });
}

// Only return states that have at least one approved clinic (and are active)
export function useStatesWithClinics(initialData?: any[]) {
  return useQuery({
    queryKey: ['states-with-clinics'],
    queryFn: async (): Promise<State[]> => {
      // Fetch states, clinics, and cities IN PARALLEL
      const [statesRes, clinicsRes, citiesRes] = await Promise.all([
        supabase
          .from('states')
          .select('*')
          .eq('is_active', true)
          .in('slug', ACTIVE_STATE_SLUGS)
          .order('display_order'),
        (supabase.from('clinics').select('city_id') as any)
          .eq('is_active', true)
          .eq('is_duplicate', false),
        supabase
          .from('cities')
          .select('id, state_id')
          .eq('is_active', true),
      ]);

      if (statesRes.error) throw statesRes.error;
      if (clinicsRes.error) throw clinicsRes.error;
      if (citiesRes.error) throw citiesRes.error;

      const allStates = statesRes.data as State[];
      if (!allStates || allStates.length === 0) return [];

      const clinics = clinicsRes.data as Array<{ city_id: string | null }> | null;
      const citiesData = citiesRes.data as Array<{ id: string; state_id: string | null }> | null;

      const cityIds = (clinics || []).map(c => c.city_id).filter((id): id is string => id !== null);
      if (cityIds.length === 0) return [];

      const cityIdSet = new Set(cityIds);
      const stateIdSet = new Set<string>();
      (citiesData || []).forEach(city => {
        if (cityIdSet.has(city.id) && city.state_id) {
          stateIdSet.add(city.state_id);
        }
      });

      return allStates.filter(state => stateIdSet.has(state.id)) as State[];
    },
    initialData: initialData ?? undefined,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 30 * 60 * 1000,
  });
}

export function useState(slug: string, initialData?: State | null) {
  const normalized = normalizeStateSlug(slug);
  return useQuery({
    queryKey: ['state', normalized],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('states')
        .select('*')
        .eq('slug', normalized)
        .eq('is_active', true)
        .maybeSingle();
      
      if (error) throw error;
      return data as State | null;
    },
    initialData: initialData ?? undefined,
    enabled: !!normalized,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useCities(stateId?: string) {
  return useQuery({
    queryKey: ['cities', stateId],
    queryFn: async () => {
      let query = supabase
        .from('cities')
        .select(`
          *,
          state:states(*)
        `)
        .eq('is_active', true)
        .not('state_id', 'is', null)
        .order('name');

      if (stateId) {
        query = query.eq('state_id', stateId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as City[];
    },
    staleTime: 10 * 60 * 1000, // 10 min cache
    gcTime: 30 * 60 * 1000,
  });
}

export function useCitiesByStateSlug(stateSlug: string, initialData?: any[]) {
  const normalized = normalizeStateSlug(stateSlug);
  return useQuery({
    queryKey: ['cities-by-state', normalized],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          state:states(*)
        `)
        .eq('state.slug', normalized)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as City[];
    },
    enabled: !!normalized,
    staleTime: 10 * 60 * 1000, // 10 min cache
    gcTime: 30 * 60 * 1000,
    initialData: initialData,
  });
}

export function useCity(slug: string, stateSlug?: string, initialData?: City | null) {
  const normalizedStateSlug = stateSlug ? normalizeStateSlug(stateSlug) : null;
  return useQuery({
    queryKey: ['city', slug, normalizedStateSlug],
    queryFn: async () => {
      // Build query based on whether we have a state slug
      let query = supabase
        .from('cities')
        .select(`
          *,
          state:states(*)
        `)
        .eq('slug', slug)
        .eq('is_active', true);
      
      const { data: cities, error } = await query;
      
      if (error) throw error;
      if (!cities || cities.length === 0) return null;
      
      // If we have a state slug, filter to the matching state
      if (normalizedStateSlug) {
        const matchingCity = cities.find(
          (city: any) => city.state?.slug === normalizedStateSlug
        );
        return (matchingCity as City) || null;
      }
      
      // Otherwise return the first match (legacy behavior)
      return cities[0] as City | null;
    },
    initialData: initialData ?? undefined,
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useAreas(cityId?: string) {
  return useQuery({
    queryKey: ['areas', cityId],
    queryFn: async () => {
      let query = supabase
        .from('areas')
        .select(`
          *,
          city:cities(*, state:states(*))
        `)
        .eq('is_active', true)
        .order('name');

      if (cityId) {
        query = query.eq('city_id', cityId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Area[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Helper to format location display
export function formatLocation(city?: City | null, state?: State | null): string {
  if (city && city.state) {
    return `${city.name}, ${city.state.abbreviation}`;
  }
  if (city && state) {
    return `${city.name}, ${state.abbreviation}`;
  }
  if (city) {
    return city.name;
  }
  if (state) {
    return state.name;
  }
  return 'UAE';
}
