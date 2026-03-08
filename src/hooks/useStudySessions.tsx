import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import type { Database } from '@/integrations/supabase/types';

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

      const sessionInsert: Database['public']['Tables']['study_sessions']['Insert'] = {
        user_id: insertUserId,
        subject_id: insertSubjectId,
        group_id: groupId,
        duration_minutes: durationMinutes,
        started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
        completed_at: new Date().toISOString()
      };

      if (typeof metrics?.pages === 'number') {
        sessionInsert.pages = metrics.pages;
      }

      if (typeof metrics?.exercises === 'number') {
        sessionInsert.exercises = metrics.exercises;
      }

      console.info('[createStudySession] inserting study session', {
        userId: insertUserId,
        groupId,
        subjectId: insertSubjectId,
        durationMinutes,
        hasPages: typeof sessionInsert.pages === 'number',
        hasExercises: typeof sessionInsert.exercises === 'number'
      });

      let { data, error } = await supabase
        .from('study_sessions')
        .insert(sessionInsert)
        .select()
        .single();

      if (error && (error.message.includes('column "pages" does not exist') || error.message.includes('column "exercises" does not exist'))) {
        console.warn('[createStudySession] optional metrics columns not available; retrying without pages/exercises', {
          message: error.message,
          code: error.code
        });

        const fallbackInsert: Database['public']['Tables']['study_sessions']['Insert'] = {
          user_id: insertUserId,
          subject_id: insertSubjectId,
          group_id: groupId,
          duration_minutes: durationMinutes,
          started_at: sessionInsert.started_at,
          completed_at: sessionInsert.completed_at
        };

        const retry = await supabase
          .from('study_sessions')
          .insert(fallbackInsert)
          .select()
          .single();

        data = retry.data;
        error = retry.error;
      }

      if (error) throw error;

      // Fonte única de verdade para metas/pontos: trigger SQL no banco.
      // Não realizar atualizações client-side para evitar dupla contabilização.

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
      console.error('[createStudySession] failed to save study session', {
        error,
        userId: user.id,
        subjectId,
        selectedGroupId,
        durationSeconds,
        metrics
      });
      return { success: false, error: 'Erro ao salvar sessão de estudo' };
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
