import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Season {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  status: 'active' | 'finished';
  champion_user_id: string | null;
}

export interface PeriodLeaderboardRow {
  user_id: string;
  score: number;
  rank: number;
}

export interface SeasonBadge {
  id: string;
  user_id: string;
  season_id: string;
  kind: 'champion' | 'top3';
  awarded_at: string;
  seasons?: { title: string };
}

export function useCurrentSeason() {
  return useQuery({
    queryKey: ['current-season'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'active')
        .order('starts_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Season | null;
    },
  });
}

export function usePeriodLeaderboard(startsAt: string | null, endsAt: string | null, groupId?: string) {
  return useQuery({
    queryKey: ['period-leaderboard', startsAt, endsAt, groupId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('period_leaderboard', {
        _starts_at: startsAt,
        _ends_at: endsAt,
        _group_id: groupId ?? null,
      });
      if (error) throw error;
      return data as PeriodLeaderboardRow[];
    },
    enabled: !!startsAt && !!endsAt,
  });
}

export function useSeason(seasonId?: string) {
  return useQuery({
    queryKey: ['season', seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('id', seasonId!)
        .single();
      if (error) throw error;
      return data as Season;
    },
    enabled: !!seasonId,
  });
}

export function usePastSeasons() {
  return useQuery({
    queryKey: ['past-seasons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasons')
        .select('*')
        .eq('status', 'finished')
        .order('starts_at', { ascending: false });
      if (error) throw error;
      return data as Season[];
    },
  });
}

export function useSeasonBadgesForSeason(seasonId?: string) {
  return useQuery({
    queryKey: ['season-badges-for-season', seasonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('season_badges')
        .select('*')
        .eq('season_id', seasonId!)
        .order('kind');
      if (error) throw error;
      return data as SeasonBadge[];
    },
    enabled: !!seasonId,
  });
}

export function useSeasonBadges(userId?: string) {
  return useQuery({
    queryKey: ['season-badges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('season_badges')
        .select('*, seasons(title)')
        .eq('user_id', userId!)
        .order('awarded_at', { ascending: false });
      if (error) throw error;
      return data as SeasonBadge[];
    },
    enabled: !!userId,
  });
}

// Início da semana (segunda-feira 00:00) e do mês atual, no horário local
// do dispositivo (Brasil). Usar métodos UTC aqui faria a semana/mês "virar"
// até 3h mais cedo do que deveria para quem está no fuso do Brasil.
export function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = (day === 0 ? -6 : 1) - day; // volta até segunda-feira
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function getMonthStart(): Date {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}
