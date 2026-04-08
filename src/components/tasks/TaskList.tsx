import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  Star,
  Trash2,
  User2,
  Users2,
  X,
} from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTasks, useCreateTask, useDeleteTask, useUpdateTask } from '@/hooks/useTasks';
import { useStatuses } from '@/hooks/useAreas';
import { useMembers, useProfile } from '@/hooks/useProfile';
import { useAddXP } from '@/hooks/useXP';
import { PRIORITIES } from '@/lib/theme';
import { TaskRow } from './TaskRow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AvatarCircle } from '@/components/shared/AvatarCircle';

interface TaskListProps {
  areaId: string | null;
  onlyMine?: boolean;
  onSelectTask: (task: any) => void;
  onCelebrate?: (taskTitle: string) => void;
}

type FilterView = 'all' | 'today' | 'overdue' | 'high';

export function TaskList({ areaId, onlyMine = false, onSelectTask, onCelebrate }: TaskListProps) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data: tasks, isLoading } = useTasks({ areaId, onlyMine });
  const { data: statuses } = useStatuses();
  const { data: profile } = useProfile();
  const { data: members } = useMembers();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addXP = useAddXP();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inlineTitle, setInlineTitle] = useState('');
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterView>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const isLeader = profile?.role === 'leader';
  const concludedStatus = statuses?.find(status => status.label === 'Concluído');

  const total = tasks?.length || 0;
  const done = tasks?.filter(task => task.done).length || 0;
  const highPriority = tasks?.filter(task => task.priority === 'high' && !task.done).length || 0;
  const overdue = tasks?.filter(task => {
    if (!task.due_date || task.done) return false;
    const due = new Date(`${task.due_date}T00:00:00`);
    return isPast(due) && !isToday(due);
  }).length || 0;
  const todayCount = tasks?.filter(task => {
    if (!task.due_date || task.done) return false;
    return isToday(new Date(`${task.due_date}T00:00:00`));
  }).length || 0;

  const filteredTasks = useMemo(() => {
    let list = tasks || [];

    if (activeFilter === 'today') {
      list = list.filter(task => task.due_date && isToday(new Date(`${task.due_date}T00:00:00`)) && !task.done);
    } else if (activeFilter === 'overdue') {
      list = list.filter(task => {
        if (!task.due_date || task.done) return false;
        const due = new Date(`${task.due_date}T00:00:00`);
        return isPast(due) && !isToday(due);
      });
    } else if (activeFilter === 'high') {
      list = list.filter(task => task.priority === 'high' && !task.done);
    }

    if (priorityFilter !== 'all') {
      list = list.filter(task => task.priority === priorityFilter);
    }

    return list;
  }, [activeFilter, priorityFilter, tasks]);

  const groupedByMonthAndAssignee = useMemo(() => {
    return filteredTasks.reduce((acc: Record<string, Record<string, any[]>>, task) => {
      const monthKey = `${task.year || currentYear}-${task.month || currentMonth}`;
      const assigneeKey = task.profiles?.id || 'unassigned';

      if (!acc[monthKey]) acc[monthKey] = {};
      if (!acc[monthKey][assigneeKey]) acc[monthKey][assigneeKey] = [];
      acc[monthKey][assigneeKey].push(task);
      return acc;
    }, {});
  }, [currentMonth, currentYear, filteredTasks]);

  const sortedMonthKeys = Object.keys(groupedByMonthAndAssignee).sort((a, b) => {
    const [ay, am] = a.split('-').map(Number);
    const [by, bm] = b.split('-').map(Number);
    if (ay === currentYear && am === currentMonth) return -1;
    if (by === currentYear && bm === currentMonth) return 1;
    return (by * 12 + bm) - (ay * 12 + am);
  });

  const monthNames = ['', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handleSelect = (id: string, multi: boolean) => {
    if (multi) {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id]);
      return;
    }
    setSelectedIds([id]);
  };

  const handleToggleDone = (task: any, doneValue: boolean) => {
    const updates: Record<string, unknown> = { id: task.id, done: doneValue };
    if (doneValue && concludedStatus) {
      updates.status_id = concludedStatus.id;
    }
    updateTask.mutate(updates as any);

    if (doneValue) {
      onCelebrate?.(task.title);
    }

    if (doneValue && profile) {
      addXP.mutate({
        userId: profile.id,
        currentXP: profile.xp || 0,
        currentBadges: (profile.badges as string[]) || [],
        action: 'task',
      });
    }
  };

  const handleUpdate = (id: string, updates: Record<string, unknown>) => {
    updateTask.mutate({ id, ...updates } as any);
  };

  const handleInlineCreate = () => {
    if (!inlineTitle.trim() || !profile) return;
    const defaultStatus = statuses?.[0]?.id;

    createTask.mutate({
      title: inlineTitle.trim(),
      month: currentMonth,
      year: currentYear,
      status_id: defaultStatus,
      area_id: profile.area_id || areaId || undefined,
      assignee_id: profile.id,
      created_by: profile.id,
      priority: 'mid',
    });

    setInlineTitle('');
    setShowInlineAdd(false);
  };

  const handleBatchDelete = () => {
    selectedIds.forEach(id => deleteTask.mutate(id));
    setSelectedIds([]);
  };

  const handleBatchStatus = (statusId: string) => {
    selectedIds.forEach(id => updateTask.mutate({ id, status_id: statusId }));
    setSelectedIds([]);
  };

  const filterViews: { key: FilterView; label: string; count: number; icon: any; active?: string }[] = [
    { key: 'all', label: 'Todas', count: total, icon: CheckCircle2 },
    { key: 'today', label: 'Hoje', count: todayCount, icon: Star, active: 'text-primary' },
    { key: 'overdue', label: 'Atrasadas', count: overdue, icon: Clock, active: 'text-warning' },
    { key: 'high', label: 'Urgentes', count: highPriority, icon: AlertTriangle, active: 'text-destructive' },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-5">
        {filterViews.map((filter, index) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.key;
          return (
            <motion.button
              key={filter.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                'rounded-2xl border p-4 text-left transition-all',
                isActive ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20' : 'border-border bg-card hover:border-muted-foreground/20'
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <Icon className={cn('h-4 w-4', isActive ? (filter.active || 'text-primary') : 'text-muted-foreground')} />
                <span className="text-[11px] font-medium text-muted-foreground">{filter.label}</span>
              </div>
              <p className={cn('text-2xl font-bold', isActive ? 'text-foreground' : 'text-foreground/70')}>{filter.count}</p>
            </motion.button>
          );
        })}

        <div className="col-span-2 rounded-2xl border border-border bg-card p-4 xl:col-span-1">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            {onlyMine ? <User2 className="h-4 w-4" /> : <Users2 className="h-4 w-4" />}
            <span className="text-[11px] font-medium uppercase tracking-wider">
              {onlyMine ? 'Sua area' : 'Organizacao'}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {onlyMine ? `Area de ${profile?.name?.split(' ')[0] || 'voce'}` : `${members?.filter(member => member.role !== 'pending').length || 0} pessoas ativas`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {onlyMine ? `${done}/${total} concluidas no seu fluxo.` : 'Visualize tarefas por area funcional e agrupadas por pessoa.'}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card/80 p-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="text-[11px] font-medium uppercase tracking-wider">Filtros</span>
        </div>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 w-full text-[11px] sm:w-40">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {Object.entries(PRIORITIES).map(([key, { label, color }]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(activeFilter !== 'all' || priorityFilter !== 'all') && (
          <button
            onClick={() => {
              setActiveFilter('all');
              setPriorityFilter('all');
            }}
            className="flex items-center gap-1 text-[11px] text-muted-foreground transition hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Limpar filtros
          </button>
        )}

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {Object.entries(PRIORITIES).map(([key, { label, color }]) => (
            <div key={key} className="flex items-center gap-1 rounded-full bg-muted px-2 py-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center">
          <span className="text-sm font-medium text-foreground">{selectedIds.length} selecionada(s)</span>
          <Select onValueChange={handleBatchStatus}>
            <SelectTrigger className="h-8 w-full text-xs sm:w-44">
              <SelectValue placeholder="Mover para..." />
            </SelectTrigger>
            <SelectContent>
              {statuses?.map(status => <SelectItem key={status.id} value={status.id}>{status.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {(isLeader || onlyMine) && (
            <Button variant="destructive" size="sm" onClick={handleBatchDelete}>
              <Trash2 className="mr-1 h-3.5 w-3.5" />
              Excluir
            </Button>
          )}
          <button onClick={() => setSelectedIds([])} className="text-xs text-muted-foreground transition hover:text-foreground sm:ml-auto">
            Limpar
          </button>
        </div>
      )}

      <div className="rounded-[24px] border border-border bg-card/90 p-3 shadow-sm sm:p-4">
        <div className="hidden items-center gap-3 px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70 select-none md:flex">
          <div className="w-4" />
          <span className="flex-1">Tarefa</span>
          <span className="w-24 text-center">Prazo</span>
          <span className="w-28 text-center">Pessoa</span>
          <span className="w-20 text-center lg:w-24">Area</span>
          <span className="w-32 text-center">Status</span>
          <span className="w-24 text-center">Prioridade</span>
        </div>

        <div className="mb-4 mt-2">
          {showInlineAdd ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-2 rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 sm:flex-row sm:items-center"
            >
              <Plus className="h-4 w-4 shrink-0 text-primary" />
              <Input
                autoFocus
                placeholder="Digite o titulo e pressione Enter..."
                value={inlineTitle}
                onChange={event => setInlineTitle(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') handleInlineCreate();
                  if (event.key === 'Escape') {
                    setShowInlineAdd(false);
                    setInlineTitle('');
                  }
                }}
                className="h-9 border-none bg-transparent text-sm shadow-none focus-visible:ring-0"
              />
              <div className="flex gap-2 sm:ml-auto">
                <Button size="sm" onClick={handleInlineCreate}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowInlineAdd(false); setInlineTitle(''); }}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => setShowInlineAdd(true)}
              className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-muted-foreground/20 px-4 py-3 text-sm text-muted-foreground transition hover:border-primary/30 hover:bg-primary/[0.03] hover:text-primary"
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </button>
          )}
        </div>

        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm text-muted-foreground">
              {activeFilter !== 'all' ? 'Nenhuma tarefa neste filtro.' : 'Nenhuma tarefa ainda.'}
            </p>
            {activeFilter !== 'all' && (
              <button onClick={() => setActiveFilter('all')} className="text-xs text-primary hover:underline">
                Ver todas
              </button>
            )}
          </div>
        ) : (
          sortedMonthKeys.map(monthKey => {
            const [year, month] = monthKey.split('-').map(Number);
            const assigneeGroups = Object.entries(groupedByMonthAndAssignee[monthKey]).sort(([, aTasks], [, bTasks]) => {
              const aName = aTasks[0]?.profiles?.name || 'Sem responsavel';
              const bName = bTasks[0]?.profiles?.name || 'Sem responsavel';
              return aName.localeCompare(bName);
            });

            return (
              <div key={monthKey} className="space-y-4 pb-5">
                <div className="sticky top-0 z-10 bg-card/95 px-1 py-2 backdrop-blur">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {monthNames[month]} {year}
                  </h3>
                </div>

                {assigneeGroups.map(([assigneeKey, assigneeTasks]) => {
                  const assignee = assigneeTasks[0]?.profiles;
                  const groupTitle = onlyMine ? 'Suas tarefas' : assignee?.name || 'Sem responsavel';
                  const groupSubtitle = assignee?.areas?.name || (areaId ? 'Area filtrada' : 'Sem area');

                  return (
                    <section key={`${monthKey}-${assigneeKey}`} className="rounded-2xl border border-border/70 bg-background/60 p-3">
                      <div className="mb-3 flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarCircle src={assignee?.avatar_url} name={groupTitle} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{groupTitle}</p>
                            <p className="text-xs text-muted-foreground">{groupSubtitle}</p>
                          </div>
                        </div>
                        <div className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                          {assigneeTasks.length} tarefa(s)
                        </div>
                      </div>

                      <AnimatePresence>
                        {assigneeTasks.map(task => (
                          <TaskRow
                            key={task.id}
                            task={task}
                            selected={selectedIds.includes(task.id)}
                            onSelect={handleSelect}
                            onToggleDone={doneValue => handleToggleDone(task, doneValue)}
                            onClick={onSelectTask}
                            onUpdate={handleUpdate}
                            statuses={statuses}
                            members={members}
                            isLeader={isLeader}
                            onlyMine={onlyMine}
                          />
                        ))}
                      </AnimatePresence>
                    </section>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
