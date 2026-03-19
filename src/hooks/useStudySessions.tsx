import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export const STUDY_SESSION_SAVED_EVENT = 'study-session-saved';

export interface StudySession {
  id: string;
  subject_id: string | null;
  subject_name: string;
  duration_minutes: number;
  pages?: number | null;
  exercises?: number | null;
  points: number;
  started_at: Date;
  completed_at: Date | null;
}

interface StudySessionMetricsInput {
  user_id?: string;
  subject_id?: string | null;
  group_id?: string | null;
  duration_minutes?: number;
  pages?: number | null;
  exercises?: number | null;
}

interface GoalSnapshot {
  id: string;
  current: number;
}

export interface Subject {
  id: string;
  name: string;
  group_id: string;
}

export interface Group {
  id: string;
  name: string;
}

export const useStudySessions = () => {
  const { user } = useAuth();
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    fetchData();

    const channel = supabase
      .channel('sessions_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: userGroups } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name
          )
        `)
        .eq('user_id', user?.id);

      const formattedGroups = userGroups?.map(ug => ({
        id: ug.groups.id,
        name: ug.groups.name
      })) || [];

      setGroups(formattedGroups);

      const groupIds = formattedGroups.map(g => g.id);
      let formattedSubjects: Subject[] = [];

      if (groupIds.length > 0) {
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .in('group_id', groupIds)
          .order('name');

        formattedSubjects = subjectsData?.map(subj => ({
          id: subj.id,
          name: subj.name,
          group_id: subj.group_id
        })) || [];
      }

      setSubjects(formattedSubjects);

      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });

      const formattedSessions = sessionsData?.map(session => ({
        id: session.id,
        subject_id: session.subject_id,
        subject_name: formattedSubjects.find(s => s.id === session.subject_id)?.name || 'Matéria Geral',
        duration_minutes: session.duration_minutes,
        pages: session.pages,
        exercises: session.exercises,
        points: Math.floor(session.duration_minutes),
        started_at: new Date(session.started_at),
        completed_at: session.completed_at ? new Date(session.completed_at) : null
      })) || [];

      setStudySessions(formattedSessions);

    } catch (error) {
      console.error('Error fetching study data:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeSubjectId = (subjectId: string) => {
    if (!subjectId || subjectId === 'general') {
      return null;
    }
    return subjectId;
  };

  const createStudySession = async (
    subjectId: string,
    durationSeconds: number,
    selectedGroupId?: string,
    metrics?: StudySessionMetricsInput
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const normalizedSubjectId = normalizeSubjectId(subjectId);
      const durationMinutes = metrics?.duration_minutes ?? Math.floor(durationSeconds / 60);
      const points = durationMinutes;

      const subject = subjects.find(s => s.id === normalizedSubjectId);
      const groupId = metrics?.group_id ?? subject?.group_id ?? selectedGroupId ?? null;
      const insertUserId = metrics?.user_id ?? user.id;
      const insertSubjectId = metrics?.subject_id ?? normalizedSubjectId;

      // Validação: garantir que pelo menos um grupo seja selecionado
      if (!groupId && !selectedGroupId) {
        return { success: false, error: 'Por favor, selecione um grupo antes de salvar a sessão' };
      }

      const { data: userPointsBefore } = groupId
        ? await supabase
            .from('user_points')
            .select('points')
            .eq('user_id', insertUserId)
            .eq('group_id', groupId)
            .maybeSingle()
        : { data: null };

      const goalsQuery = supabase
        .from('goals')
        .select('id,current')
        .eq('type', 'time');

      const scopedGoalsQuery = insertSubjectId
        ? goalsQuery.eq('subject_id', insertSubjectId)
        : goalsQuery.is('subject_id', null);

      const { data: goalsBefore } = await scopedGoalsQuery;

      const sessionInsert: Database['public']['Tables']['study_sessions']['Insert'] = {
        user_id: insertUserId,
        subject_id: insertSubjectId,
        group_id: groupId,
        duration_minutes: durationMinutes,
        pages: metrics?.pages ?? null,
        exercises: metrics?.exercises ?? null,
        started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
        completed_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('study_sessions')
        .insert(sessionInsert)
        .select()
        .single();

      if (error) throw error;

      window.dispatchEvent(new CustomEvent(STUDY_SESSION_SAVED_EVENT, {
        detail: {
          userId: insertUserId,
          groupId
        }
      }));

      // Fallback de consistência para ambientes sem trigger SQL aplicado.
      if (groupId) {
        const pointsBefore = userPointsBefore?.points ?? 0;
        const { data: userPointsAfter } = await supabase
          .from('user_points')
          .select('points')
          .eq('user_id', insertUserId)
          .eq('group_id', groupId)
          .maybeSingle();

        const pointsAfter = userPointsAfter?.points ?? 0;
        if (pointsAfter <= pointsBefore) {
          await supabase
            .from('user_points')
            .upsert({
              user_id: insertUserId,
              group_id: groupId,
              points: pointsBefore + points,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,group_id'
            });
        }
      }

      const goalsBeforeMap = new Map<string, number>(
        ((goalsBefore || []) as GoalSnapshot[]).map((goal) => [goal.id, goal.current || 0])
      );

      if (goalsBeforeMap.size > 0) {
        const goalsAfterQuery = supabase
          .from('goals')
          .select('id,current')
          .eq('type', 'time');

        const scopedGoalsAfterQuery = insertSubjectId
          ? goalsAfterQuery.eq('subject_id', insertSubjectId)
          : goalsAfterQuery.is('subject_id', null);

        const { data: goalsAfter } = await scopedGoalsAfterQuery;
        const hasUpdatedGoalByTrigger = ((goalsAfter || []) as GoalSnapshot[])
          .some((goal) => (goal.current || 0) > (goalsBeforeMap.get(goal.id) || 0));

        if (!hasUpdatedGoalByTrigger) {
          for (const [goalId, current] of goalsBeforeMap.entries()) {
            await supabase
              .from('goals')
              .update({
                current: current + durationMinutes,
                updated_at: new Date().toISOString()
              })
              .eq('id', goalId);
          }
        }
      }

      const subjectName = subjects.find(s => s.id === insertSubjectId)?.name || 'Matéria Geral';
      const newSession: StudySession = {
        id: data.id,
        subject_id: data.subject_id,
        subject_name: subjectName,
        duration_minutes: data.duration_minutes,
        pages: data.pages,
        exercises: data.exercises,
        points,
        started_at: new Date(data.started_at),
        completed_at: new Date(data.completed_at!)
      };

      setStudySessions(prev => [newSession, ...prev]);

      return { success: true, points };
    } catch (error) {
      console.error('Error creating study session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar sessão de estudo';
      console.error('Detalhes do erro:', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const getSubjectsByGroup = (groupId: string) => {
    return subjects.filter(s => s.group_id === groupId);
  };

  return {
    studySessions,
    subjects,
    groups,
    loading,
    createStudySession,
    getSubjectsByGroup,
    refreshData: fetchData
  };
};
