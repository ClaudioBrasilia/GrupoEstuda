import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { getWeekStart, getMonthStart } from '@/hooks/useSeasons';

export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  rank: number;
  plan?: string;
  isCurrentUser?: boolean;
}

export interface GroupLeaderboard {
  id: string;
  name: string;
  members: LeaderboardUser[];
}

async function fetchProfiles(userIds: string[]) {
  if (userIds.length === 0) return [];
  const { data } = await supabase.from('profiles').select('id, name, plan').in('id', userIds);
  return data || [];
}

function periodRange(timeRange: string): { startsAt: string; endsAt: string } | null {
  const endsAt = new Date().toISOString();
  if (timeRange === 'week') return { startsAt: getWeekStart().toISOString(), endsAt };
  if (timeRange === 'month') return { startsAt: getMonthStart().toISOString(), endsAt };
  return null; // 'all' usa user_points cumulativo
}

export function useLeaderboardData(timeRange: string = 'week') {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardUser[]>([]);
  const [groupLeaderboards, setGroupLeaderboards] = useState<GroupLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLeaderboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: userGroups } = await supabase
        .from('group_members')
        .select(`
          groups:group_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id);

      const groupIds = userGroups?.map(ug => ug.groups.id) || [];
      const range = periodRange(timeRange);

      // Ranking global -------------------------------------------------
      let globalUsers: LeaderboardUser[] = [];

      if (range) {
        const { data: periodData } = await supabase.rpc('period_leaderboard', {
          _starts_at: range.startsAt,
          _ends_at: range.endsAt,
          _group_id: null,
        });
        const rows = (periodData || []).slice(0, 50);
        const profiles = await fetchProfiles(rows.map((r: any) => r.user_id));
        globalUsers = rows.map((row: any) => {
          const profile = profiles.find(p => p.id === row.user_id);
          return {
            id: row.user_id,
            name: profile?.name || 'Usuário',
            points: Number(row.score),
            rank: Number(row.rank),
            plan: profile?.plan || undefined,
            isCurrentUser: row.user_id === user.id,
          };
        });
      } else {
        const { data: globalDataRaw } = await supabase.from('user_points').select('user_id, points');
        const userPointsMap: Record<string, number> = {};
        globalDataRaw?.forEach(item => {
          userPointsMap[item.user_id] = (userPointsMap[item.user_id] || 0) + item.points;
        });
        const globalData = Object.entries(userPointsMap)
          .map(([user_id, points]) => ({ user_id, points }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 50);
        const profiles = await fetchProfiles(globalData.map(item => item.user_id));
        globalUsers = globalData.map((item, index) => {
          const profile = profiles.find(p => p.id === item.user_id);
          return {
            id: item.user_id,
            name: profile?.name || 'Usuário',
            points: item.points,
            rank: index + 1,
            plan: profile?.plan || undefined,
            isCurrentUser: item.user_id === user.id,
          };
        });
      }

      setGlobalLeaderboard(globalUsers);

      // Rankings por grupo -----------------------------------------------
      if (groupIds.length > 0) {
        const groupLeaderboardsData: GroupLeaderboard[] = [];

        for (const groupId of groupIds) {
          const group = userGroups?.find(ug => ug.groups.id === groupId)?.groups;
          let members: LeaderboardUser[] = [];

          if (range) {
            const { data: periodData } = await supabase.rpc('period_leaderboard', {
              _starts_at: range.startsAt,
              _ends_at: range.endsAt,
              _group_id: groupId,
            });
            const rows = periodData || [];
            const profiles = await fetchProfiles(rows.map((r: any) => r.user_id));
            members = rows.map((row: any) => {
              const profile = profiles.find(p => p.id === row.user_id);
              return {
                id: row.user_id,
                name: profile?.name || 'Usuário',
                points: Number(row.score),
                rank: Number(row.rank),
                plan: profile?.plan || undefined,
                isCurrentUser: row.user_id === user.id,
              };
            });
          } else {
            const { data: groupPoints } = await supabase
              .from('user_points')
              .select('user_id, points')
              .eq('group_id', groupId)
              .order('points', { ascending: false });

            if (groupPoints && groupPoints.length > 0) {
              const profiles = await fetchProfiles(groupPoints.map(item => item.user_id));
              members = groupPoints.map((item, index) => {
                const profile = profiles.find(p => p.id === item.user_id);
                return {
                  id: item.user_id,
                  name: profile?.name || 'Usuário',
                  points: item.points,
                  rank: index + 1,
                  plan: profile?.plan || undefined,
                  isCurrentUser: item.user_id === user.id,
                };
              });
            }
          }

          if (group) {
            groupLeaderboardsData.push({ id: groupId, name: group.name, members });
          }
        }

        setGroupLeaderboards(groupLeaderboardsData);
      } else {
        setGroupLeaderboards([]);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, timeRange]);

  useEffect(() => {
    if (user) {
      void fetchLeaderboardData();
    }
  }, [user, timeRange, fetchLeaderboardData]);

  return {
    globalLeaderboard,
    groupLeaderboards,
    loading,
    refreshData: fetchLeaderboardData,
  };
}
