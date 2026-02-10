import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Achievement {
  id: string;
  name_key: string;
  description_key: string;
  icon: string;
  category: string;
  points_required?: number;
  groups_required?: number;
  sessions_required?: number;
  water_days_required?: number;
  earned: boolean;
  earned_at?: string;
}

export function useAchievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);

  const fetchAchievements = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: true });

      // Fetch user's earned achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', user.id);

      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id));
      const earnedMap = new Map(userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]));

      const achievementsWithStatus: Achievement[] = (allAchievements || []).map(achievement => ({
        ...achievement,
        earned: earnedIds.has(achievement.id),
        earned_at: earnedMap.get(achievement.id)
      }));

      setAchievements(achievementsWithStatus);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAndUnlockAchievements = async () => {
    if (!user) return;

    try {
      // Fetch user stats
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id);

      const totalPoints = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;

      const { data: groupsData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupsCount = groupsData?.length || 0;

      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('user_id', user.id)
        .not('completed_at', 'is', null);

      const sessionsCount = sessionsData?.length || 0;

      // Get consecutive water intake days
      const { data: waterData } = await supabase
        .from('water_intake')
        .select('date')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      let waterStreak = 0;
      if (waterData && waterData.length > 0) {
        const dates = waterData.map(w => w.date);
        const uniqueDates = [...new Set(dates)].sort().reverse();
        
        for (let i = 0; i < uniqueDates.length; i++) {
          const currentDate = new Date(uniqueDates[i]);
          const expectedDate = new Date();
          expectedDate.setDate(expectedDate.getDate() - i);
          
          if (currentDate.toDateString() === expectedDate.toDateString()) {
            waterStreak++;
          } else {
            break;
          }
        }
      }

      // Check each achievement
      for (const achievement of achievements) {
        if (achievement.earned) continue;

        let shouldUnlock = false;

        if (achievement.points_required && totalPoints >= achievement.points_required) {
          shouldUnlock = true;
        } else if (achievement.groups_required && groupsCount >= achievement.groups_required) {
          shouldUnlock = true;
        } else if (achievement.sessions_required && sessionsCount >= achievement.sessions_required) {
          shouldUnlock = true;
        } else if (achievement.water_days_required && waterStreak >= achievement.water_days_required) {
          shouldUnlock = true;
        }

        if (shouldUnlock) {
          // Unlock achievement
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            achievement_id: achievement.id
          });

          // Create notification
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'achievement',
            title: '🏆 Nova conquista desbloqueada!',
            message: `Você conquistou: ${achievement.icon} ${achievement.name_key}`,
            link: '/profile'
          });
        }
      }

      // Refresh achievements
      await fetchAchievements();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  return {
    achievements,
    loading,
    refreshAchievements: fetchAchievements,
    checkAndUnlockAchievements
  };
}
