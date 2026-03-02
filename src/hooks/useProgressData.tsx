import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { getLocalDayRange, getRangeStart, isInDateRange, ProgressRange, toLocalDateKey } from '@/lib/progressDateRange';

interface SessionSubject {
  name: string;
}

interface StudySessionWithSubject {
  id: string;
  started_at: string;
  completed_at: string | null;
  duration_minutes: number;
  subjects?: SessionSubject | null;
  pages?: number | null;
  exercises?: number | null;
}

interface GoalProgressEvent {
  id: string;
  user_id: string;
  group_id: string | null;
  goal_id: string;
  metric: 'time' | 'pages' | 'exercises';
  delta: number;
  created_at: string;
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

export type SubjectMetric = 'time' | 'pages' | 'exercises';

export interface GoalProgressData {
  id: string;
  type: string;
  subject: string;
  current: number;
  target: number;
  progress: number;
}

const COLORS = ['hsl(265, 85%, 75%)', 'hsl(265, 53%, 64%)', 'hsl(195, 85%, 60%)', 'hsl(122, 39%, 49%)', 'hsl(45, 100%, 51%)'];

const getSessionPages = (session: StudySessionWithSubject) => session.pages ?? Math.floor(session.duration_minutes / 5) * 2;
const getSessionExercises = (session: StudySessionWithSubject) => session.exercises ?? Math.floor(session.duration_minutes / 10);

export function useProgressData(
  groupId?: string,
  timeRange: ProgressRange = 'week',
  goalsGroupIdFallback?: string,
  subjectMetric: SubjectMetric = 'time'
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

  const buildPeriodData = useCallback((
    sessions: StudySessionWithSubject[],
    goalEvents: GoalProgressEvent[],
    range: ProgressRange
  ): WeeklyStudyData[] => {
    const now = new Date();

    if (range === 'year') {
      const data: WeeklyStudyData[] = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const monthSessions = sessions.filter((session) => {
          const started = new Date(session.started_at);
          const key = `${started.getFullYear()}-${String(started.getMonth() + 1).padStart(2, '0')}`;
          return key === monthKey;
        });

        const monthEvents = goalEvents.filter((event) => {
          const created = new Date(event.created_at);
          const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
          return key === monthKey;
        });

        const time = monthSessions.reduce((sum, s) => sum + s.duration_minutes, 0) + monthEvents.filter(e => e.metric === 'time').reduce((sum, e) => sum + e.delta, 0);
        const pages = monthSessions.reduce((sum, s) => sum + getSessionPages(s), 0) + monthEvents.filter(e => e.metric === 'pages').reduce((sum, e) => sum + e.delta, 0);
        const exercises = monthSessions.reduce((sum, s) => sum + getSessionExercises(s), 0) + monthEvents.filter(e => e.metric === 'exercises').reduce((sum, e) => sum + e.delta, 0);

        data.push({
          name: date.toLocaleDateString('pt-BR', { month: 'short' }),
          time,
          pages,
          exercises,
          date: monthKey
        });
      }

      return data;
    }

    const totalDays = range === 'month' ? 30 : 7;
    const weekDays = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
    const data: WeeklyStudyData[] = [];

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = toLocalDateKey(date);

      const daySessions = sessions.filter((session) => {
        const completedOrStartedAt = session.completed_at ?? session.started_at;
        return toLocalDateKey(completedOrStartedAt) === dateStr;
      });

      const dayEvents = goalEvents.filter((event) => toLocalDateKey(event.created_at) === dateStr);

      const time = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0) + dayEvents.filter(e => e.metric === 'time').reduce((sum, e) => sum + e.delta, 0);
      const pages = daySessions.reduce((sum, s) => sum + getSessionPages(s), 0) + dayEvents.filter(e => e.metric === 'pages').reduce((sum, e) => sum + e.delta, 0);
      const exercises = daySessions.reduce((sum, s) => sum + getSessionExercises(s), 0) + dayEvents.filter(e => e.metric === 'exercises').reduce((sum, e) => sum + e.delta, 0);

      data.push({
        name: range === 'week' ? weekDays[date.getDay()] : date.toLocaleDateString('pt-BR', { day: '2-digit' }),
        time,
        pages,
        exercises,
        date: dateStr
      });
    }

