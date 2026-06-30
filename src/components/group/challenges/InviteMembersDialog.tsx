import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  groupId: string;
  challengeId: string;
  challengeTitle: string;
  excludeUserIds: string[];
}

interface MemberOption {
  id: string;
  name: string;
}

export default function InviteMembersDialog({
  open,
  onClose,
  groupId,
  challengeId,
  challengeTitle,
  excludeUserIds,
}: Props) {
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !groupId) return;
    setLoading(true);
    supabase
      .from('group_members')
      .select('user_id, profiles(id, name)')
      .eq('group_id', groupId)
      .then(({ data, error }) => {
        if (!error && data) {
          const options = data
            .map((m: any) => ({ id: m.user_id, name: m.profiles?.name || 'Usuário' }))
            .filter((m) => !excludeUserIds.includes(m.id));
          setMembers(options);
        }
        setLoading(false);
      });
  }, [open, groupId, excludeUserIds]);

  const toggle = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSend = async () => {
    if (selected.size === 0) return;
    setSending(true);
    try {
      const notifications = Array.from(selected).map((userId) => ({
        user_id: userId,
        type: 'challenge_invitation',
        title: 'Convite para desafio',
        message: `Você foi convidado para participar do desafio "${challengeTitle}"`,
        link: `/groups/${groupId}?tab=challenges&challenge=${challengeId}`,
      }));
      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) throw error;
      toast({ title: 'Convites enviados!', description: `${selected.size} membro(s) convidado(s).` });
      setSelected(new Set());
      onClose();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Convidar membros
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-muted-foreground text-sm text-center py-6">Carregando...</p>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6">
            Todos os membros já participam deste desafio.
          </p>
        ) : (
          <div className="space-y-2">
            {members.map((m) => (
              <label
                key={m.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(m.id)}
                  onCheckedChange={() => toggle(m.id)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {m.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{m.name}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSend} disabled={sending || selected.size === 0}>
            {sending ? 'Enviando...' : `Convidar (${selected.size})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
