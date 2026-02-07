import { useState, useEffect, useCallback } from 'react';
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

  const fetchProgressData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch subject IDs for the given group if groupId is provided
      let subjectIds: string[] = [];
      if (groupId) {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('id')
          .eq('group_id', groupId);

        if (subjectsError) throw subjectsError;
        subjectIds = subjectsData.map(s => s.id);
      }

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
      
      let sessionsQuery = supabase
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

      if (groupId && subjectIds.length > 0) {
        sessionsQuery = sessionsQuery.in('subject_id', subjectIds);
      } else if (groupId && subjectIds.length === 0) {
        // If group has no subjects, no sessions will be found for this group
        sessionsQuery = sessionsQuery.in('subject_id', ['']); // Return empty result
      }

      const { data: sessions, error: sessionsError } = await sessionsQuery;
      if (sessionsError) throw sessionsError;

      // Calculate weekly data
      const weeklyData = generateWeeklyData(sessions || []);
      
      // Calculate totals
      const totalStudyTime = (sessions || []).reduce((sum, session) => sum + session.duration_minutes, 0);
      
      // Fetch goals progress (for pages and exercises)
      let totalPages = Math.floor(totalStudyTime / 5) * 2;
      let totalExercises = Math.floor(totalStudyTime / 10);
      let goalsProgress: GoalProgressData[] = [];

      if (groupId) {
        const { data: goalsData, error: goalsError } = await supabase
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
        
        if (goalsError) throw goalsError;

        const normalizedGoals = goalsData || [];

        goalsProgress = normalizedGoals.map(goal => ({
          id: goal.id,
          type: goal.type,
          subject: goal.subjects?.name || 'Geral',
          current: goal.current,
          target: goal.target,
          progress: goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0
        }));

        totalPages = normalizedGoals
          .filter(goal => goal.type === 'pages')
          .reduce((sum, goal) => sum + goal.current, 0);
        
        totalExercises = normalizedGoals
          .filter(goal => goal.type === 'exercises')
          .reduce((sum, goal) => sum + goal.current, 0);
      }

      // Calculate study streak
      const studyStreak = await calculateStudyStreak(user.id);

      // Fetch subject progress
      const subjectData = await fetchSubjectProgress(sessions || []);

      setStats({
        totalStudyTime,
        totalPages,
        totalExercises,
        studyStreak,
        weeklyData: [...weeklyData],
        subjectData: [...subjectData],
        goalsProgress: [...goalsProgress],
        dailySessions: timeRange === 'day' ? await fetchDailySessions(user.id) : undefined
      });
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, groupId, timeRange]);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [fetchProgressData]);

  // Atualização em tempo real
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Configurando Realtime para Progresso (study_sessions)...');

    const sessionsChannel = supabase
      .channel(`study_sessions_progress_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📡 Realtime: Mudança em study_sessions detectada', payload);
          fetchProgressData();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Removendo canal Realtime (study_sessions)...');
      supabase.removeChannel(sessionsChannel);
    };
  }, [user, fetchProgressData]);

  useEffect(() => {
    if (!groupId) return;

    console.log('🔌 Configurando Realtime para Progresso (goals)...');

    const handleGoalsChange = (payload: { new?: { group_id?: string }; old?: { group_id?: string } }) => {
      const groupIdFromPayload = payload.new?.group_id ?? payload.old?.group_id;

      if (groupIdFromPayload !== groupId) return;

      console.log('📡 Realtime: Mudança em goals detectada', payload);
      fetchProgressData();
    };

    const goalsChannel = supabase
      .channel(`goals_progress_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'goals',
          filter: `group_id=eq.${groupId}`
        },
        handleGoalsChange
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'goals',
          filter: `group_id=eq.${groupId}`
        },
        handleGoalsChange
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'goals',
          filter: `group_id=eq.${groupId}`
        },
        handleGoalsChange
      )
      .subscribe();

    return () => {
      console.log('🔌 Removendo canal Realtime (goals)...');
      supabase.removeChannel(goalsChannel);
    };
  }, [groupId, fetchProgressData]);

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

  const fetchDailySessions = async (userId: string): Promise<DailySessionData[]> => {
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
      .eq('user_id', userId)
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

  const calculateStudyStreak = async (userId: string): Promise<number> => {
    const { data: sessions } = await supabase
      .from('study_sessions')
      .select('started_at')
      .eq('user_id', userId)
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
