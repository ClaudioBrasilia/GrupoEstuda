import React from 'react';
import { Flame, Users, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, differenceInHours } from 'date-fns';
import { useChallenges, useChallengeDetail } from '@/hooks/useChallenges';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Props {
  groupId: string;
  onOpenChallenge: (challengeId: string) => void;
}

const METRIC_UNITS: Record<string, string> = {
  study_minutes: 'min',
  exercises_solved: 'exercícios',
  pages_read: 'páginas',
};

function formatDeadline(endsAt: string | null): string | null {
  if (!endsAt) return null;
  const end = new Date(endsAt);
  const now = new Date();
  const days = differenceInDays(end, now);
  if (days >= 1) return `Termina em ${days} dia${days > 1 ? 's' : ''}`;
  const hours = differenceInHours(end, now);
  if (hours >= 1) return `Termina em ${hours} hora${hours > 1 ? 's' : ''}`;
  if (hours <= 0) return 'Encerrando agora';
  return 'Termina em menos de 1 hora';
}

export default function ActiveChallengeHighlight({ groupId, onOpenChallenge }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { challenges } = useChallenges(groupId);

  const activeChallenges = challenges.filter(c => c.status === 'active');

  // Escolhe o desafio mais relevante: o que termina primeiro (sem prazo vai por último)
  const featured = [...activeChallenges].sort((a, b) => {
    if (!a.ends_at && !b.ends_at) return 0;
    if (!a.ends_at) return 1;
    if (!b.ends_at) return -1;
    return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
  })[0];

  const { challenge, ranking, participants, isParticipant, joinChallenge } = useChallengeDetail(featured?.id ?? '');

  if (!featured || !challenge) return null;

  const unit = METRIC_UNITS[challenge.metric];
  const deadlineText = formatDeadline(challenge.ends_at);
  const myRow = ranking.find(r => r.user_id === user?.id);
  const progressValue = myRow?.progress ?? 0;
  const goal = challenge.goal_value;
  const pct = goal ? Math.min((progressValue / goal) * 100, 100) : undefined;
  const extraCount = activeChallenges.length - 1;

  const handleJoin = async () => {
    try {
      await joinChallenge.mutateAsync(undefined);
      toast({ title: 'Você entrou no desafio!', description: 'Boa sorte 🔥' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card className="mb-4 border-2 border-orange-400/60 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            Desafio Ativo
          </span>
        </div>

        <h3 className="font-bold text-base mb-2">{challenge.title}</h3>

        {isParticipant ? (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Seu progresso</span>
              <span className="font-semibold">
                {progressValue}{goal ? ` / ${goal}` : ''} {unit}
              </span>
            </div>
            {goal && <Progress value={pct} className="h-2" />}
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {participants.length} participantes
            </span>
            {deadlineText && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {deadlineText}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {isParticipant ? (
            <Button size="sm" className="flex-1" onClick={() => onOpenChallenge(featured.id)}>
              Ver desafio <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleJoin}
              disabled={joinChallenge.isPending}
            >
              {joinChallenge.isPending ? 'Entrando...' : 'Participar'}
            </Button>
          )}
        </div>

        {extraCount > 0 && (
          <button
            onClick={() => onOpenChallenge(featured.id)}
            className="text-xs text-muted-foreground mt-2 underline underline-offset-2 block"
          >
            +{extraCount} outro{extraCount > 1 ? 's' : ''} desafio{extraCount > 1 ? 's' : ''} ativo{extraCount > 1 ? 's' : ''}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
