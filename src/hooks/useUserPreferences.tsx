import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface UserPreferences {
  goalReminders: boolean;
  groupActivity: boolean;
  achievements: boolean;
  weeklyReport: boolean;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    goalReminders: true,
    groupActivity: true,
    achievements: true,
    weeklyReport: false,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          goalReminders: data.goal_reminders,
          groupActivity: data.group_activity,
          achievements: data.achievements,
          weeklyReport: data.weekly_report,
        });
      } else {
        // Create default preferences if they don't exist
        await createDefaultPreferences();
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar preferências de notificação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPreferences = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .insert([
          {
            user_id: user.id,
            goal_reminders: true,
            group_activity: true,
            achievements: true,
            weekly_report: false,
          }
        ]);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating default preferences:', error);
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: boolean) => {
    if (!user) return;

    try {
      const newPreferences = { ...preferences, [key]: value };
      setPreferences(newPreferences);

      const dbKey = key === 'goalReminders' ? 'goal_reminders' :
                   key === 'groupActivity' ? 'group_activity' :
                   key === 'weeklyReport' ? 'weekly_report' :
                   'achievements';

      const { error } = await supabase
        .from('user_preferences')
        .upsert([
          {
            user_id: user.id,
            [dbKey]: value,
            goal_reminders: newPreferences.goalReminders,
            group_activity: newPreferences.groupActivity,
            achievements: newPreferences.achievements,
            weekly_report: newPreferences.weeklyReport,
          }
        ]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Preferência atualizada com sucesso",
      });
    } catch (error) {
      console.error('Error updating preference:', error);
      // Revert the change
      setPreferences(preferences);
      toast({
        title: "Erro",
        description: "Erro ao atualizar preferência",
        variant: "destructive",
      });
    }
  };

  return {
    preferences,
    loading,
    updatePreference,
    refreshPreferences: fetchPreferences
  };
}