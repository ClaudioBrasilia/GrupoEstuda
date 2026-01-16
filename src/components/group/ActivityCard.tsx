import { Heart, Trash2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StudyActivity } from '@/hooks/useStudyActivities';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { PremiumBadge } from '@/components/premium/PremiumBadge';

interface ActivityCardProps {
  activity: StudyActivity & { user_plan?: string };
  onLike: (activityId: string) => void;
  onDelete: (activityId: string) => void;
  compact?: boolean;
  showGroupBadge?: boolean;
}

export const ActivityCard = ({
  activity,
  onLike,
  onDelete,
  compact = false,
  showGroupBadge = false,
}: ActivityCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isOwner = user?.id === activity.user_id;
  const timeAgo = formatDistanceToNow(activity.created_at, {
    addSuffix: true,
    locale: ptBR,
  });

  const handleGroupClick = () => {
    if (activity.group_id) {
      navigate(`/group/${activity.group_id}`);
    }
  };

  return (
    <Card className={compact ? 'p-3' : ''}>
      <CardContent className={compact ? 'p-0' : 'pt-6'}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {activity.user_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium">{activity.user_name}</p>
                {activity.user_plan === 'premium' && (
                  <PremiumBadge size="sm" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">{timeAgo}</p>
            </div>
          </div>
          <div className="flex gap-1">
            {showGroupBadge && activity.group_name && (
              <Badge
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={handleGroupClick}
              >
                {activity.group_name}
              </Badge>
            )}
            {activity.subject_name && (
              <Badge variant="secondary" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {activity.subject_name}
              </Badge>
            )}
            <Badge variant="default">+{activity.points_earned} pts</Badge>
          </div>
        </div>

        {/* Photo */}
        <img
          src={activity.photo_url}
          alt="Atividade"
          className="w-full rounded-lg object-cover mb-3"
          style={{ maxHeight: compact ? '200px' : '400px' }}
        />

        {/* Description */}
        <p className={`text-sm ${compact ? 'line-clamp-2' : ''}`}>
          {activity.description}
        </p>
      </CardContent>

      <CardFooter className={`flex items-center justify-between ${compact ? 'px-0 pb-0 pt-3' : ''}`}>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => onLike(activity.id)}
        >
          <Heart
            className={`h-4 w-4 ${activity.user_liked ? 'fill-red-500 text-red-500' : ''}`}
          />
          <span className="text-xs">{activity.likes_count}</span>
        </Button>

        {isOwner && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-destructive hover:text-destructive"
            onClick={() => onDelete(activity.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
