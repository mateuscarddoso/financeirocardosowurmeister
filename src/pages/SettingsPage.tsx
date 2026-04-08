import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMembers } from '@/hooks/useProfile';
import { useAreas, useStatuses } from '@/hooks/useAreas';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { AvatarCircle } from '@/components/shared/AvatarCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { data: members } = useMembers();
  const { data: areas } = useAreas();
  const { data: statuses } = useStatuses();
  const qc = useQueryClient();

  // Functional area management
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaColor, setNewAreaColor] = useState('#0034B8');

  // Status management
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('#6B7280');

  const updateMemberRole = async (userId: string, role: string) => {
    await supabase.from('profiles').update({ role: role as any }).eq('id', userId);
    qc.invalidateQueries({ queryKey: ['members'] });
    toast({ title: 'Role atualizada' });
  };

  const updateMemberArea = async (userId: string, areaId: string) => {
    await supabase.from('profiles').update({ area_id: areaId }).eq('id', userId);
    qc.invalidateQueries({ queryKey: ['members'] });
    toast({ title: 'Área funcional atualizada' });
  };

  const removeMember = async (userId: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('profiles').delete().eq('id', userId);
    qc.invalidateQueries({ queryKey: ['members'] });
  };

  const createArea = async () => {
    if (!newAreaName.trim()) return;
    await supabase.from('areas').insert({ name: newAreaName, color: newAreaColor });
    setNewAreaName('');
    qc.invalidateQueries({ queryKey: ['areas'] });
  };

  const deleteArea = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('areas').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['areas'] });
  };

  const createStatus = async () => {
    if (!newStatusLabel.trim()) return;
    const maxPos = Math.max(0, ...(statuses || []).map(s => s.position));
    await supabase.from('statuses').insert({ label: newStatusLabel, color: newStatusColor, position: maxPos + 1 });
    setNewStatusLabel('');
    qc.invalidateQueries({ queryKey: ['statuses'] });
  };

  const deleteStatus = async (id: string) => {
    if (!confirm('Tem certeza?')) return;
    await supabase.from('statuses').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['statuses'] });
  };

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">Configurações</h2>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="areas">Áreas funcionais</TabsTrigger>
          <TabsTrigger value="statuses">Status</TabsTrigger>
        </TabsList>

        {/* MEMBERS */}
        <TabsContent value="members" className="mt-4">
          <div className="rounded-card border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Membro</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">E-mail</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Área funcional</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">Role</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {members?.map(m => (
                  <tr key={m.id} className="border-t border-border">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <AvatarCircle src={m.avatar_url} name={m.name} size="sm" />
                      <div>
                        <span className="font-medium text-foreground">{m.name || 'Sem nome'}</span>
                        <p className="text-[11px] text-muted-foreground">
                          Área pessoal: {m.name ? `Área de ${m.name.split(' ')[0]}` : 'Usuário'}
                        </p>
                      </div>
                      {m.role === 'pending' && (
                        <Badge variant="outline" className="text-warning border-warning text-[10px]">Pendente</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                    <td className="px-4 py-3">
                      <Select value={m.area_id || ''} onValueChange={v => updateMemberArea(m.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Área funcional" /></SelectTrigger>
                        <SelectContent>
                          {areas?.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Select value={m.role || 'pending'} onValueChange={v => updateMemberRole(m.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="leader">Líder</SelectItem>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => removeMember(m.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* AREAS */}
        <TabsContent value="areas" className="mt-4 space-y-3">
          {areas?.map(a => (
            <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
              <input type="color" value={a.color} className="h-6 w-6 rounded border-0 cursor-pointer"
                onChange={async e => {
                  await supabase.from('areas').update({ color: e.target.value }).eq('id', a.id);
                  qc.invalidateQueries({ queryKey: ['areas'] });
                }}
              />
              <span className="flex-1 text-sm font-medium text-foreground">{a.name}</span>
              <button onClick={() => deleteArea(a.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="color" value={newAreaColor} onChange={e => setNewAreaColor(e.target.value)} className="h-8 w-8 rounded" />
            <Input placeholder="Nome da área funcional" value={newAreaName} onChange={e => setNewAreaName(e.target.value)} className="flex-1 h-8 text-sm" />
            <Button size="sm" onClick={createArea}><Plus className="h-4 w-4" /></Button>
          </div>
        </TabsContent>

        {/* STATUSES */}
        <TabsContent value="statuses" className="mt-4 space-y-3">
          {statuses?.map(s => (
            <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2">
              <input type="color" value={s.color} className="h-6 w-6 rounded border-0 cursor-pointer"
                onChange={async e => {
                  await supabase.from('statuses').update({ color: e.target.value }).eq('id', s.id);
                  qc.invalidateQueries({ queryKey: ['statuses'] });
                }}
              />
              <span className="flex-1 text-sm font-medium text-foreground">{s.label}</span>
              <span className="text-xs text-muted-foreground">pos: {s.position}</span>
              <button onClick={() => deleteStatus(s.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input type="color" value={newStatusColor} onChange={e => setNewStatusColor(e.target.value)} className="h-8 w-8 rounded" />
            <Input placeholder="Nome do status" value={newStatusLabel} onChange={e => setNewStatusLabel(e.target.value)} className="flex-1 h-8 text-sm" />
            <Button size="sm" onClick={createStatus}><Plus className="h-4 w-4" /></Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
