import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface UseTasksOptions {
  areaId?: string | null;
  month?: number;
  year?: number;
  onlyMine?: boolean;
}

export function useTasks({ areaId, month, year, onlyMine = false }: UseTasksOptions = {}) {
  return useQuery({
    queryKey: ['tasks', areaId, month, year, onlyMine],
    queryFn: async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      let query = supabase
        .from('tasks')
        .select(`
          *,
          areas(name, color),
          statuses(label, color, position),
          subtasks(*),
          profiles!tasks_assignee_id_fkey(
            id,
            name,
            email,
            avatar_url,
            area_id,
            areas(name, color)
          )
        `)

        .order('created_at', { ascending: false });

      if (areaId) query = query.eq('area_id', areaId);
      if (month !== undefined) query = query.eq('month', month);
      if (year !== undefined) query = query.eq('year', year);
      if (onlyMine && userId) query = query.eq('assignee_id', userId);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: {
      title: string;
      area_id?: string;
      status_id?: string;
      priority?: string;
      assignee_id?: string;
      created_by: string;
      month?: number;
      year?: number;
      description?: string;
      due_date?: string;
    }) => {
      const { data, error } = await supabase.from('tasks').insert(task).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, unknown>) => {
      const { data, error } = await supabase.from('tasks').update(updates as any).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: ['subtasks', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('position');
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useToggleSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from('subtasks').update({ done }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subtasks'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useCreateSubtask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (subtask: { task_id: string; title: string; position?: number }) => {
      const { data, error } = await supabase.from('subtasks').insert(subtask).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subtasks'] }),
  });
}
