import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type RealtimeProfilePayload = {
  water_goal_ml?: number;
};

export interface WaterStats {
  todayIntake: number;
  dailyGoal: number;
  weeklyData: { name: string; intake: number }[];
}

export function useWaterData() {
  const [waterStats, setWaterStats] = useState<WaterStats>({
    todayIntake: 0,
    dailyGoal: 2500, // Default, will be updated from profile
    weeklyData: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWaterData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const today = new Date().toISOString().split('T')[0];
      
      // Fetch user's water goal from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('water_goal_ml')
        .eq('id', user.id)
        .single();

      const dailyGoal = profile?.water_goal_ml || 2500;
      
      // Fetch today's water intake
      const { data: todayData } = await supabase
        .from('water_intake')
        .select('amount_ml')
        .eq('user_id', user.id)
        .eq('date', today);

      const todayIntake = todayData?.reduce((sum, record) => sum + record.amount_ml, 0) || 0;

      // Fetch weekly data (last 7 days)
      const weeklyData = [];
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayName = weekDays[date.getDay()];

        const { data: dayData } = await supabase
          .from('water_intake')
          .select('amount_ml')
          .eq('user_id', user.id)
          .eq('date', dateStr);

        const dayIntake = dayData?.reduce((sum, record) => sum + record.amount_ml, 0) || 0;
        
        weeklyData.push({
          name: dayName,
          intake: dayIntake
        });
      }

      setWaterStats({
        todayIntake,
        dailyGoal,
        weeklyData
      });

    } catch (error) {
      console.error('Error fetching water data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    void fetchWaterData();

    // Set up real-time subscription for water intake
    const channel = supabase
      .channel('water_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'water_intake',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('📡 Consumo de água atualizado');
          fetchWaterData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload: RealtimePostgresChangesPayload<RealtimeProfilePayload>) => {
          const data = (payload.new ?? {}) as RealtimeProfilePayload;

          if (typeof data.water_goal_ml === 'number') {
            console.log('📡 Meta de água atualizada');
            setWaterStats(prev => ({
              ...prev,
              dailyGoal: data.water_goal_ml
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchWaterData, user]);

  const addWaterIntake = async (amount: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('water_intake')
        .insert({
          user_id: user.id,
          amount_ml: amount,
          date: today
        });

      if (error) throw error;

      // Update local state
      setWaterStats(prev => ({
        ...prev,
        todayIntake: prev.todayIntake + amount
      }));

      toast.success(`+${amount}ml de água adicionado!`);

      // Check if goal reached
      if (waterStats.todayIntake + amount >= waterStats.dailyGoal) {
        toast.success('🎉 Meta diária de hidratação atingida!', { duration: 5000 });
      }

    } catch (error) {
      console.error('Error adding water intake:', error);
      toast.error('Erro ao registrar consumo de água');
    }
  };

  const removeWaterIntake = async (amount: number) => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Get the most recent intake record to remove
      const { data: records } = await supabase
        .from('water_intake')
        .select('id, amount_ml')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('consumed_at', { ascending: false })
        .limit(1);

      if (records && records.length > 0) {
        const { error } = await supabase
          .from('water_intake')
          .delete()
          .eq('id', records[0].id);

        if (error) throw error;

        // Update local state
        setWaterStats(prev => ({
          ...prev,
          todayIntake: Math.max(prev.todayIntake - records[0].amount_ml, 0)
        }));

        toast.success(`-${records[0].amount_ml}ml removido`);
      }

    } catch (error) {
      console.error('Error removing water intake:', error);
      toast.error('Erro ao remover consumo de água');
    }
  };

  const updateWaterGoal = async (newGoal: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ water_goal_ml: newGoal })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state
      setWaterStats(prev => ({
        ...prev,
        dailyGoal: newGoal
      }));

      toast.success('Meta de água atualizada!');
    } catch (error) {
      console.error('Error updating water goal:', error);
      toast.error('Erro ao atualizar meta de água');
    }
  };

  return {
    waterStats,
    loading,
    addWaterIntake,
    removeWaterIntake,
    updateWaterGoal,
    refreshData: fetchWaterData
  };
}
