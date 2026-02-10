import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface ProgressStats {
  totalStudyTime: number;
  totalPages: number;
  totalExercises: number;
  studyStreak: number;
  weeklyData: WeeklyStudyData[];
  subjectData: SubjectProgressData[];
  goalsProgress: GoalProgressData[];
  dailySessions?: DailySessionData[];
}

export interface DailySessionData {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  subject: string;
  subjectColor: string;
}

export interface WeeklyStudyData {
  name: string;
  time: number;
  pages: number;
  exercises: number;
  date: string;
}

export interface SubjectProgressData {
  name: string;
  value: number;
  color: string;
}

export interface GoalProgressData {
  id: string;
  type: string;
  subject: string;
  current: number;
  target: number;
  progress: number;
}

const COLORS = ['hsl(265, 85%, 75%)', 'hsl(265, 53%, 64%)', 'hsl(195, 85%, 60%)', 'hsl(122, 39%, 49%)', 'hsl(45, 100%, 51%)'];

export function useProgressData(groupId?: string, timeRange: 'day' | 'week' | 'month' | 'year' = 'week') {
  const [stats, setStats] = useState<ProgressStats>({
    totalStudyTime: 0,
    totalPages: 0,
    totalExercises: 0,
    studyStreak: 0,
    weeklyData: [],
    subjectData: [],
    goalsProgress: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user, groupId, timeRange]);

  // Atualização em tempo real
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('study_sessions_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Ouve INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Atualização em tempo real detectada:', payload);
          fetchProgressData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, groupId, timeRange]);

  const fetchProgressData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch study sessions based on selected time range
      const startDate = new Date();
      switch (timeRange) {
        case 'day':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }
      
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select(`
          *,
          subjects:subject_id (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .gte('started_at', startDate.toISOString())
        .not('completed_at', 'is', null);

      // Calculate weekly data
      const weeklyData = generateWeeklyData(sessions || []);
      
      // Calculate totals
      const totalStudyTime = (sessions || []).reduce((sum, session) => sum + session.duration_minutes, 0);
      const totalPages = Math.floor(totalStudyTime / 5) * 2; // Estimate 2 pages per 5 minutes
      const totalExercises = Math.floor(totalStudyTime / 10); // Estimate 1 exercise per 10 minutes

      // Calculate study streak
      const studyStreak = await calculateStudyStreak();

      // Fetch subject progress
      const subjectData = await fetchSubjectProgress(sessions || []);

      // Fetch goals progress (only for group view)
      const goalsProgress = groupId ? await fetchGoalsProgress(groupId) : [];

      // Fetch daily sessions (only for day view)
      const dailySessions = timeRange === 'day' ? await fetchDailySessions() : [];

      setStats({
        totalStudyTime,
        totalPages,
        totalExercises,
        studyStreak,
        weeklyData,
        subjectData,
        goalsProgress,
        dailySessions
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyData = (sessions: any[]): WeeklyStudyData[] => {
    const weekDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const data: WeeklyStudyData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const dayName = weekDays[date.getDay()];
      const dateStr = date.toISOString().split('T')[0];
      
      const daySessions = sessions.filter(session => 
        session.started_at.startsWith(dateStr)
      );
      
      const time = daySessions.reduce((sum, session) => sum + session.duration_minutes, 0);
      const pages = Math.floor(time / 5) * 2;
      const exercises = Math.floor(time / 10);

      data.push({
        name: dayName,
        time,
        pages,
        exercises,
        date: dateStr
      });
    }

    return data;
  };

  const fetchSubjectProgress = async (sessions: any[]): Promise<SubjectProgressData[]> => {
    const subjectStats: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      const subjectName = session.subjects?.name || 'Outros';
      subjectStats[subjectName] = (subjectStats[subjectName] || 0) + session.duration_minutes;
    });

    const total = Object.values(subjectStats).reduce((sum, value) => sum + value, 0);
    
    return Object.entries(subjectStats)
      .map(([name, value], index) => ({
        name,
        value: total > 0 ? Math.round((value / total) * 100) : 0,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  };

  const fetchGoalsProgress = async (groupId: string): Promise<GoalProgressData[]> => {
    const { data: goals } = await supabase
      .from('goals')
      .select(`
        id,
        type,
        current,
        target,
        subjects:subject_id (
          name
        )
      `)
      .eq('group_id', groupId);

    return (goals || []).map(goal => ({
      id: goal.id,
      type: goal.type,
      subject: goal.subjects?.name || 'Geral',
      current: goal.current,
      target: goal.target,
      progress: Math.round((goal.current / goal.target) * 100)
    }));
  };

  const fetchDailySessions = async (): Promise<DailySessionData[]> => {
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: sessions } = await supabase
      .from('study_sessions')
      .select(`
        id,
        started_at,
        completed_at,
        duration_minutes,
        subjects:subject_id (
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .gte('started_at', today.toISOString())
      .lt('started_at', tomorrow.toISOString())
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: true });

    return (sessions || []).map((session, index) => ({
      id: session.id,
      startTime: new Date(session.started_at).toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      endTime: session.completed_at 
        ? new Date(session.completed_at).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        : '-',
      duration: session.duration_minutes,
      subject: session.subjects?.name || 'Sem matéria',
      subjectColor: COLORS[index % COLORS.length]
    }));
  };

  const calculateStudyStreak = async (): Promise<number> => {
    if (!user) return 0;

    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false });

    if (!sessions || sessions.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const studyDates = new Set(
      sessions.map(session => 
        new Date(session.started_at).toISOString().split('T')[0]
      )
    );

    while (studyDates.has(currentDate.toISOString().split('T')[0])) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  return {
    stats,
    loading,
    refreshData: fetchProgressData
  };
}