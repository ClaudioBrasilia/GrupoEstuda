import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Trophy, Users, Clock, Target, Crown, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useChallengeDetail } from '@/hooks/useChallenges';
import { useAuth } from '@/context/AuthContext';
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

const STATUS_COLORS = {
  draft: 'secondary',
  active: 'default',
  finished: 'outline',
  cancelled: 'destructive',
} as const;

export default function ChallengeDetail({ challengeId, onBack, isAdmin, onFinish }: Props) {
  const { user } = useAuth();
  const { challenge, ranking, participants, teams, isParticipant, joinChallenge } = useChallengeDetail(challengeId);
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});
  const [showWinner, setShowWinner] = useState(false);
  const [winnerName, setWinnerName] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

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

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <span className="text-gray-400 font-bold text-sm">2º</span>;
    if (rank === 3) return <span className="text-amber-600 font-bold text-sm">3º</span>;
    return <span className="text-muted-foreground text-sm">{rank}º</span>;
  };

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
        <Card className="p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="h-4 w-4" /> Modo
          </div>
          <p className="font-medium text-sm">{MODE_LABELS[challenge.mode]}</p>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Trophy className="h-4 w-4" /> Métrica
          </div>
          <p className="font-medium text-sm">{METRIC_LABELS[challenge.metric]}</p>
        </Card>
        {challenge.goal_value && (
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Target className="h-4 w-4" /> Meta
            </div>
            <p className="font-medium text-sm">{challenge.goal_value} {unit}</p>
          </Card>
        )}
        {challenge.ends_at && (
          <Card className="p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Clock className="h-4 w-4" /> Prazo
            </div>
            <p className="font-medium text-sm">
              {format(new Date(challenge.ends_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
            </p>
          </Card>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {challenge.status === 'active' && !isParticipant && (
          <Button onClick={() => joinChallenge.mutate(undefined)} disabled={joinChallenge.isPending}>
            <Users className="h-4 w-4 mr-2" />
            {joinChallenge.isPending ? 'Entrando...' : 'Participar'}
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
