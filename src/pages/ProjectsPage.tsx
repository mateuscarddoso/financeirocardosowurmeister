import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TaskList } from '@/components/tasks/TaskList';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { CompletionCelebration } from '@/components/tasks/CompletionCelebration';
import { DetailPanel } from '@/components/layout/DetailPanel';
import { useProfile } from '@/hooks/useProfile';

interface ProjectsPageProps {
  areaId: string | null;
  viewMode: 'list' | 'kanban';
}

export default function ProjectsPage({ areaId, viewMode }: ProjectsPageProps) {
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [celebrationTask, setCelebrationTask] = useState<string | null>(null);
  const { data: profile } = useProfile();
  const isLeader = profile?.role === 'leader';
  const onlyMine = !isLeader;
  const effectiveAreaId = isLeader ? areaId : (profile?.area_id || null);

  return (
    <div className="flex flex-1">
      <div className="flex-1 overflow-auto p-3 md:p-6">
        {viewMode === 'list' ? (
          <TaskList
            areaId={effectiveAreaId}
            onlyMine={onlyMine}
            onSelectTask={setSelectedTask}
            onCelebrate={setCelebrationTask}
          />
        ) : (
          <KanbanBoard areaId={effectiveAreaId} onlyMine={onlyMine} onSelectTask={setSelectedTask} />
        )}
      </div>

      <AnimatePresence>
        {selectedTask && (
          <DetailPanel
            key={selectedTask.id}
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            isLeader={isLeader}
          />
        )}
      </AnimatePresence>

      <CompletionCelebration
        open={!!celebrationTask}
        taskTitle={celebrationTask || undefined}
        onClose={() => setCelebrationTask(null)}
      />
    </div>
  );
}
