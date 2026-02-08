import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id');

    if (!profiles) {
      return new Response(JSON.stringify({ message: 'No users found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let achievementsUnlocked = 0;

    for (const profile of profiles) {
      const userId = profile.id;

      // Fetch user stats
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', userId);

      const totalPoints = pointsData?.reduce((sum, p) => sum + p.points, 0) || 0;

      const { data: groupsData } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', userId);

      const groupsCount = groupsData?.length || 0;

      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('id')
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      const sessionsCount = sessionsData?.length || 0;

      // Get water intake streak
      const { data: waterData } = await supabase
        .from('water_intake')
        .select('date')
        .eq('user_id', userId)
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

      // Get all achievements
      const { data: allAchievements } = await supabase
        .from('achievements')
        .select('*');

      // Get user's earned achievements
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id')
        .eq('user_id', userId);

      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id));

      // Check each achievement
      for (const achievement of allAchievements || []) {
        if (earnedIds.has(achievement.id)) continue;

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
            user_id: userId,
            achievement_id: achievement.id
          });

          // Create notification
          await supabase.from('notifications').insert({
            user_id: userId,
            type: 'achievement',
            title: '🏆 Nova conquista desbloqueada!',
            message: `Você conquistou: ${achievement.icon} ${achievement.name_key}`,
            link: '/profile'
          });

          achievementsUnlocked++;
          console.log(`Unlocked achievement ${achievement.name_key} for user ${userId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Achievement check completed successfully',
        achievementsUnlocked
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in auto-update-goals:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
