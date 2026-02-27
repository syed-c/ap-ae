import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Treatment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
  children?: Treatment[];
}

export function useTreatments() {
  return useQuery({
    queryKey: ['treatments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return (data || []) as Treatment[];
    },
  });
}

export function useTreatment(id: string) {
  return useQuery({
    queryKey: ['treatment', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as unknown as Treatment;
    },
    enabled: !!id,
  });
}
