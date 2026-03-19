import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RealCounts {
  clinics: number;
  states: number;
  cities: number;
  dentists: number;
  treatments: number;
}

export function useRealCounts(initialData?: RealCounts | null) {
  return useQuery({
    queryKey: ['real-counts'],
    queryFn: async (): Promise<RealCounts> => {
      // Fetch all counts IN PARALLEL
      const [
        statesRes,
        citiesRes,
        clinicsRes,
        dentistsRes,
        treatmentsRes,
      ] = await Promise.all([
        supabase.from('states').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('cities').select('id', { count: 'exact', head: true }).eq('is_active', true).not('state_id', 'is', null),
        supabase.from('clinics').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('dentists').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('treatments').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      const activeStateIds = (statesRes.data || []).map(s => s.id);
      const citiesCount = citiesRes.count || 0;
      const clinicCount = clinicsRes.count || 0;
      const dentistCount = dentistsRes.count || 0;
      const treatmentsCount = treatmentsRes.count || 0;

      return {
        clinics: clinicCount,
        states: activeStateIds.length,
        cities: citiesCount,
        dentists: dentistCount,
        treatments: treatmentsCount,
      };
    },
    initialData: initialData ?? undefined,
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to get clinic count for a specific state
export function useStateClinicCount(stateId?: string) {
  return useQuery({
    queryKey: ['state-clinic-count', stateId],
    queryFn: async () => {
      if (!stateId) return 0;

      const { count } = await supabase
        .from('clinics')
        .select('id', { count: 'exact', head: true })
        .eq('city.state_id', stateId)
        .eq('is_active', true);

      return count || 0;
    },
    enabled: !!stateId,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Hook to get clinic count for a specific service/treatment
export function useTreatmentClinicCount(treatmentId?: string) {
  return useQuery({
    queryKey: ['treatment-clinic-count', treatmentId],
    queryFn: async () => {
      if (!treatmentId) return 0;

      const { count } = await supabase
        .from('clinic_treatments')
        .select('clinic_id', { count: 'exact', head: true })
        .eq('treatment_id', treatmentId);

      return count || 0;
    },
    enabled: !!treatmentId,
    staleTime: 5 * 60 * 1000,
  });
}
