import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useTasks, useUpdateTask } from '@/hooks/useTasks';
import { useStatuses } from '@/hooks/useAreas';
import { TaskCard } from './TaskCard';

interface KanbanBoardProps {
  areaId: string | null;
  onlyMine?: boolean;
  onSelectTask: (task: any) => void;
}

function KanbanColumn({ status, tasks, onSelectTask }: { status: any; tasks: any[]; onSelectTask: (t: any) => void }) {
  const { setNodeRef } = useDroppable({ id: status.id });
  const taskIds = tasks.map(t => t.id);

  return (
    <div className="w-[280px] flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
        <h3 className="text-xs font-semibold text-foreground">{status.label}</h3>
        <span className="text-[11px] text-muted-foreground ml-auto">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className="space-y-2 min-h-[100px] rounded-lg bg-muted/30 p-2">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onClick={onSelectTask} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ areaId, onlyMine = false, onSelectTask }: KanbanBoardProps) {
  const { data: tasks, isLoading } = useTasks({ areaId, onlyMine });
  const { data: statuses } = useStatuses();
  const updateTask = useUpdateTask();
  const [activeTask, setActiveTask] = useState<any>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column (status)
    const targetStatus = statuses?.find(s => s.id === overId);
    const isStatus = !!targetStatus;
    if (isStatus) {
      updateTask.mutate({ id: taskId, status_id: overId, done: targetStatus?.label === 'Concluído' });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Carregando...</div>;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses?.map(status => {
          const columnTasks = (tasks || []).filter(t => t.status_id === status.id);
          return (
            <KanbanColumn
              key={status.id}
              status={status}
              tasks={columnTasks}
              onSelectTask={onSelectTask}
            />
          );
        })}
      </div>
    </DndContext>
  );
}
