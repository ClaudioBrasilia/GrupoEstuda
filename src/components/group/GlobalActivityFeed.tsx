import { useStudyActivities } from '@/hooks/useStudyActivities';
import { ActivityCard } from './ActivityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '@/components/ui/EmptyState';

export const GlobalActivityFeed = () => {
  const navigate = useNavigate();
  const { activities, loading, toggleLike, deleteActivity } = useStudyActivities();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title="Seu feed começa com a sua primeira sessão"
        description="Compartilhe seu progresso e inspire outras pessoas do Grupo Estuda a manterem o ritmo."
        actionLabel="Registrar estudo"
        onAction={() => navigate('/timer')}
      />
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onLike={toggleLike}
          onDelete={deleteActivity}
          showGroupBadge
        />
      ))}
    </div>
  );
};
