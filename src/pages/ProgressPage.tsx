import { motion } from 'framer-motion';
import { useTasks } from '@/hooks/useTasks';
import { useAreas } from '@/hooks/useAreas';
import { useProfile } from '@/hooks/useProfile';
import { getLevelFromXP, getXPProgress, BADGES } from '@/lib/xp';
import { Progress } from '@/components/ui/progress';

interface ProgressPageProps {
  areaId: string | null;
}

export default function ProgressPage({ areaId }: ProgressPageProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const { data: profile } = useProfile();
  const isLeader = profile?.role === 'leader';
  const { data: tasks } = useTasks({ areaId, month: currentMonth, year: currentYear, onlyMine: !isLeader });
  const { data: areas } = useAreas();

  const total = tasks?.length || 0;
  const done = tasks?.filter(t => t.done).length || 0;
  const inProgress = tasks?.filter(t => !t.done && t.statuses?.label === 'Em andamento').length || 0;
  const overdue = tasks?.filter(t => t.carried_over).length || 0;
  const completionPercent = total > 0 ? Math.round((done / total) * 100) : 0;

  const level = profile ? getLevelFromXP(profile.xp || 0) : { level: 1, title: 'Iniciante' };
  const xpProgress = profile ? getXPProgress(profile.xp || 0) : 0;
  const userBadges = ((profile?.badges as string[]) || []);

  const metrics = [
    { label: 'Total', value: total, color: 'text-foreground' },
    { label: 'Concluídas', value: done, color: 'text-success' },
    { label: 'Em andamento', value: inProgress, color: 'text-warning' },
    { label: 'Em atraso', value: overdue, color: 'text-destructive' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-8">
      <h2 className="text-lg font-semibold text-foreground">Progresso</h2>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-card border border-border bg-card p-4"
          >
            <p className="text-[11px] text-muted-foreground mb-1">{m.label}</p>
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-card border border-border bg-card p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Progresso do mês</p>
          <span className="text-sm font-bold text-primary">{completionPercent}%</span>
        </div>
        <Progress value={completionPercent} className="h-2.5" />
      </motion.div>

      {/* Per area (leader only) */}
      {isLeader && areas && (
        <div className="rounded-card border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-4">Por área</p>
          <div className="space-y-3">
            {areas.map(area => {
              const areaTasks = tasks?.filter(t => t.area_id === area.id) || [];
              const areaDone = areaTasks.filter(t => t.done).length;
              const areaPercent = areaTasks.length > 0 ? Math.round((areaDone / areaTasks.length) * 100) : 0;
              return (
                <div key={area.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: area.color }} />
                      <span className="text-xs font-medium text-foreground">{area.name}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground">{areaDone}/{areaTasks.length}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${areaPercent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: area.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* XP & Badges */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-card border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-3">Seu XP</p>
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{profile?.xp || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Nível {level.level} — {level.title}</p>
            <Progress value={xpProgress} className="h-2 mt-3" />
          </div>
        </div>

        <div className="rounded-card border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-3">Conquistas</p>
          <div className="grid grid-cols-3 gap-2">
            {BADGES.map(badge => {
              const unlocked = userBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`flex flex-col items-center gap-1 rounded-lg p-2 text-center ${unlocked ? 'bg-primary/5' : 'bg-muted/50 opacity-40'}`}
                  title={badge.description}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-[10px] font-medium text-foreground leading-tight">{badge.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
