import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getWeekStart } from '@/hooks/useSeasons';

export type LeagueTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';

export const LEAGUE_ORDER: LeagueTier[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'];

export const LEAGUE_LABELS: Record<LeagueTier, string> = {
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
  diamond: 'Diamante',
  master: 'Mestre',
};

export const LEAGUE_ICONS: Record<LeagueTier, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💠',
  diamond: '💎',
  master: '👑',
};

export const LEAGUE_COLORS: Record<LeagueTier, string> = {
  bronze: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400',
  silver: 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/40 dark:text-gray-300',
  gold: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400',
  platinum: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/20 dark:text-cyan-400',
  diamond: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400',
  master: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400',
};

export interface LeagueLeaderboardRow {
  user_id: string;
  score: number;
  rank: number;
}

export function useUserLeague(userId?: string) {
  return useQuery({
    queryKey: ['user-league', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_leagues')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data?.tier as LeagueTier) || 'bronze';
    },
    enabled: !!userId,
  });
}

export function useLeagueLeaderboard(tier: LeagueTier | undefined) {
  const startsAt = getWeekStart().toISOString();
  const endsAt = new Date().toISOString();

  return useQuery({
    queryKey: ['league-leaderboard', tier, startsAt],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('league_leaderboard', {
        _tier: tier,
        _starts_at: startsAt,
        _ends_at: endsAt,
      });
      if (error) throw error;
      return data as LeagueLeaderboardRow[];
    },
    enabled: !!tier,
  });
}
