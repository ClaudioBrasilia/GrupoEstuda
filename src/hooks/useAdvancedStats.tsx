import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface WeekdayPattern {
  day: string;
  minutes: number;
}

export interface MonthlyTrendPoint {
  month: string;
  minutes: number;
}

export interface AdvancedStats {
  weekdayPattern: WeekdayPattern[];
  bestWeekday: string | null;
  monthlyTrend: MonthlyTrendPoint[];
  userMinutesThisMonth: number;
  groupAverageMinutesThisMonth: number | null;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function useAdvancedStats(userId?: string, groupId?: string) {
  const [stats, setStats] = useState<AdvancedStats>({
    weekdayPattern: WEEKDAY_LABELS.map(day => ({ day, minutes: 0 })),
    bestWeekday: null,
    monthlyTrend: [],
    userMinutesThisMonth: 0,
    groupAverageMinutesThisMonth: null,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const now = new Date();

      // --- Padrão por dia da semana (últimos 90 dias) ---
      const ninetyDaysAgo = new Date(now);
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: recentSessions } = await supabase
        .from('study_sessions')
        .select('duration_minutes, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', ninetyDaysAgo.toISOString());

      const weekdayMinutes = new Array(7).fill(0);
      (recentSessions || []).forEach(session => {
        const date = new Date(session.completed_at as string);
        weekdayMinutes[date.getDay()] += session.duration_minutes || 0;
      });

      const weekdayPattern = WEEKDAY_LABELS.map((day, index) => ({
        day,
        minutes: weekdayMinutes[index],
      }));

      const bestIndex = weekdayMinutes.reduce(
        (best, value, index) => (value > weekdayMinutes[best] ? index : best),
        0
      );
      const bestWeekday = weekdayMinutes[bestIndex] > 0 ? WEEKDAY_LABELS[bestIndex] : null;

      // --- Tendência dos últimos 6 meses ---
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

      const { data: trendSessions } = await supabase
        .from('study_sessions')
        .select('duration_minutes, completed_at')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .gte('completed_at', sixMonthsAgo.toISOString());

      const monthBuckets: Record<string, number> = {};
      const monthOrder: string[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        monthBuckets[key] = 0;
        monthOrder.push(key);
      }

      (trendSessions || []).forEach(session => {
        const date = new Date(session.completed_at as string);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (key in monthBuckets) {
          monthBuckets[key] += session.duration_minutes || 0;
        }
      });

      const monthlyTrend = monthOrder.map(key => {
        const [, monthIndex] = key.split('-').map(Number);
        return { month: MONTH_LABELS[monthIndex], minutes: monthBuckets[key] };
      });

      // --- Comparação com a média do grupo (mês atual) ---
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const userMinutesThisMonth = (trendSessions || [])
        .filter(session => new Date(session.completed_at as string) >= startOfMonth)
        .reduce((sum, session) => sum + (session.duration_minutes || 0), 0);

      let groupAverageMinutesThisMonth: number | null = null;

      if (groupId) {
        const { data: memberRows } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', groupId);

        const memberIds = (memberRows || []).map(m => m.user_id);

        if (memberIds.length > 0) {
          const { data: groupSessions } = await supabase
            .from('study_sessions')
            .select('user_id, duration_minutes, completed_at')
            .eq('group_id', groupId)
            .not('completed_at', 'is', null)
            .gte('completed_at', startOfMonth.toISOString());

          const perUserTotals: Record<string, number> = {};
          memberIds.forEach(id => { perUserTotals[id] = 0; });
          (groupSessions || []).forEach(session => {
            if (session.user_id in perUserTotals) {
              perUserTotals[session.user_id] += session.duration_minutes || 0;
            }
          });

          const totalMinutes = Object.values(perUserTotals).reduce((a, b) => a + b, 0);
          groupAverageMinutesThisMonth = memberIds.length > 0
            ? Math.round(totalMinutes / memberIds.length)
            : null;
        }
      }

      setStats({
        weekdayPattern,
        bestWeekday,
        monthlyTrend,
        userMinutesThisMonth,
        groupAverageMinutesThisMonth,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas avançadas:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, groupId]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return { stats, loading, refreshStats: fetchStats };
}

// Gera um CSV com o histórico de sessões de estudo do usuário para exportação.
export async function exportStudySessionsCSV(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('completed_at, duration_minutes, pages, exercises, subject_id')
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  if (error) throw error;

  const header = 'Data,Duração (min),Páginas,Exercícios\n';
  const rows = (data || []).map(row => {
    const date = row.completed_at ? new Date(row.completed_at).toLocaleDateString('pt-BR') : '';
    return `${date},${row.duration_minutes ?? 0},${row.pages ?? 0},${row.exercises ?? 0}`;
  });

  return header + rows.join('\n');
}
