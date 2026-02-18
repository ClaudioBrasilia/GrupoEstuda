import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

export interface StudySession {
  id: string;
  subject_id: string | null;
  subject_name: string;
  duration_minutes: number;
  points: number;
  started_at: Date;
  completed_at: Date | null;
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
      if (groupIds.length > 0) {
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('*')
          .in('group_id', groupIds)
          .order('name');

        const formattedSubjects = subjectsData?.map(subj => ({
          id: subj.id,
          name: subj.name,
          group_id: subj.group_id
        })) || [];

        setSubjects(formattedSubjects);
      }

      const { data: sessionsData } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false });

      const formattedSessions = sessionsData?.map(session => ({
        id: session.id,
        subject_id: session.subject_id,
        subject_name: subjects.find(s => s.id === session.subject_id)?.name || 'Matéria Geral',
        duration_minutes: session.duration_minutes,
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

  const createStudySession = async (subjectId: string, durationSeconds: number, selectedGroupId?: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const normalizedSubjectId = normalizeSubjectId(subjectId);
      const durationMinutes = Math.floor(durationSeconds / 60);
      const points = durationMinutes;

      const subject = subjects.find(s => s.id === normalizedSubjectId);
      const groupId = subject?.group_id || selectedGroupId || null;

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          subject_id: normalizedSubjectId,
          group_id: groupId,
          duration_minutes: durationMinutes,
          started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // CORREÇÃO: Atualizar metas do tipo "time" para a matéria
      if (normalizedSubjectId) {
        const { data: timeGoals } = await supabase
          .from('goals')
          .select('*')
          .eq('subject_id', normalizedSubjectId)
          .eq('type', 'time');

        if (timeGoals && timeGoals.length > 0) {
          for (const goal of timeGoals) {
            const newCurrent = goal.current + durationMinutes;
            await supabase
              .from('goals')
              .update({
                current: newCurrent,
                updated_at: new Date().toISOString()
              })
              .eq('id', goal.id);
          }
        }
      }

      if (groupId) {
        const { data: currentPointsData } = await supabase
          .from('user_points')
          .select('points')
          .eq('user_id', user.id)
          .eq('group_id', groupId)
          .maybeSingle();

        const currentPoints = currentPointsData?.points || 0;

        await supabase
          .from('user_points')
          .upsert({
            user_id: user.id,
            group_id: groupId,
            points: currentPoints + points,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,group_id'
          });
      }

      const subjectName = subjects.find(s => s.id === normalizedSubjectId)?.name || 'Matéria Geral';
      const newSession: StudySession = {
        id: data.id,
        subject_id: data.subject_id,
        subject_name: subjectName,
        duration_minutes: data.duration_minutes,
        points,
        started_at: new Date(data.started_at),
        completed_at: new Date(data.completed_at!)
      };

      setStudySessions(prev => [newSession, ...prev]);

      return { success: true, points };
    } catch (error) {
      console.error('Error creating study session:', error);
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
