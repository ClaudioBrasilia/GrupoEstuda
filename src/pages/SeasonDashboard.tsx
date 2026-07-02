import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Medal, Calendar } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import {
  useCurrentSeason,
  useSeason,
  usePeriodLeaderboard,
  useSeasonBadgesForSeason,
  usePastSeasons,
} from '@/hooks/useSeasons';

const RANK_STYLES: Record<number, string> = {
  1: 'bg-yellow-500',
  2: 'bg-gray-400',
  3: 'bg-amber-700',
};

export default function SeasonDashboard() {
  const { seasonId } = useParams<{ seasonId?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: currentSeason, isLoading: loadingCurrent } = useCurrentSeason();
  const resolvedSeasonId = seasonId || currentSeason?.id;

  const { data: season, isLoading: loadingSeason } = useSeason(resolvedSeasonId);
  const { data: ranking = [], isLoading: loadingRanking } = usePeriodLeaderboard(
    season?.starts_at ?? null,
    season?.ends_at ?? null
  );
  const { data: badges = [] } = useSeasonBadgesForSeason(resolvedSeasonId);
  const { data: pastSeasons = [] } = usePastSeasons();
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

  const isLoading = loadingCurrent || loadingSeason || loadingRanking;
  const podium = ranking.filter(r => r.rank <= 3).sort((a, b) => a.rank - b.rank);
  const rest = ranking.filter(r => r.rank > 3);

  if (isLoading) {
    return (
      <PageLayout>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      </PageLayout>
    );
  }

  if (!season) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Nenhuma temporada ativa no momento.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/leaderboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">{season.title}</h1>
          <p className="text-xs text-muted-foreground">
            {format(new Date(season.starts_at), "dd/MM", { locale: ptBR })} até{' '}
            {format(new Date(season.ends_at), "dd/MM/yyyy", { locale: ptBR })}
            {season.status === 'finished' && ' · Encerrada'}
          </p>
        </div>
      </div>

      {/* Pódio */}
      {podium.length > 0 && (
        <div className="flex items-end justify-center gap-3 mb-6 px-2">
          {[2, 1, 3].map(rank => {
            const row = podium.find(p => p.rank === rank);
            if (!row) return null;
            const isMe = row.user_id === user?.id;
            const height = rank === 1 ? 'h-28' : rank === 2 ? 'h-20' : 'h-16';
            return (
              <div key={rank} className="flex flex-col items-center gap-1 flex-1 max-w-[110px]">
                <Avatar className={rank === 1 ? 'h-14 w-14' : 'h-11 w-11'}>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {(names[row.user_id] || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-center truncate w-full">
                  {names[row.user_id] || 'Usuário'}{isMe && ' (você)'}
                </span>
                <span className="text-[10px] text-muted-foreground">{row.score} XP</span>
                <div className={`w-full ${height} ${RANK_STYLES[rank]} rounded-t-lg flex items-start justify-center pt-1`}>
                  <span className="text-white font-bold text-lg">{rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Salão da fama (badges concedidos) */}
      {badges.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-500" /> Salão da Fama
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {badges.map(b => (
              <div key={b.id} className="flex items-center gap-2 bg-muted/50 rounded-full px-3 py-1.5">
                {b.kind === 'champion' ? (
                  <Crown className="h-4 w-4 text-yellow-500" />
                ) : (
                  <Medal className="h-4 w-4 text-blue-500" />
                )}
                <span className="text-xs font-medium">{names[b.user_id] || 'Usuário'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Ranking completo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ranking completo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {ranking.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhum progresso registrado ainda.
            </p>
          ) : (
            ranking.map(row => {
              const isMe = row.user_id === user?.id;
              return (
                <div
                  key={row.user_id}
                  className={`flex items-center justify-between p-2 rounded-lg ${isMe ? 'bg-primary/5 ring-1 ring-primary/20' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      RANK_STYLES[row.rank] || 'bg-gray-200 text-gray-700'
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
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Temporadas anteriores */}
      {pastSeasons.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Temporadas anteriores</h2>
          <div className="space-y-2">
            {pastSeasons.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(`/season/${s.id}`)}
                className="w-full text-left"
              >
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3 flex items-center justify-between">
                    <span className="text-sm font-medium">{s.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(s.ends_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
