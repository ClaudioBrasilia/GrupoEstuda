import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserXp {
  user_id: string;
  total_xp: number;
  level: number;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  best_streak: number;
  last_study_date: string | null;
}

// Deve espelhar a função xp_to_level(bigint) no banco.
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000];

export function xpForLevel(level: number): number {
  if (level <= LEVEL_THRESHOLDS.length) return LEVEL_THRESHOLDS[level - 1];
  return 1000 * Math.pow(2, level - 5);
}

export function useUserXp(userId?: string) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-xp', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as UserXp) || { user_id: userId!, total_xp: 0, level: 1 };
    },
    enabled: !!userId,
  });

  const level = data?.level ?? 1;
  const totalXp = data?.total_xp ?? 0;
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const progress = nextLevelXp > currentLevelXp
    ? Math.min(100, Math.round(((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100))
    : 100;

  return { totalXp, level, currentLevelXp, nextLevelXp, progress, isLoading };
}

export function useUserStreak(userId?: string) {
  return useQuery({
    queryKey: ['user-streak', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return (data as UserStreak) || { user_id: userId!, current_streak: 0, best_streak: 0, last_study_date: null };
    },
    enabled: !!userId,
  });
}
