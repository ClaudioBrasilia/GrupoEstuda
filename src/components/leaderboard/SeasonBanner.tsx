import React from 'react';
import { Crown, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCurrentSeason, usePeriodLeaderboard } from '@/hooks/useSeasons';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export default function SeasonBanner() {
  const { data: season, isLoading } = useCurrentSeason();
  const { data: ranking = [] } = usePeriodLeaderboard(
    season?.starts_at ?? null,
    season?.ends_at ?? null
  );
  const [leaderName, setLeaderName] = useState<string | null>(null);

  const leader = ranking.find(r => r.rank === 1);

  useEffect(() => {
    if (!leader?.user_id) {
      setLeaderName(null);
      return;
    }
    supabase
      .from('profiles')
      .select('name')
      .eq('id', leader.user_id)
      .maybeSingle()
      .then(({ data }) => setLeaderName(data?.name ?? null));
  }, [leader?.user_id]);

  if (isLoading || !season) return null;

  return (
    <Card className="mb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Calendar className="h-4 w-4" /> {season.title}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Até {format(new Date(season.ends_at), "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        {leaderName && (
          <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-full px-3 py-1.5">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400">{leaderName}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
