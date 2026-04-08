import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { XP_VALUES, getLevelFromXP, checkNewBadges } from '@/lib/xp';
import { toast } from '@/hooks/use-toast';

export function useAddXP() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      currentXP,
      currentBadges,
      action,
    }: {
      userId: string;
      currentXP: number;
      currentBadges: string[];
      action: 'task' | 'subtask' | 'month_clean';
    }) => {
      const xpGain = action === 'task' ? XP_VALUES.TASK_COMPLETED
        : action === 'subtask' ? XP_VALUES.SUBTASK_COMPLETED
        : XP_VALUES.MONTH_CLEAN;

      const newXP = currentXP + xpGain;
      const newLevel = getLevelFromXP(newXP);

      const { error } = await supabase
        .from('profiles')
        .update({ xp: newXP, level: newLevel.level })
        .eq('id', userId);
      if (error) throw error;

      return { xpGain, newXP, newLevel };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['profile'] });

      const actionLabel = result.xpGain === XP_VALUES.TASK_COMPLETED ? 'Tarefa concluída!'
        : result.xpGain === XP_VALUES.SUBTASK_COMPLETED ? 'Subtarefa concluída!'
        : '🏆 Mês limpo!';

      toast({
        title: `⚡ +${result.xpGain} XP — ${actionLabel}`,
        className: 'bg-accent text-accent-foreground border-accent',
      });
    },
  });
}
