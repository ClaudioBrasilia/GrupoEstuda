import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export type ChallengeMetric = 'study_minutes' | 'exercises_solved' | 'pages_read';
export type ChallengeMode = 'first_to_goal' | 'deadline' | 'teams';
export type ChallengeStatus = 'draft' | 'active' | 'finished' | 'cancelled';

export interface Challenge {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  metric: ChallengeMetric;
  mode: ChallengeMode;
  goal_value: number | null;
  starts_at: string;
  ends_at: string | null;
  status: ChallengeStatus;
  winner_user_id: string | null;
  winner_team_id: string | null;
  created_at: string;
}

export interface ChallengeTeam {
  id: string;
  challenge_id: string;
  name: string;
  color: string | null;
}

export interface ChallengeParticipant {
  challenge_id: string;
  user_id: string;
  team_id: string | null;
  joined_at: string;
}

export interface RankingRow {
  user_id: string;
  team_id: string | null;
  progress: number;
  rank: number;
}

export interface ChallengeBadge {
  id: string;
  user_id: string;
  challenge_id: string;
  kind: 'winner' | 'top3' | 'finisher';
  awarded_at: string;
  challenges?: { title: string; group_id: string };
}

export function useChallenges(groupId: string) {
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery({
    queryKey: ['challenges', groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Challenge[];
    },
    enabled: !!groupId,
  });

  // Realtime: re-fetch quando challenges ou participants mudarem
  useEffect(() => {
    if (!groupId) return;
    const channel = supabase
      .channel(`challenges:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'challenges', filter: `group_id=eq.${groupId}` },
        () => queryClient.invalidateQueries({ queryKey: ['challenges', groupId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [groupId, queryClient]);

  const createChallenge = useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      metric: ChallengeMetric;
      mode: ChallengeMode;
      goal_value?: number;
      starts_at: string;
      ends_at?: string;
      teams?: { name: string; color: string }[];
    }) => {
      const { teams, ...challengeData } = payload;
      const { data: challenge, error } = await supabase
        .from('challenges')
        .insert({ ...challengeData, group_id: groupId, status: 'active' })
        .select()
        .single();
      if (error) throw error;

      if (teams && teams.length > 0) {
        const { error: teamError } = await supabase
          .from('challenge_teams')
          .insert(teams.map(t => ({ ...t, challenge_id: challenge.id })));
        if (teamError) throw teamError;
      }
      return challenge;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', groupId] }),
  });

  const finishChallenge = useMutation({
    mutationFn: async (challengeId: string) => {
      const { error } = await supabase.rpc('finish_challenge', { _challenge_id: challengeId });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['challenges', groupId] }),
  });

  return { challenges, isLoading, createChallenge, finishChallenge };
}

export function useChallengeDetail(challengeId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: challenge } = useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();
      if (error) throw error;
      return data as Challenge;
    },
    enabled: !!challengeId,
  });

  const { data: ranking = [] } = useQuery({
    queryKey: ['challenge-ranking', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('challenge_ranking', { _challenge_id: challengeId });
      if (error) throw error;
      return data as RankingRow[];
    },
    enabled: !!challengeId,
    refetchInterval: challenge?.status === 'active' ? 30000 : false,
  });

  const { data: participants = [] } = useQuery({
    queryKey: ['challenge-participants', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId);
      if (error) throw error;
      return data as ChallengeParticipant[];
    },
    enabled: !!challengeId,
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['challenge-teams', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_teams')
        .select('*')
        .eq('challenge_id', challengeId);
      if (error) throw error;
      return data as ChallengeTeam[];
    },
    enabled: !!challengeId,
  });

  const isParticipant = participants.some(p => p.user_id === user?.id);

  const joinChallenge = useMutation({
    mutationFn: async (teamId?: string) => {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({ challenge_id: challengeId, user_id: user!.id, team_id: teamId ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge-participants', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['challenge-ranking', challengeId] });
    },
  });

  // Realtime: atualiza ranking quando estudo registrado
  useEffect(() => {
    if (!challengeId || challenge?.status !== 'active') return;
    const channel = supabase
      .channel(`challenge-detail:${challengeId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_sessions' },
        () => queryClient.invalidateQueries({ queryKey: ['challenge-ranking', challengeId] })
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'challenges', filter: `id=eq.${challengeId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
          queryClient.invalidateQueries({ queryKey: ['challenge-ranking', challengeId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [challengeId, challenge?.status, queryClient]);

  return { challenge, ranking, participants, teams, isParticipant, joinChallenge };
}

export function useChallengeBadges(userId?: string) {
  return useQuery({
    queryKey: ['challenge-badges', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_badges')
        .select('*, challenges(title, group_id)')
        .eq('user_id', userId!)
        .order('awarded_at', { ascending: false });
      if (error) throw error;
      return data as ChallengeBadge[];
    },
    enabled: !!userId,
  });
}
