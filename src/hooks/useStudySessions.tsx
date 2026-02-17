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

    // Set up real-time subscription for study sessions
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
          console.log('📡 Sessões de estudo atualizadas');
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

      // Fetch user's groups
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

      // Fetch subjects from user's groups
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

      // Fetch user's study sessions
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
        points: Math.floor(session.duration_minutes), // 1 point per minute
        started_at: new Date(session.started_at),
        completed_at: session.completed_at ? new Date(session.completed_at) : null
      })) || [];

      setStudySessions(formattedSessions);

    } catch (error) {
      console.error('Error fetching study data:', error);
      toast.error('Erro ao carregar dados de estudo');
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

  const resolveSubject = async (subjectId: string | null) => {
    if (!subjectId) {
      return null;
    }

    const localSubject = subjects.find((subject) => subject.id === subjectId);
    if (localSubject) {
      return localSubject;
    }

    const { data, error } = await supabase
      .from('subjects')
      .select('id, name, group_id')
      .eq('id', subjectId)
      .single();

    if (error) {
      console.error('Error fetching subject for study session:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      group_id: data.group_id
    };
  };

  const updateTimeGoals = async (groupId: string, subjectId: string | null, durationMinutes: number) => {
    if (durationMinutes <= 0) return;

    let query = supabase
      .from('goals')
      .select('id, current, target')
      .eq('group_id', groupId)
      .eq('type', 'time');

    query = subjectId
      ? query.or(`subject_id.eq.${subjectId},subject_id.is.null`)
      : query.is('subject_id', null);

    const { data: goalsData, error: goalsError } = await query;

    if (goalsError) {
      console.error('Unable to load time goals for update:', goalsError);
      return;
    }

    if (!goalsData || goalsData.length === 0) {
      return;
    }

    for (const goal of goalsData) {
      const nextCurrent = Math.min(goal.current + durationMinutes, goal.target);

      const { error: goalUpdateError } = await supabase
        .from('goals')
        .update({
          current: nextCurrent,
          updated_at: new Date().toISOString()
        })
        .eq('id', goal.id);

      if (goalUpdateError) {
        console.error(`Unable to update time goal ${goal.id}:`, goalUpdateError);
      }
    }
  };

  const syncUserPoints = async (groupId: string, pointsToAdd: number) => {
    if (pointsToAdd <= 0 || !user) return;

    const { data: currentPointsData, error: currentPointsError } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', user.id)
      .eq('group_id', groupId)
      .single();

    if (currentPointsError && currentPointsError.code !== 'PGRST116') {
      console.error('Unable to fetch current user points:', currentPointsError);
      return;
    }

    const currentPoints = currentPointsData?.points || 0;
    const totalPoints = currentPoints + pointsToAdd;

    const { error: upsertError } = await supabase
      .from('user_points')
      .upsert(
        {
          user_id: user.id,
          group_id: groupId,
          points: totalPoints,
          updated_at: new Date().toISOString()
        },
        {
          onConflict: 'user_id,group_id'
        }
      );

    if (upsertError) {
      console.error('Unable to sync user points from timer session:', upsertError);
      toast.error('Sessão salva, mas não foi possível sincronizar os pontos automaticamente.');
    }
  };

  const createStudySession = async (subjectId: string, durationSeconds: number, selectedGroupId?: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      const normalizedSubjectId = normalizeSubjectId(subjectId);
      const durationMinutes = Math.floor(durationSeconds / 60);
      const points = durationMinutes; // 1 point per minute

      const { data, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          subject_id: normalizedSubjectId,
          duration_minutes: durationMinutes,
          started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const subject = await resolveSubject(normalizedSubjectId);
      const sessionGroupId = subject?.group_id || selectedGroupId;

      if (sessionGroupId) {
        await updateTimeGoals(sessionGroupId, normalizedSubjectId, durationMinutes);
        await syncUserPoints(sessionGroupId, points);
      } else {
        console.error('Study session saved without group context. Goals and points were not updated.');
      }

      // Update local state
      const subjectName = subject?.name || 'Matéria Geral';
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
