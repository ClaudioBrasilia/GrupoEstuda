import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ProfileStats {
  name: string;
  points: number;
  groups: number;
  rank: number;
}

export function useProfileData() {
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    name: '',
    points: 0,
    groups: 0,
    rank: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();

      // Fetch total points across all groups
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id);

      const totalPoints = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;

      // Fetch user's groups count
      const { data: groupsData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupsCount = groupsData?.length || 0;

      // Calculate rank (simplified - based on total points)
      const { data: allUsersPoints } = await supabase
        .from('user_points')
        .select('user_id, points');

      const userTotals: { [key: string]: number } = {};
      allUsersPoints?.forEach(up => {
        userTotals[up.user_id] = (userTotals[up.user_id] || 0) + up.points;
      });

      const sortedUsers = Object.entries(userTotals)
        .sort(([, a], [, b]) => b - a);

      const userRank = sortedUsers.findIndex(([userId]) => userId === user.id) + 1;

      setProfileStats({
        name: profile?.name || 'Usuário',
        points: totalPoints,
        groups: groupsCount,
        rank: userRank || 999,
      });

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    profileStats,
    loading,
    refreshData: fetchProfileData
  };
}
