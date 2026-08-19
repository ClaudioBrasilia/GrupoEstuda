import React from 'react';
import { Award, Flame, Lock, Sparkles, Target, TrendingUp, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUserXp, useUserStreak } from '@/hooks/useUserProgress';
import { useAdvancedStats } from '@/hooks/useAdvancedStats';
import { useAvatarItems, useUserAvatarItems } from '@/hooks/useAvatarItems';
import type { Achievement } from '@/hooks/useAchievements';

interface Props {
  userId?: string;
  achievements: Achievement[];
}

const formatHours = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  return `${(minutes / 60).toFixed(1).replace('.', ',')} h`;
};

export default function ProfileMotivationCard({ userId, achievements }: Props) {
  const { totalXp, level, nextLevelXp, progress: levelProgress, isLoading: xpLoading } = useUserXp(userId);
  const { data: streak } = useUserStreak(userId);
  const { stats, loading: statsLoading } = useAdvancedStats(userId);
  const { data: avatarItems = [] } = useAvatarItems();
  const { data: ownedAvatarItems = [] } = useUserAvatarItems(userId);

  if (xpLoading || statsLoading) return null;

  const earnedAchievements = achievements.filter((achievement) => achievement.earned);
  const nextAchievement = achievements.find((achievement) => !achievement.earned);
  const ownedAvatarIds = new Set(ownedAvatarItems.map((item) => item.item_id));
  const nextAvatar = avatarItems.find((item) => !ownedAvatarIds.has(item.id));
  const monthlyTarget = 20 * 60;
  const monthlyProgress = Math.min(100, Math.round((stats.userMinutesThisMonth / monthlyTarget) * 100));

  return (
    <Card className="overflow-hidden border-primary/15 shadow-sm">
      <CardHeader className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-card to-secondary/5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Sua evolução
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Cada sessão aproxima você do próximo marco.</p>
          </div>
          <Badge variant="secondary" className="shrink-0">{earnedAchievements.length} conquistas</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        <div className="rounded-2xl bg-primary/5 p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <p className="font-bold">Nível {level}</p>
                <p className="text-xs text-muted-foreground">{totalXp.toLocaleString('pt-BR')} / {nextLevelXp.toLocaleString('pt-BR')} XP</p>
              </div>
            </div>
            {streak && streak.current_streak > 0 && (
              <Badge className="gap-1 bg-orange-500/10 text-orange-600 hover:bg-orange-500/10">
                <Flame className="h-3.5 w-3.5" /> {streak.current_streak} dias
              </Badge>
            )}
          </div>
          <Progress value={levelProgress} className="h-2" />
          <p className="mt-2 text-right text-xs text-muted-foreground">Faltam {Math.max(0, nextLevelXp - totalXp).toLocaleString('pt-BR')} XP para o nível {level + 1}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border/70 p-3"><p className="text-xs text-muted-foreground">Este mês</p><p className="mt-1 font-bold">{formatHours(stats.userMinutesThisMonth)}</p></div>
          <div className="rounded-xl border border-border/70 p-3"><p className="text-xs text-muted-foreground">Melhor dia</p><p className="mt-1 font-bold">{stats.bestWeekday || 'Ainda não'}</p></div>
          <div className="rounded-xl border border-border/70 p-3"><p className="text-xs text-muted-foreground">Melhor sequência</p><p className="mt-1 font-bold">{streak?.best_streak || 0} dias</p></div>
          <div className="rounded-xl border border-border/70 p-3"><p className="text-xs text-muted-foreground">Ritmo mensal</p><p className="mt-1 flex items-center gap-1 font-bold"><TrendingUp className="h-3.5 w-3.5 text-primary" />{monthlyProgress}%</p></div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <Trophy className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Próximo marco</p>
                <p className="mt-1 font-semibold">{nextAchievement ? nextAchievement.name_key.replace(/_/g, ' ') : 'Todas as conquistas desbloqueadas'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{nextAchievement?.description_key?.replace(/_/g, ' ') || 'Você completou sua coleção atual.'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              {nextAvatar ? <Lock className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> : <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Próxima recompensa</p>
                <p className="mt-1 font-semibold">{nextAvatar ? nextAvatar.name : 'Coleção completa'}</p>
                <p className="mt-1 text-xs text-muted-foreground">{nextAvatar?.requirement_label || 'Todos os itens de avatar já estão desbloqueados.'}</p>
              </div>
            </div>
          </div>
        </div>

        {stats.groupAverageMinutesThisMonth !== null && (
          <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <Target className="h-4 w-4 text-primary" /> Você estudou {formatHours(stats.userMinutesThisMonth)} este mês; a média do grupo é {formatHours(stats.groupAverageMinutesThisMonth)}.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
