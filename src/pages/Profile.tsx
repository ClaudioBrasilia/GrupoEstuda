
import React from 'react';
import { Clock3, Trophy, Book, Calendar, Award, Bell, Settings, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useProfileData } from '@/hooks/useProfileData';
import { useAchievements } from '@/hooks/useAchievements';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { AchievementsGrid } from '@/components/profile/AchievementsGrid';
import ChallengeBadges from '@/components/profile/ChallengeBadges';
import ProfileMotivationCard from '@/components/profile/ProfileMotivationCard';
import SeasonBadges from '@/components/profile/SeasonBadges';
import LeagueCard from '@/components/profile/LeagueCard';
import AvatarWithFrame from '@/components/profile/AvatarWithFrame';
import AvatarShop from '@/components/profile/AvatarShop';
import { useAuth } from '@/context/AuthContext';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { useReminderSettings } from '@/hooks/useReminderSettings';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profileStats, loading } = useProfileData();
  const { achievements } = useAchievements();
  const { preferences, loading: preferencesLoading, updatePreference } = useUserPreferences();
  const { settings: reminderSettings, updateSettings: updateReminderSettings, requestBrowserPermission } = useReminderSettings();
  const [browserPermission, setBrowserPermission] = React.useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    return Notification.permission;
  });
  
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
          <AvatarWithFrame userId={user?.id} name={profileStats?.name} size="lg" />
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
          <h2 className="text-2xl font-bold">{profileStats?.name || 'Usuário'}</h2>
          {user?.plan === 'premium' && <PremiumBadge size="lg" />}
        </div>
        {user?.plan === 'premium' && (
          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white mb-1">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        )}
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

      <div className="mb-6 space-y-3">
        <ProfileMotivationCard userId={user?.id} achievements={achievements} />
        <LeagueCard userId={user?.id} />
      </div>

      <div className="mb-6">
        <AvatarShop userId={user?.id} />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile.achievements')} ({earnedAchievements.length}/{totalAchievements})</CardTitle>
        </CardHeader>
        <CardContent>
          <AchievementsGrid achievements={achievements} />
        </CardContent>
      </Card>
      
      <div className="space-y-6 mb-6">
        <SeasonBadges userId={user?.id} />
        <ChallengeBadges userId={user?.id} />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center">
            <Bell size={16} className="mr-2" />
            {t('profile.notificationSettings')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-5">
            <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Clock3 size={19} aria-hidden="true" />
                  </div>
                  <div>
                    <Label htmlFor="reminders-enabled" className="font-semibold">Lembrete diário de estudo</Label>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Escolha um horário para receber um convite gentil quando ainda não tiver completado sua meta.</p>
                  </div>
                </div>
                <Switch id="reminders-enabled" checked={reminderSettings.enabled} onCheckedChange={(checked) => updateReminderSettings({ enabled: checked })} />
              </div>
              {reminderSettings.enabled && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="reminder-time">Horário do lembrete</Label>
                    <Input id="reminder-time" type="time" value={reminderSettings.time} onChange={(event) => updateReminderSettings({ time: event.target.value })} className="w-36 bg-background" />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={async () => setBrowserPermission(await requestBrowserPermission())}>
                    {browserPermission === 'granted' ? 'Notificações ativas' : browserPermission === 'denied' ? 'Permissão bloqueada' : 'Ativar no navegador'}
                  </Button>
                </div>
              )}
            </div>

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
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default Profile;
