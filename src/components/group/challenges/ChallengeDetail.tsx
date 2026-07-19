import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Trophy, Users, Clock, Target, Crown, UserPlus, Info, Plus, Pencil } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useChallengeDetail } from '@/hooks/useChallenges';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import WinnerOverlay from './WinnerOverlay';
import InviteMembersDialog from './InviteMembersDialog';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  challengeId: string;
  onBack: () => void;
  isAdmin: boolean;
  onFinish: (id: string) => void;
}

const METRIC_LABELS = {
  study_minutes: 'min',
  exercises_solved: 'exercícios',
  pages_read: 'páginas',
};

const MODE_LABELS = {
  first_to_goal: 'Primeiro a atingir meta',
  deadline: 'Por prazo',
  teams: 'Por equipes',
};

// Rótulo do campo a preencher ao registrar progresso, por métrica.
const PROGRESS_INPUT_LABELS = {
  study_minutes: 'Minutos estudados',
  exercises_solved: 'Exercícios resolvidos',
  pages_read: 'Páginas lidas',
};

const STATUS_COLORS = {
  draft: 'secondary',
  active: 'default',
  finished: 'outline',
  cancelled: 'destructive',
} as const;

type InfoField = 'mode' | 'metric' | 'deadline';

export default function ChallengeDetail({ challengeId, onBack, isAdmin, onFinish }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { challenge, ranking, participants, teams, isParticipant, joinChallenge } = useChallengeDetail(challengeId);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [showWinner, setShowWinner] = useState(false);
  const [winnerName, setWinnerName] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [infoField, setInfoField] = useState<InfoField | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [savingProgress, setSavingProgress] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editGoal, setEditGoal] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    const userIds = ranking.map(r => r.user_id).filter(Boolean);
    if (userIds.length === 0) return;
    supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          data.forEach(p => { map[p.id] = p.name; });
          setMemberNames(map);
        }
      });
  }, [ranking]);

  useEffect(() => {
    if (challenge?.status === 'finished' && challenge.winner_user_id) {
      setWinnerName(memberNames[challenge.winner_user_id] || 'Vencedor');
      setShowWinner(true);
    }
  }, [challenge?.status, memberNames]);

  if (!challenge) return null;

  const maxProgress = Math.max(...ranking.map(r => r.progress), challenge.goal_value ?? 1, 1);
  const unit = METRIC_LABELS[challenge.metric];

  // Explicações contextuais mostradas ao tocar em cada card de informação.
  const getInfoContent = (field: InfoField): { title: string; description: string } => {
    switch (field) {
      case 'mode': {
        const descByMode = {
          first_to_goal: `Vence quem for o primeiro a atingir a meta${
            challenge.goal_value ? ` de ${challenge.goal_value} ${unit}` : ''
          }.`,
          deadline: `O desafio vale até o prazo final. Quando o tempo acabar, vence quem tiver o maior total de ${unit}.`,
          teams: `Os participantes competem em equipes. Vence a equipe com o maior total de ${unit} somando seus membros.`,
        };
        return { title: `Modo: ${MODE_LABELS[challenge.mode]}`, description: descByMode[challenge.mode] };
      }
      case 'metric': {
        const countByMetric = {
          study_minutes: 'os minutos de estudo',
          exercises_solved: 'os exercícios resolvidos',
          pages_read: 'as páginas lidas',
        };
        const goalText = challenge.goal_value
          ? ` A meta é atingir ${challenge.goal_value} ${unit}.`
          : ' Não há meta fixa: vence quem tiver o maior total.';
        return {
          title: `Métrica: ${unit}`,
          description: `O ranking conta ${countByMetric[challenge.metric]}.${goalText} Registre pelo cronômetro ou aqui no botão "Registrar progresso".`,
        };
      }
      case 'deadline':
        return {
          title: 'Prazo',
          description:
            'Data e hora limite do desafio. O progresso registrado depois do prazo não conta para o ranking.',
        };
    }
  };

  const handleRegisterProgress = async () => {
    if (!user) return;
    const value = parseInt(progressValue, 10);
    if (Number.isNaN(value) || value <= 0) {
      toast.error('Informe um número maior que zero');
      return;
    }

    setSavingProgress(true);
    try {
      const now = new Date();
      const startedAt =
        challenge.metric === 'study_minutes'
          ? new Date(now.getTime() - value * 60000).toISOString()
          : now.toISOString();

      const { error } = await supabase.from('study_sessions').insert({
        user_id: user.id,
        group_id: challenge.group_id,
        subject_id: null,
        duration_minutes: challenge.metric === 'study_minutes' ? value : 0,
        pages: challenge.metric === 'pages_read' ? value : null,
        exercises: challenge.metric === 'exercises_solved' ? value : null,
        started_at: startedAt,
        completed_at: now.toISOString(),
      });

      if (error) throw error;

      toast.success(`+${value} ${unit} registrado no desafio!`);
      setProgressValue('');
      setProgressOpen(false);
      queryClient.invalidateQueries({ queryKey: ['challenge-ranking', challengeId] });
    } catch (err) {
      console.error('Erro ao registrar progresso do desafio:', err);
      toast.error('Não foi possível registrar o progresso');
    } finally {
      setSavingProgress(false);
    }
  };

  const openEdit = () => {
    setEditGoal(challenge.goal_value ? String(challenge.goal_value) : '');
    // datetime-local espera "yyyy-MM-ddTHH:mm" no fuso local
    setEditDeadline(challenge.ends_at ? format(new Date(challenge.ends_at), "yyyy-MM-dd'T'HH:mm") : '');
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    const goal = parseInt(editGoal, 10);
    if (editGoal !== '' && (Number.isNaN(goal) || goal <= 0)) {
      toast.error('A meta deve ser um número maior que zero (ou vazia para disputa livre)');
      return;
    }

    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('challenges')
        .update({
          goal_value: editGoal === '' ? null : goal,
          ends_at: editDeadline ? new Date(editDeadline).toISOString() : null,
        })
        .eq('id', challengeId);

      if (error) throw error;

      toast.success('Desafio atualizado!');
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenge-ranking', challengeId] });
    } catch (err) {
      console.error('Erro ao editar desafio:', err);
      toast.error('Não foi possível salvar. Apenas o admin do grupo pode editar o desafio.');
    } finally {
      setSavingEdit(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <span className="text-gray-400 font-bold text-sm">2º</span>;
    if (rank === 3) return <span className="text-amber-600 font-bold text-sm">3º</span>;
    return <span className="text-muted-foreground text-sm">{rank}º</span>;
  };

  // Card de informação clicável: abre o diálogo explicativo do campo.
  const InfoCard = ({
    field,
    icon,
    label,
    value,
  }: {
    field: InfoField;
    icon: React.ReactNode;
    label: string;
    value: string;
  }) => (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => setInfoField(field)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setInfoField(field);
        }
      }}
      className="p-3 cursor-pointer transition-colors hover:bg-accent focus:bg-accent focus:outline-none relative"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        {icon} {label}
        <Info className="h-3 w-3 ml-auto opacity-50" />
      </div>
      <p className="font-medium text-sm">{value}</p>
    </Card>
  );

  const infoContent = infoField ? getInfoContent(infoField) : null;

  return (
    <div className="space-y-4">
      <WinnerOverlay
        open={showWinner}
        onClose={() => setShowWinner(false)}
        winnerName={winnerName}
        challengeTitle={challenge.title}
      />

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-bold flex-1">{challenge.title}</h2>
        <Badge variant={STATUS_COLORS[challenge.status]}>
          {challenge.status === 'active' ? 'Ativo' :
           challenge.status === 'finished' ? 'Encerrado' :
           challenge.status === 'draft' ? 'Rascunho' : 'Cancelado'}
        </Badge>
      </div>

      {challenge.description && (
        <p className="text-muted-foreground text-sm">{challenge.description}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <InfoCard
          field="mode"
          icon={<Target className="h-4 w-4" />}
          label="Modo"
          value={MODE_LABELS[challenge.mode]}
        />
        <InfoCard
          field="metric"
          icon={<Trophy className="h-4 w-4" />}
          label="Métrica"
          value={challenge.goal_value ? `${challenge.goal_value} ${unit}` : unit}
        />
        {challenge.ends_at && (
          <InfoCard
            field="deadline"
            icon={<Clock className="h-4 w-4" />}
            label="Prazo"
            value={format(new Date(challenge.ends_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          />
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {challenge.status === 'active' && !isParticipant && (
          <Button onClick={() => joinChallenge.mutate(undefined)} disabled={joinChallenge.isPending}>
            <Users className="h-4 w-4 mr-2" />
            {joinChallenge.isPending ? 'Entrando...' : 'Participar'}
          </Button>
        )}
        {challenge.status === 'active' && isParticipant && (
          <Button onClick={() => setProgressOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Registrar progresso
          </Button>
        )}
        {isAdmin && challenge.status === 'active' && (
          <Button variant="outline" onClick={openEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        {isAdmin && challenge.status === 'active' && (
          <Button variant="outline" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Convidar membros
          </Button>
        )}
        {isAdmin && challenge.status === 'active' && (
          <Button variant="outline" onClick={() => onFinish(challengeId)}>
            Encerrar desafio
          </Button>
        )}
      </div>

      <InviteMembersDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        groupId={challenge.group_id}
        challengeId={challengeId}
        challengeTitle={challenge.title}
        excludeUserIds={participants.map(p => p.user_id)}
      />

      {/* Diálogo explicativo dos cards de informação */}
      <Dialog open={infoField !== null} onOpenChange={(open) => !open && setInfoField(null)}>
        <DialogContent>
          {infoContent && (
            <DialogHeader>
              <DialogTitle>{infoContent.title}</DialogTitle>
              <DialogDescription className="pt-2 text-left">
                {infoContent.description}
              </DialogDescription>
            </DialogHeader>
          )}
        </DialogContent>
      </Dialog>

      {/* Diálogo de edição do desafio (admin) */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar desafio</DialogTitle>
            <DialogDescription className="text-left">
              Ajuste a meta e o prazo. As mudanças valem para todos os participantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-goal">Meta — quantidade de {unit} a atingir</Label>
              <Input
                id="edit-goal"
                type="number"
                min="1"
                inputMode="numeric"
                placeholder="Vazio = disputa livre (vence quem tiver mais)"
                value={editGoal}
                onChange={(e) => setEditGoal(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Prazo</Label>
              <Input
                id="edit-deadline"
                type="datetime-local"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de registro de progresso do desafio */}
      <Dialog open={progressOpen} onOpenChange={(open) => { setProgressOpen(open); if (!open) setProgressValue(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar progresso</DialogTitle>
            <DialogDescription className="text-left">
              Informe quanto você avançou. O valor é somado ao seu total no ranking deste desafio.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="challenge-progress">{PROGRESS_INPUT_LABELS[challenge.metric]}</Label>
            <Input
              id="challenge-progress"
              type="number"
              min="1"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={progressValue}
              onChange={(e) => setProgressValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRegisterProgress(); }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setProgressOpen(false); setProgressValue(''); }}>
              Cancelar
            </Button>
            <Button onClick={handleRegisterProgress} disabled={savingProgress}>
              {savingProgress ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" /> Ranking
            <span className="text-muted-foreground font-normal text-sm">({participants.length} participantes)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ranking.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhum progresso registrado ainda.
            </p>
          ) : (
            ranking.map(row => {
              const name = memberNames[row.user_id] || 'Usuário';
              const pct = Math.min((row.progress / maxProgress) * 100, 100);
              const isMe = row.user_id === user?.id;

              return (
                <div key={row.user_id} className={`space-y-1 p-2 rounded-lg ${isMe ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 flex justify-center">{getRankIcon(Number(row.rank))}</div>
                    <span className="flex-1 font-medium text-sm">
                      {name}{isMe && <span className="text-primary ml-1 text-xs">(você)</span>}
                    </span>
                    <span className="text-sm font-bold">{row.progress} {unit}</span>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <Progress value={pct} className="h-2 flex-1" />
                    {challenge.goal_value && (
                      <span className="text-xs text-muted-foreground w-10 text-right">
                        {Math.round(pct)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
