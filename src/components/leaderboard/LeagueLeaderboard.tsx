import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  useUserLeague,
  useLeagueLeaderboard,
  LEAGUE_LABELS,
  LEAGUE_ICONS,
  LEAGUE_ORDER,
} from '@/hooks/useLeagues';

export default function LeagueLeaderboard() {
  const { user } = useAuth();
  const { data: tier, isLoading: loadingTier } = useUserLeague(user?.id);
  const { data: ranking = [], isLoading: loadingRanking } = useLeagueLeaderboard(tier);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = ranking.map(r => r.user_id);
    if (ids.length === 0) return;
    supabase
      .from('profiles')
      .select('id, name')
      .in('id', ids)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach(p => { map[p.id] = p.name; });
        setNames(map);
      });
  }, [ranking]);

  if (loadingTier || loadingRanking) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (!tier) return null;

  const promoteCutoff = Math.max(1, Math.ceil(ranking.length * 0.2));
  const demoteCutoff = Math.max(1, Math.ceil(ranking.length * 0.2));
  const tierIndex = LEAGUE_ORDER.indexOf(tier);

  return (
    <div className="space-y-3">
      <div className="text-center py-2">
        <span className="text-4xl">{LEAGUE_ICONS[tier]}</span>
        <h3 className="font-bold text-lg mt-1">Liga {LEAGUE_LABELS[tier]}</h3>
        <p className="text-xs text-muted-foreground">Top 20% sobe · Últimos 20% descem · Reinicia toda segunda-feira</p>
      </div>

      <div className="space-y-2">
        {ranking.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                A semana começou agora — ainda não há atividade registrada. Continue estudando para aparecer no ranking! 💪
              </p>
            </CardContent>
          </Card>
        )}
        {ranking.map(row => {
          const isPromotion = row.rank <= promoteCutoff && tierIndex < LEAGUE_ORDER.length - 1;
          const isDemotion = row.rank > ranking.length - demoteCutoff && tierIndex > 0;
          const isMe = row.user_id === user?.id;

          return (
            <Card key={row.user_id} className={isMe ? 'border-primary border-2' : ''}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    isPromotion ? 'bg-green-500' : isDemotion ? 'bg-red-500' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {row.rank}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {(names[row.user_id] || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {names[row.user_id] || 'Usuário'}
                    {isMe && <span className="text-primary ml-1 text-xs">(você)</span>}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{row.score} XP</span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
