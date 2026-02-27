import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ServicePriceRange {
  id: string;
  treatment_id: string;
  state_id: string;
  price_min: number;
  price_max: number;
  currency: string;
  avg_price: number | null;
  source: string | null;
  state?: { id: string; name: string; slug: string; abbreviation: string };
  treatment?: { id: string; name: string; slug: string };
}

export function useServicePriceRanges(treatmentSlug?: string) {
  return useQuery({
    queryKey: ['service-price-ranges', treatmentSlug],
    queryFn: async () => {
      let query = supabase
        .from('service_price_ranges')
        .select(`
          *,
          state:states(id, name, slug, abbreviation),
          treatment:treatments(id, name, slug)
        `)
        .eq('is_active', true)
        .order('price_min');

      if (treatmentSlug) {
        const { data: treatment } = await supabase
          .from('treatments')
          .select('id')
          .eq('slug', treatmentSlug)
          .maybeSingle();
        if (treatment) {
          query = query.eq('treatment_id', treatment.id);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ServicePriceRange[];
    },
    enabled: true,
  });
}

export function useAllServicePrices() {
  return useQuery({
    queryKey: ['all-service-prices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_price_ranges')
        .select(`
          *,
          state:states(id, name, slug, abbreviation),
          treatment:treatments(id, name, slug)
        `)
        .eq('is_active', true)
        .order('price_min');
      if (error) throw error;
      return (data || []) as ServicePriceRange[];
    },
  });
}

export function useBudgetRanges() {
  return useQuery({
    queryKey: ['budget-ranges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_ranges')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data || [];
    },
  });
}
