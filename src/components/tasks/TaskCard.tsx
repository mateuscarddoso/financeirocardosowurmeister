import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { StatusPill } from '@/components/shared/StatusPill';
import { PriorityDot } from '@/components/shared/PriorityDot';
import { AreaTag } from '@/components/shared/AreaTag';
import { AvatarCircle } from '@/components/shared/AvatarCircle';

interface TaskCardProps {
  task: any;
  onClick: (task: any) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    scale: isDragging ? 1.02 : 1,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(task)}
      className={`rounded-card border border-border bg-card p-3 cursor-pointer transition hover:border-primary/30 ${isDragging ? 'shadow-lg' : ''}`}
    >
      <p className="text-sm font-medium text-foreground mb-2 line-clamp-2">{task.title}</p>

      <div className="flex items-center gap-2 flex-wrap">
        {task.areas && <AreaTag name={task.areas.name} color={task.areas.color} />}
        <PriorityDot priority={task.priority || 'mid'} showLabel />
        {task.carried_over && (
          <span className="rounded-pill bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">Atraso</span>
        )}
      </div>

      {task.profiles && (
        <div className="mt-3 flex items-center gap-2">
          <AvatarCircle src={task.profiles.avatar_url} name={task.profiles.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">{task.profiles.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{task.profiles.areas?.name || 'Sem area'}</p>
          </div>
        </div>
      )}

      {task.subtasks && task.subtasks.length > 0 && (
        <div className="mt-2 text-[11px] text-muted-foreground">
          {task.subtasks.filter((s: any) => s.done).length}/{task.subtasks.length} subtarefas
        </div>
      )}
    </div>
  );
}
