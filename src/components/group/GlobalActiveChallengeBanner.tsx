import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Users, Clock, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { differenceInDays, differenceInHours } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useChallengeDetail, Challenge } from '@/hooks/useChallenges';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Group } from '@/hooks/useGroups';
import { getErrorMessage } from '@/lib/utils';

interface Props {
  groups: Group[];
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

export default function GlobalActiveChallengeBanner({ groups }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const memberGroupIds = groups.filter(g => g.isMember).map(g => g.id);

  const { data: activeChallenges = [] } = useQuery({
    queryKey: ['global-active-challenges', memberGroupIds],
    queryFn: async () => {
      if (memberGroupIds.length === 0) return [];
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .in('group_id', memberGroupIds)
        .eq('status', 'active');
      if (error) throw error;
      return data as Challenge[];
    },
    enabled: memberGroupIds.length > 0,
  });

  // Escolhe o desafio mais urgente entre todos os grupos (o que termina primeiro)
  const featured = [...activeChallenges].sort((a, b) => {
    if (!a.ends_at && !b.ends_at) return 0;
    if (!a.ends_at) return 1;
    if (!b.ends_at) return -1;
    return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
  })[0];

  const { challenge, ranking, participants, isParticipant, joinChallenge } = useChallengeDetail(featured?.id ?? '');

  if (!featured || !challenge) return null;

  const groupName = groups.find(g => g.id === challenge.group_id)?.name;
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
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  const openChallenge = () => {
    navigate(`/group/${challenge.group_id}?challenge=${challenge.id}`);
  };

  return (
    <Card className="mb-6 border-2 border-orange-400/60 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/10">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <span className="text-xs font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
            Desafio Ativo
          </span>
          {groupName && (
            <span className="text-xs text-muted-foreground ml-auto truncate max-w-[45%]">
              {groupName}
            </span>
          )}
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
            <Button size="sm" className="flex-1" onClick={openChallenge}>
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
            onClick={openChallenge}
            className="text-xs text-muted-foreground mt-2 underline underline-offset-2 block"
          >
            +{extraCount} outro{extraCount > 1 ? 's' : ''} desafio{extraCount > 1 ? 's' : ''} ativo{extraCount > 1 ? 's' : ''}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
