import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

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

export function useLeaderboardData(timeRange: string = 'week') {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardUser[]>([]);
  const [groupLeaderboards, setGroupLeaderboards] = useState<GroupLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchLeaderboardData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's groups
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

      // Fetch global leaderboard - aggregate points by user
      const { data: globalDataRaw } = await supabase
        .from('user_points')
        .select('user_id, points');

      // Agrupar pontos por usuário (já que user_points é por grupo)
      const userPointsMap: Record<string, number> = {};
      globalDataRaw?.forEach(item => {
        userPointsMap[item.user_id] = (userPointsMap[item.user_id] || 0) + item.points;
      });

      const globalData = Object.entries(userPointsMap)
        .map(([user_id, points]) => ({ user_id, points }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 50);

      // Fetch user profiles for global leaderboard
      let globalUsers: LeaderboardUser[] = [];
      if (globalData && globalData.length > 0) {
        const userIds = globalData.map(item => item.user_id);
        
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, plan')
          .in('id', userIds);

        globalUsers = globalData.map((item, index) => {
          const profile = profiles?.find(p => p.id === item.user_id);
          return {
            id: item.user_id,
            name: profile?.name || 'Usuário',
            points: item.points,
            rank: index + 1,
            plan: profile?.plan || undefined,
            isCurrentUser: item.user_id === user.id
          };
        });
      }

      setGlobalLeaderboard(globalUsers);

      // Fetch group leaderboards
      if (groupIds.length > 0) {
        const groupLeaderboardsData: GroupLeaderboard[] = [];

        for (const groupId of groupIds) {
          const group = userGroups?.find(ug => ug.groups.id === groupId)?.groups;
          
          const { data: groupPoints } = await supabase
            .from('user_points')
            .select('user_id, points')
            .eq('group_id', groupId)
            .order('points', { ascending: false });

          let members: LeaderboardUser[] = [];
          if (groupPoints && groupPoints.length > 0) {
            const userIds = groupPoints.map(item => item.user_id);
            
            const { data: profiles } = await supabase
              .from('profiles')
              .select('id, name, plan')
              .in('id', userIds);

            members = groupPoints.map((item, index) => {
              const profile = profiles?.find(p => p.id === item.user_id);
              return {
                id: item.user_id,
                name: profile?.name || 'Usuário',
                points: item.points,
                rank: index + 1,
                plan: profile?.plan || undefined,
                isCurrentUser: item.user_id === user.id
              };
            });
          }

          if (group) {
            groupLeaderboardsData.push({
              id: groupId,
              name: group.name,
              members
            });
          }
        }

        setGroupLeaderboards(groupLeaderboardsData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      void fetchLeaderboardData();
    }
  }, [user, timeRange, fetchLeaderboardData]);

  return {
    globalLeaderboard,
    groupLeaderboards,
    loading,
    refreshData: fetchLeaderboardData
  };
}
