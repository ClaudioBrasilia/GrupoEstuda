import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, BookOpen, TrendingUp, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { GoalType } from '@/types/groupTypes';
import { useNavigate } from 'react-router-dom';
import { useStudyActivities } from '@/hooks/useStudyActivities';
import { ActivityCard } from './ActivityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';


interface RecentSessionActivity {
  id: string;
  userName: string;
  happenedAt: string;
}

interface GroupOverviewTabProps {
  goals: GoalType[];
  getSubjectNameById: (id: string) => string;
  onViewAllGoals: () => void;
  groupId: string;
}

const getGoalTypeLabel = (type: GoalType['type']) => {
  switch (type) {
    case 'exercises':
      return 'Exercícios';
    case 'pages':
      return 'Páginas';
    default:
      return 'Tempo (min)';
  }
};

const getGoalProgress = (current: number, target: number) => {
  if (target <= 0) return 0;
  return Math.min((current / target) * 100, 100);
};

const GroupOverviewTab: React.FC<GroupOverviewTabProps> = ({
  goals,
  getSubjectNameById,
  onViewAllGoals,
  groupId,
}) => {
  const navigate = useNavigate();
  const { activities, loading, toggleLike, deleteActivity } = useStudyActivities(groupId);

  const recentActivities = useMemo(() => activities.slice(0, 3), [activities]);
  const overviewGoals = useMemo(() => goals.slice(0, 2), [goals]);
  const [recentSessions, setRecentSessions] = useState<RecentSessionActivity[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchRecentSessions = async () => {
      const { data: sessions } = await supabase
        .from('study_sessions')
        .select('id, user_id, completed_at')
        .eq('group_id', groupId)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(3);

      const sessionRows = sessions || [];
      if (sessionRows.length === 0) {
        if (isMounted) setRecentSessions([]);
        return;
      }

      const userIds = Array.from(new Set(sessionRows.map((session) => session.user_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileById = new Map((profiles || []).map((profile) => [profile.id, profile.name]));

      const formatted: RecentSessionActivity[] = sessionRows.map((session) => ({
        id: session.id,
        userName: profileById.get(session.user_id) || 'Usuário',
        happenedAt: session.completed_at ?? new Date().toISOString()
      }));

      if (isMounted) {
        setRecentSessions(formatted);
      }
    };

    void fetchRecentSessions();

    const channel = supabase
      .channel(`group-overview-sessions:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `group_id=eq.${groupId}`
        },
        () => {
          void fetchRecentSessions();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [groupId]);

  const handleViewProgress = useCallback(() => {
    navigate(`/group/${groupId}/progress`);
  }, [groupId, navigate]);

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">🔥 Atividades Recentes</h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full" />
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              Nenhuma atividade ainda. Seja o primeiro a postar!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={{ ...activity, user_plan: activity.user_plan }}
                onLike={toggleLike}
                onDelete={deleteActivity}
                compact
              />
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Atividade Recente</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewProgress}
            className="flex items-center gap-1"
          >
            <TrendingUp className="h-4 w-4" />
            Ver Progresso
          </Button>
        </div>

        <div className="space-y-3">
          {recentSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem sessões recentes dos participantes.</p>
          ) : (
            recentSessions.map((session) => (
              <div key={session.id} className="flex items-start space-x-3">
                <Clock size={18} className="text-gray-400 mt-1" />
                <div>
                  <p className="text-sm font-medium">{session.userName} completou uma sessão de estudo</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(session.happenedAt), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Metas do Grupo</h3>

        <div className="space-y-3">
          {overviewGoals.map((goal) => (
            <div key={goal.id} className="flex items-start space-x-3">
              <BookOpen size={18} className="text-gray-400 mt-1 flex-shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getSubjectNameById(goal.subject)} - {getGoalTypeLabel(goal.type)}
                </p>

                <div className="w-full bg-gray-200 h-2 rounded-full mt-1">
                  <div
                    className="bg-study-primary h-2 rounded-full"
                    style={{ width: `${getGoalProgress(goal.current, goal.target)}%` }}
                  />
                </div>

                <p className="text-xs text-gray-500 mt-1">
                  {goal.current} de {goal.target}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Button className="mt-4 w-full" onClick={onViewAllGoals}>
          Ver Todas as Metas
        </Button>
      </div>
    </div>
  );
};

export default memo(GroupOverviewTab);
