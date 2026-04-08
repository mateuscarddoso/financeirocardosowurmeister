import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useNotes(areaId?: string | null) {
  return useQuery({
    queryKey: ['notes', areaId],
    queryFn: async () => {
      let query = supabase
        .from('notes')
        .select('*, areas(name, color), profiles!notes_author_id_fkey(name, avatar_url)')
        .order('created_at', { ascending: false });

      if (areaId) query = query.eq('area_id', areaId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (note: {
      title: string;
      content?: string;
      area_id?: string;
      author_id: string;
      shared?: boolean;
      transcript?: string;
    }) => {
      const { data, error } = await supabase.from('notes').insert(note).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('notes').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });
}
