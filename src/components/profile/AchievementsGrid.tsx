import { Achievement } from '@/hooks/useAchievements';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';

interface AchievementsGridProps {
  achievements: Achievement[];
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const { t } = useTranslation();

  const categories = [
    { key: 'points', label: 'Pontos' },
    { key: 'groups', label: 'Grupos' },
    { key: 'sessions', label: 'Sessões' },
    { key: 'water', label: 'Hidratação' }
  ];

  return (
    <div className="space-y-6">
      {categories.map(category => {
        const categoryAchievements = achievements.filter(a => a.category === category.key);
        if (categoryAchievements.length === 0) return null;

        return (
          <div key={category.key}>
            <h3 className="text-lg font-semibold mb-3 text-foreground">{category.label}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryAchievements.map(achievement => (
                <Card 
                  key={achievement.id}
                  className={`p-4 relative overflow-hidden transition-all ${
                    achievement.earned 
                      ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20' 
                      : 'bg-muted/50 opacity-60'
                  }`}
                >
                  {!achievement.earned && (
                    <div className="absolute top-2 right-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex items-start gap-3">
                    <div className="text-4xl">{achievement.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {t(`achievements.${achievement.name_key}`, achievement.name_key)}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t(`achievements.${achievement.description_key}`, achievement.description_key)}
                      </p>
                      
                      {achievement.earned && achievement.earned_at && (
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {new Date(achievement.earned_at).toLocaleDateString()}
                        </Badge>
                      )}
                      
                      {!achievement.earned && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          {achievement.points_required && `${achievement.points_required} pontos`}
                          {achievement.groups_required && `${achievement.groups_required} grupos`}
                          {achievement.sessions_required && `${achievement.sessions_required} sessões`}
                          {achievement.water_days_required && `${achievement.water_days_required} dias de hidratação`}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
