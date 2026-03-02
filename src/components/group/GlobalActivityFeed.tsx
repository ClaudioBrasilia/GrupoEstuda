import { useStudyActivities } from '@/hooks/useStudyActivities';
import { ActivityCard } from './ActivityCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from 'lucide-react';

export const GlobalActivityFeed = () => {
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
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Camera className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhuma atividade ainda</h3>
        <p className="text-muted-foreground">
          Seja o primeiro a compartilhar uma atividade de estudo!
        </p>
      </div>
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
