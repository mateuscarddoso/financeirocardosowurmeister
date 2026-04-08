import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*, areas(name, color)')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return [];

      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('profiles')
        .select('*, areas(name, color)')
        .eq('id', authData.user.id)
        .single();

      if (currentProfileError) throw currentProfileError;

      if (currentProfile.role !== 'leader') {
        return currentProfile ? [currentProfile] : [];
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*, areas(name, color)')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
