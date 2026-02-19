import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SessionSubject {
  name: string;
}

interface StudySessionWithSubject {
  id: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number;
  subjects?: SessionSubject | null;
}

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

export function useProgressData(
  groupId?: string,
  timeRange: 'day' | 'week' | 'month' | 'year' = 'week',
  goalsGroupIdFallback?: string
) {
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
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goalsScopeGroupId = groupId ?? goalsGroupIdFallback;

  const generateWeeklyData = useCallback((sessions: StudySessionWithSubject[]): WeeklyStudyData[] => {
    const weekDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const data: WeeklyStudyData[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayName = weekDays[date.getDay()];
      const dateStr = date.toLocaleDateString('en-CA');

      const daySessions = sessions.filter(session => {
        const sessionDate = new Date(session.started_at).toLocaleDateString('en-CA');
        return sessionDate === dateStr;
      });

      const time = daySessions.reduce((sum, session) => sum + session.duration_minutes, 0);
      const pages = Math.floor(time / 5) * 2;
      const exercises = Math.floor(time / 10);

      data.push({ name: dayName, time, pages, exercises, date: dateStr });
    }

    return data;
  }, []);

  const fetchSubjectProgress = useCallback(async (sessions: StudySessionWithSubject[]): Promise<SubjectProgressData[]> => {
    const subjectStats: Record<string, number> = {};

    sessions.forEach(session => {
      const subjectName = session.subjects?.name || 'Outros';
      subjectStats[subjectName] = (subjectStats[subjectName] || 0) + session.duration_minutes;
    });

    const total = Object.values(subjectStats).reduce((sum, value) => sum + value, 0);

    if (total === 0) return [];

    const data = Object.entries(subjectStats)
      .map(([name, value], index) => ({
        name,
        value: Math.round((value / total) * 100),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const sum = data.reduce((s, item) => s + item.value, 0);
    if (sum > 0 && sum !== 100 && data.length > 0) {
      data[0].value += (100 - sum);
    }

    return data;
  }, []);

  const fetchGoalsProgress = useCallback(async (scopeGroupId: string): Promise<GoalProgressData[]> => {
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
      .eq('group_id', scopeGroupId);

    return (goals || []).map(goal => ({
      id: goal.id,
      type: goal.type,
      subject: goal.subjects?.name || 'Geral',
      current: goal.current,
      target: goal.target,
      progress: goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0
    }));
  }, []);

  const fetchDailySessions = useCallback(async (scopeGroupId?: string): Promise<DailySessionData[]> => {
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dailySessionsQuery = supabase
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

    if (scopeGroupId) {
      dailySessionsQuery = dailySessionsQuery.eq('group_id', scopeGroupId);
    }

    const { data: sessions } = await dailySessionsQuery;

    return ((sessions || []) as StudySessionWithSubject[]).map((session, index) => ({
      id: session.id,
      startTime: new Date(session.started_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      endTime: session.completed_at
        ? new Date(session.completed_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '-',
      duration: session.duration_minutes,
      subject: session.subjects?.name || 'Sem matéria',
      subjectColor: COLORS[index % COLORS.length]
    }));
  }, [user]);

  const calculateStudyStreak = useCallback(async (scopeGroupId?: string): Promise<number> => {
    if (!user) return 0;

    let streakQuery = supabase
      .from('study_sessions')
      .select('started_at')
      .eq('user_id', user.id)
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: false });

    if (scopeGroupId) {
      streakQuery = streakQuery.eq('group_id', scopeGroupId);
    }

    const { data: sessions } = await streakQuery;

    if (!sessions || sessions.length === 0) return 0;

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const studyDates = new Set(
      sessions.map(session =>
        new Date(session.started_at).toLocaleDateString('en-CA')
      )
    );

    const todayStr = currentDate.toLocaleDateString('en-CA');
    if (!studyDates.has(todayStr)) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (studyDates.has(currentDate.toLocaleDateString('en-CA'))) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }, [user]);

  const fetchProgressData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const startDate = new Date();
      if (timeRange === 'day') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (timeRange === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
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

      if (groupId) {
        sessionsQuery = sessionsQuery.eq('group_id', groupId);
      }

      const { data: sessions } = await sessionsQuery;
      const sessionRows = (sessions || []) as StudySessionWithSubject[];

      const weeklyData = generateWeeklyData(sessionRows);
      const totalStudyTime = sessionRows.reduce((sum, session) => sum + session.duration_minutes, 0);
      const totalPages = Math.floor(totalStudyTime / 5) * 2;
      const totalExercises = Math.floor(totalStudyTime / 10);
      const studyStreak = await calculateStudyStreak(groupId);
      const subjectData = await fetchSubjectProgress(sessionRows);

      const goalsProgress = goalsScopeGroupId ? await fetchGoalsProgress(goalsScopeGroupId) : [];
      const dailySessions = timeRange === 'day' ? await fetchDailySessions(groupId) : [];

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
  }, [
    user,
    groupId,
    goalsScopeGroupId,
    timeRange,
    generateWeeklyData,
    calculateStudyStreak,
    fetchSubjectProgress,
    fetchGoalsProgress,
    fetchDailySessions
  ]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      void fetchProgressData();
    }, 300);
  }, [fetchProgressData]);

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [fetchProgressData, user]);

  useEffect(() => {
    if (!user) return;

    const channelName = `progress_realtime:${user.id}:${groupId || goalsScopeGroupId || 'all'}`;
    const channel = supabase.channel(channelName);

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'study_sessions',
        filter: `user_id=eq.${user.id}`
      },
      () => {
        scheduleRefresh();
      }
    );

    if (groupId && goalsScopeGroupId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `group_id=eq.${goalsScopeGroupId}`
        },
        () => {
          scheduleRefresh();
        }
      );

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `group_id=eq.${goalsScopeGroupId}`
        },
        () => {
          scheduleRefresh();
        }
      );
    } else {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals'
        },
        () => {
          scheduleRefresh();
        }
      );

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points'
        },
        () => {
          scheduleRefresh();
        }
      );
    }

    channel.subscribe();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [user, groupId, goalsScopeGroupId, scheduleRefresh]);

  return {
    stats,
    loading,
    refreshData: fetchProgressData
  };
}
