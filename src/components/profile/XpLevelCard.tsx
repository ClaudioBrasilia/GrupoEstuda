import React from 'react';
import { Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useUserXp, useUserStreak } from '@/hooks/useUserProgress';

interface Props {
  userId?: string;
}

export default function XpLevelCard({ userId }: Props) {
  const { totalXp, level, currentLevelXp, nextLevelXp, progress, isLoading } = useUserXp(userId);
  const { data: streak } = useUserStreak(userId);

  if (isLoading) return null;

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <p className="font-bold text-sm">Nível {level}</p>
              <p className="text-xs text-muted-foreground">
                {totalXp.toLocaleString('pt-BR')} / {nextLevelXp.toLocaleString('pt-BR')} XP
              </p>
            </div>
          </div>
          {streak && streak.current_streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 rounded-full px-3 py-1">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-bold text-orange-600">{streak.current_streak} dias</span>
            </div>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-right">
          Faltam {Math.max(0, nextLevelXp - totalXp).toLocaleString('pt-BR')} XP para o nível {level + 1}
        </p>
      </CardContent>
    </Card>
  );
}
