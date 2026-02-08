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

    console.log('Starting water reminder check...');

    const today = new Date().toISOString().split('T')[0];

    // Get all users with goal_reminders enabled
    const { data: preferences, error: prefsError } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('goal_reminders', true);

    if (prefsError) {
      console.error('Error fetching preferences:', prefsError);
      throw prefsError;
    }

    console.log(`Found ${preferences?.length || 0} users with reminders enabled`);

    // Check each user's water intake
    for (const pref of preferences || []) {
      // Get user's water goal
      const { data: profile } = await supabase
        .from('profiles')
        .select('water_goal_ml')
        .eq('id', pref.user_id)
        .single();

      if (!profile) continue;

      // Get today's water intake
      const { data: intakeData } = await supabase
        .from('water_intake')
        .select('amount_ml')
        .eq('user_id', pref.user_id)
        .eq('date', today);

      const totalIntake = intakeData?.reduce((sum, item) => sum + item.amount_ml, 0) || 0;
      const percentageOfGoal = (totalIntake / profile.water_goal_ml) * 100;

      console.log(`User ${pref.user_id}: ${totalIntake}ml / ${profile.water_goal_ml}ml (${percentageOfGoal.toFixed(1)}%)`);

      // If user consumed less than 80% of their goal, send reminder
      if (percentageOfGoal < 80) {
        const remaining = profile.water_goal_ml - totalIntake;
        
        const { error: notifError } = await supabase
          .from('notifications')
          .insert({
            user_id: pref.user_id,
            type: 'water_reminder',
            title: '💧 Lembrete de hidratação',
            message: `Você ainda precisa beber ${remaining}ml para atingir sua meta de hoje!`,
            link: '/water'
          });

        if (notifError) {
          console.error(`Error creating notification for user ${pref.user_id}:`, notifError);
        } else {
          console.log(`Reminder sent to user ${pref.user_id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        checked: preferences?.length || 0 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in water-reminder function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