    return data;
  }, []);

  const fetchSubjectProgress = useCallback(async (
    sessions: StudySessionWithSubject[],
    metric: SubjectMetric
  ): Promise<SubjectProgressData[]> => {
    const subjectStats: Record<string, number> = {};

    sessions.forEach((session) => {
      const subjectName = session.subjects?.name || 'Outros';
      const metricValue = metric === 'pages'
        ? getSessionPages(session)
        : metric === 'exercises'
          ? getSessionExercises(session)
          : session.duration_minutes;

      subjectStats[subjectName] = (subjectStats[subjectName] || 0) + metricValue;
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

    const dayRange = getLocalDayRange();

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
      .not('completed_at', 'is', null)
      .order('started_at', { ascending: true });

    if (scopeGroupId) {
      dailySessionsQuery = dailySessionsQuery.eq('group_id', scopeGroupId);
    }

    const { data: sessions } = await dailySessionsQuery;

    const filteredSessions = ((sessions || []) as StudySessionWithSubject[]).filter((session) => {
      const startedInDay = isInDateRange(session.started_at, dayRange);
      const completedInDay = session.completed_at ? isInDateRange(session.completed_at, dayRange) : false;
      return startedInDay || completedInDay;
    });

    return filteredSessions.map((session, index) => ({
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

    const studyDates = new Set(sessions.map(session => toLocalDateKey(session.started_at)));

    if (!studyDates.has(toLocalDateKey(currentDate))) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    while (studyDates.has(toLocalDateKey(currentDate))) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  }, [user]);

  const fetchProgressData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      const startDate = getRangeStart(timeRange);
      const dayRange = getLocalDayRange();

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

      const filteredSessions = timeRange === 'day'
        ? sessionRows.filter((session) => {
            const startedInDay = isInDateRange(session.started_at, dayRange);
            const completedInDay = session.completed_at ? isInDateRange(session.completed_at, dayRange) : false;
            return startedInDay || completedInDay;
          })
        : sessionRows;

      let eventsQuery = supabase
        .from('goal_progress_events')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (groupId) {
        eventsQuery = eventsQuery.eq('group_id', groupId);
      } else {
        eventsQuery = eventsQuery.eq('user_id', user.id);
      }

      const { data: events } = await eventsQuery;
      const eventRows = (events || []) as GoalProgressEvent[];
      const filteredEvents = timeRange === 'day'
        ? eventRows.filter((event) => isInDateRange(event.created_at, dayRange))
        : eventRows;

      const eventTime = filteredEvents.filter(e => e.metric === 'time').reduce((sum, event) => sum + event.delta, 0);
      const eventPages = filteredEvents.filter(e => e.metric === 'pages').reduce((sum, event) => sum + event.delta, 0);
      const eventExercises = filteredEvents.filter(e => e.metric === 'exercises').reduce((sum, event) => sum + event.delta, 0);

      const sessionTime = filteredSessions.reduce((sum, session) => sum + session.duration_minutes, 0);
      const sessionPages = filteredSessions.reduce((sum, session) => sum + getSessionPages(session), 0);
      const sessionExercises = filteredSessions.reduce((sum, session) => sum + getSessionExercises(session), 0);

      const weeklyData = buildPeriodData(filteredSessions, filteredEvents, timeRange);
      const totalStudyTime = sessionTime + eventTime;
      const totalPages = sessionPages + eventPages;
      const totalExercises = sessionExercises + eventExercises;
      const studyStreak = await calculateStudyStreak(groupId);
      const subjectData = await fetchSubjectProgress(filteredSessions, subjectMetric);

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
    buildPeriodData,
    calculateStudyStreak,
    fetchSubjectProgress,
    fetchGoalsProgress,
    fetchDailySessions,
    subjectMetric
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
      scheduleRefresh
    );

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'goal_progress_events',
        filter: groupId ? `group_id=eq.${groupId}` : `user_id=eq.${user.id}`
      },
      scheduleRefresh
    );

    if (goalsScopeGroupId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `group_id=eq.${goalsScopeGroupId}`
        },
        scheduleRefresh
      );

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_points',
          filter: `group_id=eq.${goalsScopeGroupId}`
        },
        scheduleRefresh
      );

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subjects',
          filter: `group_id=eq.${goalsScopeGroupId}`
        },
        scheduleRefresh
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
