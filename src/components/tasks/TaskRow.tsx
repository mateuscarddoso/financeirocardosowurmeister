import { useState } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusPill } from '@/components/shared/StatusPill';
import { PriorityDot } from '@/components/shared/PriorityDot';
import { AreaTag } from '@/components/shared/AreaTag';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { PRIORITIES } from '@/lib/theme';

interface TaskRowProps {
  task: any;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onToggleDone: (done: boolean) => void;
  onClick: (task: any) => void;
  onUpdate: (id: string, updates: Record<string, unknown>) => void;
  statuses?: any[];
  members?: any[];
  isLeader: boolean;
  onlyMine?: boolean;
}

export function TaskRow({ task, selected, onSelect, onToggleDone, onClick, onUpdate, statuses, members, isLeader, onlyMine = false }: TaskRowProps) {
  const dueDate = task.due_date ? new Date(task.due_date + 'T00:00:00') : null;
  const isOverdue = dueDate && !task.done && isPast(dueDate) && !isToday(dueDate);
  const isDueToday = dueDate && isToday(dueDate);

  const [dateOpen, setDateOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);

  const stopProp = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn(
        'group flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all',
        task.priority === 'high' && !task.done && 'border-destructive/20 bg-destructive/[0.02] hover:bg-destructive/[0.05]',
        task.priority !== 'high' && 'border-border hover:bg-muted/40',
        selected && 'bg-primary/5 border-primary/30',
        task.done && 'opacity-45'
      )}
      onClick={e => {
        if (e.ctrlKey || e.metaKey) {
          onSelect(task.id, true);
        } else {
          onClick(task);
        }
      }}
    >
      <Checkbox
        checked={task.done || false}
        onCheckedChange={checked => onToggleDone(!!checked)}
        onClick={stopProp}
        className={task.done ? 'data-[state=checked]:bg-primary' : ''}
      />

      <span className={cn('flex-1 text-sm font-medium text-foreground truncate min-w-0', task.done && 'line-through text-muted-foreground')}>
        {task.title}
      </span>

      {task.carried_over && (
        <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive shrink-0">
          Atraso
        </span>
      )}

      {/* Inline date picker */}
      <div className="w-24 hidden md:flex justify-center shrink-0" onClick={stopProp}>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <button className={cn(
              'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition hover:bg-muted',
              isOverdue && 'text-destructive font-medium',
              isDueToday && 'text-warning font-medium',
              !isOverdue && !isDueToday && 'text-muted-foreground',
              !dueDate && 'text-muted-foreground/40'
            )}>
              <CalendarIcon className="h-3 w-3" />
              {dueDate ? format(dueDate, "dd MMM", { locale: ptBR }) : '—'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" side="bottom">
            <Calendar
              mode="single"
              selected={dueDate || undefined}
              onSelect={date => {
                onUpdate(task.id, { due_date: date ? format(date, 'yyyy-MM-dd') : null });
                setDateOpen(false);
              }}
              className="p-3 pointer-events-auto"
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Inline area (read-only) */}
      <div className="w-28 hidden md:flex justify-center shrink-0">
        {task.profiles ? (
          <div className="flex items-center gap-2 rounded-full bg-muted/70 px-2.5 py-1">
            <AvatarCircle src={task.profiles.avatar_url} name={task.profiles.name} size="sm" />
            <span className="max-w-[84px] truncate text-[11px] font-medium text-foreground">
              {onlyMine ? 'Você' : task.profiles.name}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-muted-foreground/40">Sem resp.</span>
        )}
      </div>

      <div className="w-20 hidden lg:flex justify-center shrink-0">
        {task.areas && <AreaTag name={task.areas.name} color={task.areas.color} />}
      </div>

      {/* Inline status picker */}
      <div className="w-28 hidden md:flex justify-center shrink-0" onClick={stopProp}>
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <button className="rounded-md hover:bg-muted transition px-1 py-0.5">
              {task.statuses ? (
                <StatusPill label={task.statuses.label} color={task.statuses.color} />
              ) : (
                <span className="text-[11px] text-muted-foreground/40">Status</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-1" align="center">
            <div className="space-y-0.5">
              {statuses?.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    onUpdate(task.id, { status_id: s.id, done: s.label === 'Concluído' });
                    setStatusOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition hover:bg-muted',
                    task.status_id === s.id && 'bg-muted font-medium'
                  )}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Inline priority picker */}
      <div className="w-24 flex justify-center shrink-0" onClick={stopProp}>
        <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
          <PopoverTrigger asChild>
            <button className="rounded-md hover:bg-muted transition p-1" disabled={!isLeader}>
              <PriorityDot priority={task.priority || 'mid'} showLabel />
            </button>
          </PopoverTrigger>
          {isLeader && (
            <PopoverContent className="w-32 p-1" align="center">
              <div className="space-y-0.5">
                {Object.entries(PRIORITIES).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => { onUpdate(task.id, { priority: key }); setPriorityOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition hover:bg-muted',
                      task.priority === key && 'bg-muted font-medium'
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    {label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>

      {/* Inline assignee picker */}
      <div className="hidden w-8 justify-center shrink-0" onClick={stopProp}>
        <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
          <PopoverTrigger asChild>
            <button className="rounded-full hover:ring-2 hover:ring-muted transition" disabled={!isLeader}>
              {task.profiles ? (
                <AvatarCircle src={task.profiles.avatar_url} name={task.profiles.name} size="sm" />
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground">?</span>
                </div>
              )}
            </button>
          </PopoverTrigger>
          {isLeader && (
            <PopoverContent className="w-44 p-1" align="end">
              <div className="space-y-0.5">
                {members?.filter(m => m.role !== 'pending').map(m => (
                  <button
                    key={m.id}
                    onClick={() => { onUpdate(task.id, { assignee_id: m.id }); setAssigneeOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition hover:bg-muted',
                      task.assignee_id === m.id && 'bg-muted font-medium'
                    )}
                  >
                    <AvatarCircle src={m.avatar_url} name={m.name} size="sm" />
                    <span className="truncate">{m.name}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>
    </motion.div>
  );
}
