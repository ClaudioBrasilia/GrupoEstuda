import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useUserLeague, useLeagueLeaderboard, LEAGUE_LABELS, LEAGUE_ICONS, LEAGUE_COLORS, LEAGUE_ORDER } from '@/hooks/useLeagues';

interface Props {
  userId?: string;
}

export default function LeagueCard({ userId }: Props) {
  const { data: tier, isLoading } = useUserLeague(userId);
  const { data: ranking = [] } = useLeagueLeaderboard(tier);

  if (isLoading || !tier) return null;

  const myRow = ranking.find(r => r.user_id === userId);
  const tierIndex = LEAGUE_ORDER.indexOf(tier);
  const isTopTier = tierIndex === LEAGUE_ORDER.length - 1;
  const promoteCutoff = Math.max(1, Math.ceil(ranking.length * 0.2));
  const demoteCutoff = Math.max(1, Math.ceil(ranking.length * 0.2));
  const inPromotionZone = myRow && myRow.rank <= promoteCutoff && !isTopTier;
  const inDemotionZone = myRow && ranking.length > 0 && myRow.rank > ranking.length - demoteCutoff && tierIndex > 0;

  return (
    <Card className={`border ${LEAGUE_COLORS[tier]}`}>
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{LEAGUE_ICONS[tier]}</span>
          <div>
            <p className="font-bold text-sm">Liga {LEAGUE_LABELS[tier]}</p>
            {myRow && (
              <p className="text-xs opacity-80">
                {myRow.rank}º lugar esta semana · {myRow.score} XP
              </p>
            )}
          </div>
        </div>
        {inPromotionZone && (
          <span className="text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-1">
            ⬆ Zona de subida
          </span>
        )}
        {inDemotionZone && (
          <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full px-2 py-1">
            ⬇ Zona de queda
          </span>
        )}
      </CardContent>
    </Card>
  );
}
