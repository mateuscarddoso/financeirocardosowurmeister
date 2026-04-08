import { useState } from 'react';
import { Plus, Share2, Trash2, Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useNotes';
import { useProfile } from '@/hooks/useProfile';
import { useAreas } from '@/hooks/useAreas';
import { AreaTag } from '@/components/shared/AreaTag';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

interface NotesPageProps {
  areaId: string | null;
}

export default function NotesPage({ areaId }: NotesPageProps) {
  const { data: profile } = useProfile();
  const { data: notes, isLoading } = useNotes(areaId);
  const { data: areas } = useAreas();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [noteAreaId, setNoteAreaId] = useState('');
  const [shared, setShared] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const isLeader = profile?.role === 'leader';

  const openEditor = (note?: any) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content || '');
      setNoteAreaId(note.area_id || '');
      setShared(note.shared || false);
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setNoteAreaId('');
      setShared(false);
    }
    setEditorOpen(true);
  };

  const handleSave = () => {
    if (!title.trim() || !profile) return;
    if (editingNote) {
      updateNote.mutate({ id: editingNote.id, title, content, area_id: noteAreaId || null, shared });
    } else {
      createNote.mutate({ title, content, area_id: noteAreaId || undefined, author_id: profile.id, shared });
    }
    setEditorOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta nota?')) {
      deleteNote.mutate(id);
    }
  };

  // Web Speech API - real-time transcription
  const startRealTimeTranscription = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Transcrição em tempo real não suportada neste navegador', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setContent(prev => prev + ' ' + transcript);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
    setIsRecording(true);

    // Store reference to stop later
    (window as any).__recognition = recognition;
  };

  const stopRealTimeTranscription = () => {
    (window as any).__recognition?.stop();
    setIsRecording(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-foreground">Notas</h2>
        <Button size="sm" onClick={() => openEditor()}>
          <Plus className="h-4 w-4 mr-1" />Nova nota
        </Button>
      </div>

      {!notes?.length ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className="text-muted-foreground text-sm">Nenhuma nota ainda. Crie a primeira →</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {notes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => openEditor(note)}
                className="rounded-card border border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">{note.title}</h3>
                  {note.shared && (
                    <span className="flex items-center gap-1 text-[10px] text-primary">
                      <Share2 className="h-3 w-3" />Compartilhada
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{note.content}</p>
                <div className="flex items-center gap-2">
                  {(note as any).areas && <AreaTag name={(note as any).areas.name} color={(note as any).areas.color} />}
                  <span className="text-[10px] text-muted-foreground ml-auto">{note.date}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Editor Modal */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? 'Editar nota' : 'Nova nota'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />

            <Select value={noteAreaId} onValueChange={setNoteAreaId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Selecionar área" />
              </SelectTrigger>
              <SelectContent>
                {areas?.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Textarea
                placeholder="Conteúdo da nota..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-[120px] resize-none"
              />
              <button
                onClick={isRecording ? stopRealTimeTranscription : startRealTimeTranscription}
                className={`absolute bottom-2 right-2 rounded-full p-2 transition ${isRecording ? 'bg-destructive text-destructive-foreground animate-pulse' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={shared} onCheckedChange={setShared} />
              <span className="text-sm text-muted-foreground">Compartilhar com o time</span>
            </div>

            <div className="flex gap-2 justify-end">
              {editingNote && (
                <Button variant="destructive" size="sm" onClick={() => { handleDelete(editingNote.id); setEditorOpen(false); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" />Excluir
                </Button>
              )}
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
