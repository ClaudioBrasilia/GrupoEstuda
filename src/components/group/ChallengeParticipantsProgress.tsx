import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useChallenges, useChallengeDetail } from '@/hooks/useChallenges';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  groupId: string;
}

const METRIC_UNITS: Record<string, string> = {
  study_minutes: 'min',
  exercises_solved: 'exercícios',
  pages_read: 'páginas',
};

export default function ChallengeParticipantsProgress({ groupId }: Props) {
  const { user } = useAuth();
  const { challenges } = useChallenges(groupId);

  const activeChallenges = challenges.filter(c => c.status === 'active');

  // Mesmo critério do card de destaque: desafio que termina primeiro
  const featured = [...activeChallenges].sort((a, b) => {
    if (!a.ends_at && !b.ends_at) return 0;
    if (!a.ends_at) return 1;
    if (!b.ends_at) return -1;
    return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime();
  })[0];

  const { challenge, ranking, participants } = useChallengeDetail(featured?.id ?? '');
  const [memberNames, setMemberNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const userIds = participants.map(p => p.user_id).filter(Boolean);
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
  }, [participants]);

  if (!featured || !challenge || participants.length === 0) return null;

  const unit = METRIC_UNITS[challenge.metric];
  const goal = challenge.goal_value;

  // Combina todos os participantes com seu progresso individual (0 se ainda não registrou nada)
  const rows = participants
    .map(p => {
      const rankingRow = ranking.find(r => r.user_id === p.user_id);
      return {
        user_id: p.user_id,
        progress: rankingRow?.progress ?? 0,
      };
    })
    .sort((a, b) => b.progress - a.progress);

  const maxProgress = Math.max(...rows.map(r => r.progress), goal ?? 1, 1);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">📊 Progresso do Desafio</h3>
        <span className="text-xs text-muted-foreground truncate max-w-[50%]">{challenge.title}</span>
      </div>
      <div className="space-y-3">
        {rows.map(row => {
          const name = memberNames[row.user_id] || 'Usuário';
          const isMe = row.user_id === user?.id;
          const pct = goal
            ? Math.min((row.progress / goal) * 100, 100)
            : Math.min((row.progress / maxProgress) * 100, 100);

          return (
            <div
              key={row.user_id}
              className={`space-y-1 ${isMe ? 'bg-primary/5 rounded-lg p-2 ring-1 ring-primary/20' : ''}`}
            >
              <div className="flex items-center justify-between text-sm gap-2">
                <span className="font-medium truncate">
                  {name}
                  {isMe && <span className="text-primary ml-1 text-xs">(você)</span>}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {row.progress}{goal ? ` / ${goal}` : ''} {unit}
                </span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
