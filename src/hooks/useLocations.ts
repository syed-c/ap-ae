import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { State, City, Area } from '@/types/database';
import { normalizeStateSlug } from '@/lib/slug/normalizeStateSlug';
import { ACTIVE_STATE_SLUGS, isActiveState } from '@/lib/constants/activeStates';

export function useStates() {
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
    staleTime: 10 * 60 * 1000, // Cache states for 10 minutes (rarely change)
    gcTime: 30 * 60 * 1000,
  });
}

// Only return states that have at least one approved clinic (and are active)
export function useStatesWithClinics() {
  return useQuery({
    queryKey: ['states-with-clinics'],
    queryFn: async (): Promise<State[]> => {
      // Get all active states (only from the active states list)
      const { data: allStates, error: statesError } = await supabase
        .from('states')
        .select('*')
        .eq('is_active', true)
        .in('slug', ACTIVE_STATE_SLUGS)
        .order('display_order');
      
      if (statesError) throw statesError;
      if (!allStates || allStates.length === 0) return [];

      // Get active clinics - cast to any to avoid TS deep instantiation issue with Supabase types
      const { data: clinicsRaw, error: clinicError } = await (supabase
        .from('clinics')
        .select('city_id') as any)
        .eq('is_active', true)
        .eq('is_duplicate', false);
      
      if (clinicError) throw clinicError;
      
      const clinics = clinicsRaw as Array<{ city_id: string | null }> | null;
      
      // Get city IDs
      const cityIds = (clinics || []).map(c => c.city_id).filter((id): id is string => id !== null);
      if (cityIds.length === 0) return [];

      // Get cities with their state IDs (only active cities)
      const { data: citiesRaw, error: citiesError } = await supabase
        .from('cities')
        .select('id, state_id')
        .eq('is_active', true);
      
      if (citiesError) throw citiesError;
      
      const citiesData = citiesRaw as Array<{ id: string; state_id: string | null }> | null;

      // Filter to cities that have clinics and extract state IDs
      const cityIdSet = new Set(cityIds);
      const stateIdSet = new Set<string>();
      (citiesData || []).forEach(city => {
        if (cityIdSet.has(city.id) && city.state_id) {
          stateIdSet.add(city.state_id);
        }
      });

      // Filter states that have clinics
      return allStates.filter(state => stateIdSet.has(state.id)) as State[];
    },
  });
}

export function useState(slug: string) {
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
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useCitiesByStateSlug(stateSlug: string) {
  const normalized = normalizeStateSlug(stateSlug);
  return useQuery({
    queryKey: ['cities-by-state', normalized],
    queryFn: async () => {
      // First get the state
      const { data: stateData, error: stateError } = await supabase
        .from('states')
        .select('id')
        .eq('slug', normalized)
        .maybeSingle();
      
      if (stateError) throw stateError;
      if (!stateData) return [];

      const { data, error } = await supabase
        .from('cities')
        .select(`
          *,
          state:states(*)
        `)
        .eq('state_id', stateData.id)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as City[];
    },
    enabled: !!normalized,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    gcTime: 30 * 60 * 1000,
  });
}

export function useCity(slug: string, stateSlug?: string) {
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
