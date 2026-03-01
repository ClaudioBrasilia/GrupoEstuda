
import React from 'react';
import { Trophy, Book, Calendar, Award, Bell, Settings, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useProfileData } from '@/hooks/useProfileData';
import { useAchievements } from '@/hooks/useAchievements';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AchievementsGrid } from '@/components/profile/AchievementsGrid';
import { useAuth } from '@/context/AuthContext';
import { PremiumBadge } from '@/components/premium/PremiumBadge';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profileStats, loading } = useProfileData();
  const { achievements } = useAchievements();
  const { preferences, loading: preferencesLoading, updatePreference } = useUserPreferences();
  
  const handleNotificationChange = (key: keyof typeof preferences) => {
    updatePreference(key, !preferences[key]);
  };
  
  const earnedAchievements = achievements.filter(a => a.earned);
  const totalAchievements = achievements.length;

  if (loading) {
    return (
      <PageLayout>
        <div className="text-center mb-8">
          <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
          <Skeleton className="h-8 w-48 mx-auto mb-2" />
          <Skeleton className="h-5 w-32 mx-auto mb-4" />
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-3 w-72 mx-auto mb-2" />
          <Skeleton className="h-4 w-40 mx-auto mb-4" />
          <div className="flex justify-center space-x-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>
        </div>
      </PageLayout>
    );
  }
  
  return (
    <PageLayout>
      <div className="text-center mb-8">
        <div className="flex items-center justify-between mb-4">
          <div></div>
          <Avatar className="h-24 w-24">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {profileStats?.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/profile/settings')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Settings size={20} />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-2xl font-bold">{profileStats?.name || t('profile.user', 'Usuário')}</h2>
          {user?.plan === 'premium' && <PremiumBadge size="lg" />}
        </div>
        {user?.plan === 'premium' && (
          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white mb-1">
            <Crown className="h-3 w-3 mr-1" />
            {t('plans.premium.name')}
          </Badge>
        )}
        <div className="text-muted-foreground mb-2">{t('profile.level')} {profileStats?.level || 1} {t('profile.scholar')}</div>
        
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="flex items-center">
            <Trophy size={16} className="text-primary mr-1" />
            <span>{profileStats?.points || 0} {t('profile.points')}</span>
          </div>
          <div className="w-1 h-1 bg-muted rounded-full"></div>
          <div className="flex items-center">
            <Award size={16} className="text-primary mr-1" />
            <span>{t('profile.rank')} #{profileStats?.rank || '--'}</span>
          </div>
        </div>
        
        <div className="max-w-xs mx-auto mb-1 flex justify-between text-xs">
          <span>{t('profile.level')} {profileStats?.level || 1}</span>
          <span>{t('profile.level')} {(profileStats?.level || 1) + 1}</span>
        </div>
        <div className="max-w-xs mx-auto mb-1">
          <Progress value={profileStats?.progress || 0} className="h-2" />
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          {profileStats?.pointsToNextLevel || 100} {t('profile.toNextLevel')}
        </div>
        
        <div className="flex justify-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => navigate('/progress')}
          >
            <Calendar size={14} className="mr-1" />
            <span>{t('profile.studyStats')}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={() => navigate('/groups')}
          >
            <Book size={14} className="mr-1" />
            <span>{t('profile.myGroups')} ({profileStats?.groups || 0})</span>
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile.achievements')} ({earnedAchievements.length}/{totalAchievements})</CardTitle>
        </CardHeader>
        <CardContent>
          <AchievementsGrid achievements={achievements} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Bell size={16} className="mr-2" />
            {t('profile.notificationSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="goal-reminders" className="font-medium">{t('profile.goalReminders')}</Label>
                <p className="text-sm text-muted-foreground">{t('profile.dailyReminders')}</p>
              </div>
              <Switch 
                id="goal-reminders" 
                checked={preferences.goalReminders}
                onCheckedChange={() => handleNotificationChange('goalReminders')}
                disabled={preferencesLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="group-activity" className="font-medium">{t('profile.groupActivity')}</Label>
                <p className="text-sm text-muted-foreground">{t('profile.groupUpdates')}</p>
              </div>
              <Switch 
                id="group-activity" 
                checked={preferences.groupActivity}
                onCheckedChange={() => handleNotificationChange('groupActivity')}
                disabled={preferencesLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="achievements" className="font-medium">{t('profile.achievementNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('profile.achievementAlerts')}</p>
              </div>
              <Switch 
                id="achievements" 
                checked={preferences.achievements}
                onCheckedChange={() => handleNotificationChange('achievements')}
                disabled={preferencesLoading}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weekly-report" className="font-medium">{t('profile.weeklyReport')}</Label>
                <p className="text-sm text-muted-foreground">{t('profile.progressSummary')}</p>
              </div>
              <Switch 
                id="weekly-report" 
                checked={preferences.weeklyReport}
                onCheckedChange={() => handleNotificationChange('weeklyReport')}
                disabled={preferencesLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Profile;
