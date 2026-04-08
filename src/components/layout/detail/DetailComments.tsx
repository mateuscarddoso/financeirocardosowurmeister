import { useState } from 'react';
import { Send } from 'lucide-react';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface DetailCommentsProps {
  taskId: string;
}

export function DetailComments({ taskId }: DetailCommentsProps) {
  const [commentText, setCommentText] = useState('');
  const qc = useQueryClient();

  const { data: comments } = useQuery({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles!comments_author_id_fkey(name, avatar_url)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('comments').insert({ task_id: taskId, author_id: user.id, content: commentText });
    setCommentText('');
    qc.invalidateQueries({ queryKey: ['comments', taskId] });
  };

  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">Conversa</p>
      <div className="space-y-3 max-h-48 overflow-y-auto">
        {comments?.map(c => (
          <div key={c.id} className="flex gap-2">
            <AvatarCircle src={(c as any).profiles?.avatar_url} name={(c as any).profiles?.name} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-foreground">{(c as any).profiles?.name}</p>
              <p className="text-xs text-muted-foreground break-words">{c.content}</p>
            </div>
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <p className="text-xs text-muted-foreground/60 text-center py-2">Nenhum comentário ainda</p>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <Input
          placeholder="Comentar..."
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddComment()}
          className="h-8 text-xs"
        />
        <button onClick={handleAddComment} className="text-primary hover:text-primary/80 transition">
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
