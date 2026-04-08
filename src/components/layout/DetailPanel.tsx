import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { useUpdateTask } from '@/hooks/useTasks';
import { useAreas, useStatuses } from '@/hooks/useAreas';
import { useMembers } from '@/hooks/useProfile';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DetailSubtasks } from './detail/DetailSubtasks';
import { DetailComments } from './detail/DetailComments';

interface DetailPanelProps {
  task: any;
  onClose: () => void;
  isLeader: boolean;
}

export function DetailPanel({ task, onClose, isLeader }: DetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const { data: areas } = useAreas();
  const { data: statuses } = useStatuses();
  const { data: members } = useMembers();
  const updateTask = useUpdateTask();

  const handleTitleBlur = () => {
    if (title !== task.title) updateTask.mutate({ id: task.id, title });
  };

  const handleDescriptionBlur = () => {
    if (description !== (task.description || '')) updateTask.mutate({ id: task.id, description });
  };

  const handleDueDateChange = (val: string) => {
    setDueDate(val);
    updateTask.mutate({ id: task.id, due_date: val || null });
  };

  const handleStatusChange = (value: string) => {
    const selectedStatus = statuses?.find(status => status.id === value);
    updateTask.mutate({
      id: task.id,
      status_id: value,
      done: selectedStatus?.label === 'Concluído',
    });
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 z-40 w-full border-l border-border bg-card md:sticky md:top-0 md:h-screen md:w-[380px] md:flex-shrink-0"
    >
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border p-4">
          <span className="text-xs font-medium text-muted-foreground">Detalhes da tarefa</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 p-4">
        {/* Title */}
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-base font-semibold bg-transparent border-none outline-none text-foreground"
        />

        {/* Description */}
        <div>
          <label className="text-[11px] text-muted-foreground mb-1.5 block font-medium">Descrição</label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Adicione uma descrição detalhada..."
            className="text-sm min-h-[80px] resize-none"
          />
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Status</label>
            <Select
              value={task.status_id || ''}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Prazo</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={e => handleDueDateChange(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background pl-7 pr-2 text-xs text-foreground"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Prioridade</label>
            <Select
              value={task.priority || 'mid'}
              onValueChange={v => updateTask.mutate({ id: task.id, priority: v })}
              disabled={!isLeader}
            >
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="mid">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLeader && (
            <div>
              <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Área</label>
              <Select
                value={task.area_id || ''}
                onValueChange={v => updateTask.mutate({ id: task.id, area_id: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {areas?.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLeader && (
            <div className="col-span-2">
              <label className="text-[11px] text-muted-foreground mb-1 block font-medium">Responsável</label>
              <Select
                value={task.assignee_id || ''}
                onValueChange={v => updateTask.mutate({ id: task.id, assignee_id: v })}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {members?.filter(m => m.role !== 'pending').map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Subtasks */}
        <DetailSubtasks taskId={task.id} />

        {/* Comments */}
        <DetailComments taskId={task.id} />
        </div>
      </div>
    </motion.div>
  );
}
