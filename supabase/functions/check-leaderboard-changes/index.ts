import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Checking leaderboard changes...');

    // Get all user points
    const { data: allPoints, error: pointsError } = await supabase
      .from('user_points')
      .select('user_id, points');

    if (pointsError) {
      console.error('Error fetching points:', pointsError);
      throw pointsError;
    }

    // Calculate total points per user
    const userTotals: { [key: string]: number } = {};
    allPoints?.forEach(up => {
      userTotals[up.user_id] = (userTotals[up.user_id] || 0) + up.points;
    });

    // Sort users by points
    const sortedUsers = Object.entries(userTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([userId], index) => ({ userId, rank: index + 1 }));

    // Store current rankings in a temporary storage (for now, we'll use a simple comparison with a threshold)
    // In a production app, you'd want to store previous rankings in a table
    
    // For this implementation, we'll check if users have moved significantly in ranking
    // by comparing their current position with their expected position based on their total points
    
    console.log(`Processed rankings for ${sortedUsers.length} users`);

    // For demonstration, let's notify top 10 users about their ranking
    const topUsers = sortedUsers.slice(0, 10);
    
    for (const user of topUsers) {
      // Get user profile to check if they want notifications
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('achievements')
        .eq('user_id', user.userId)
        .single();

      if (preferences?.achievements) {
        // Create notification about their ranking
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: user.userId,
            type: 'leaderboard',
            title: '📈 Ranking Atualizado',
            message: `Você está em #${user.rank} no ranking global! Continue estudando para subir mais posições.`,
            link: '/leaderboard'
          });

        if (notifError) {
          console.error(`Error creating notification for user ${user.userId}:`, notifError);
        } else {
          console.log(`Ranking notification sent to user ${user.userId}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: sortedUsers.length,
        notified: topUsers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-leaderboard-changes function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
