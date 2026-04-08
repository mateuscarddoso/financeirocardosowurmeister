import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAreas() {
  return useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('areas').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useStatuses() {
  return useQuery({
    queryKey: ['statuses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('statuses').select('*').order('position');
      if (error) throw error;
      return data;
    },
  });
}
