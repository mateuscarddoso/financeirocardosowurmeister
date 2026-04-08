import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSubtasks, useToggleSubtask, useCreateSubtask } from '@/hooks/useTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

interface DetailSubtasksProps {
  taskId: string;
}

export function DetailSubtasks({ taskId }: DetailSubtasksProps) {
  const [newSubtask, setNewSubtask] = useState('');
  const { data: subtasks } = useSubtasks(taskId);
  const toggleSubtask = useToggleSubtask();
  const createSubtask = useCreateSubtask();

  const handleAdd = () => {
    if (!newSubtask.trim()) return;
    createSubtask.mutate({ task_id: taskId, title: newSubtask, position: (subtasks?.length || 0) });
    setNewSubtask('');
  };

  const doneCount = subtasks?.filter(s => s.done).length || 0;
  const totalCount = subtasks?.length || 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-muted-foreground">Subtarefas</p>
        {totalCount > 0 && (
          <span className="text-[11px] text-muted-foreground">{doneCount}/{totalCount}</span>
        )}
      </div>

      {totalCount > 0 && (
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${totalCount > 0 ? (doneCount / totalCount) * 100 : 0}%` }} />
        </div>
      )}

      <div className="space-y-1">
        {subtasks?.map(st => (
          <div key={st.id} className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-muted/50 transition">
            <Checkbox
              checked={st.done || false}
              onCheckedChange={checked => toggleSubtask.mutate({ id: st.id, done: !!checked })}
            />
            <span className={`text-sm ${st.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {st.title}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Adicionar subtarefa..."
          value={newSubtask}
          onChange={e => setNewSubtask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="h-7 text-xs border-none shadow-none bg-transparent focus-visible:ring-0 px-0"
        />
      </div>
    </div>
  );
}
