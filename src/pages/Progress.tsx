
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Target, TrendingUp, Award, Clock, BookOpen, Users, RefreshCw } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';
import { useProgressData } from '@/hooks/useProgressData';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserGroupOption {
  id: string;
  name: string;
}

const LAST_PROGRESS_GROUP_KEY = 'lastProgressGroupId';

const ProgressPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [view, setView] = useState<'individual' | 'group'>('individual');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [groups, setGroups] = useState<UserGroupOption[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { t } = useTranslation();
  const { groupId: routeGroupId } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserGroups = async () => {
      if (!user) {
        setGroups([]);
        setSelectedGroupId(null);
        setGroupsLoading(false);
        return;
      }

      try {
        setGroupsLoading(true);

        const { data, error } = await supabase
          .from('group_members')
          .select(`
            group_id,
            groups:group_id (
              id,
              name
            )
          `)
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        const availableGroups = (data || [])
          .map((membership) => membership.groups)
          .filter((group): group is { id: string; name: string } => Boolean(group?.id && group?.name));

        setGroups(availableGroups);

        if (availableGroups.length === 0) {
          setSelectedGroupId(null);
          return;
        }

        const routeGroupIsValid = routeGroupId && availableGroups.some((group) => group.id === routeGroupId);
        const storedGroupId = localStorage.getItem(LAST_PROGRESS_GROUP_KEY);
        const storedGroupIsValid = storedGroupId && availableGroups.some((group) => group.id === storedGroupId);

        const defaultGroupId = routeGroupIsValid
          ? routeGroupId
          : storedGroupIsValid
            ? storedGroupId
            : availableGroups[0].id;

        setSelectedGroupId(defaultGroupId);
      } catch (error) {
        console.error('Error fetching user groups for progress:', error);
        setGroups([]);
        setSelectedGroupId(null);
      } finally {
        setGroupsLoading(false);
      }
    };

    fetchUserGroups();
  }, [routeGroupId, user]);

  useEffect(() => {
    if (selectedGroupId) {
      localStorage.setItem(LAST_PROGRESS_GROUP_KEY, selectedGroupId);
    }
  }, [selectedGroupId]);
  
  const { stats, loading, refreshData } = useProgressData(
    selectedGroupId ?? undefined,
    timeRange as 'day' | 'week' | 'month' | 'year'
  );

  // Auto-refresh quando a página ganha foco
  useEffect(() => {
    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({
        title: t('progress.updated'),
        description: t('progress.updateSuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('progress.updateError'),
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (groupsLoading || (groups.length > 0 && !selectedGroupId)) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (groups.length === 0) {
    return (
      <PageLayout>
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Você precisa entrar em um grupo para ver o progresso.
          </CardContent>
        </Card>
      </PageLayout>
    );
  }
  
  if (loading) {
    return (
      <PageLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3">
                  <div className="h-16 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header with view toggle */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('progress.title')}
            </h2>
          </div>
          
          <div className="flex gap-2 items-center">
            <div className="w-48">
              <Select value={selectedGroupId ?? ''} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="h-9 w-9"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Tabs value={view} onValueChange={(value) => setView(value as 'individual' | 'group')} className="w-auto">
              <TabsList className="grid grid-cols-2 h-9">
                <TabsTrigger value="individual" className="text-xs flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {t('progress.individual')}
                </TabsTrigger>
                <TabsTrigger value="group" className="text-xs flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {t('progress.group')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
              <TabsList className="grid grid-cols-4 h-9">
                <TabsTrigger value="day" className="text-xs">{t('progress.day')}</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">{t('progress.week')}</TabsTrigger>
                <TabsTrigger value="month" className="text-xs">{t('progress.month')}</TabsTrigger>
                <TabsTrigger value="year" className="text-xs">{t('progress.year')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-primary bg-gradient-to-br from-background to-background/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('progress.pagesRead')}</p>
                  <div className="text-2xl font-bold text-primary">{stats.totalPages}</div>
                </div>
                <BookOpen className="h-8 w-8 text-primary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary bg-gradient-to-br from-background to-background/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('progress.studyTime')}</p>
                  <div className="text-2xl font-bold text-secondary">{stats.totalStudyTime} min</div>
                </div>
                <Clock className="h-8 w-8 text-secondary opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent bg-gradient-to-br from-background to-background/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('progress.exercises')}</p>
                  <div className="text-2xl font-bold text-accent">{stats.totalExercises}</div>
                </div>
                <Target className="h-8 w-8 text-accent opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive bg-gradient-to-br from-background to-background/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('progress.studyStreak')}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-2xl font-bold text-destructive">{stats.studyStreak}</span>
                    <Calendar className="h-5 w-5 text-destructive" />
                  </div>
                </div>
                <Award className="h-8 w-8 text-destructive opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress (only for group view) */}
        {view === 'group' && stats.goalsProgress.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {t('progress.groupGoalsProgress')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.goalsProgress.map((goal) => (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">{goal.subject}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        ({goal.type === 'time' ? 'Tempo' : goal.type === 'pages' ? 'Páginas' : 'Exercícios'})
                      </span>
                    </div>
                    <span className="text-sm font-medium">{goal.current}/{goal.target}</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="text-right">
                    <Badge variant={goal.progress >= 100 ? "default" : "secondary"} className="text-xs">
                      {goal.progress}% {t('progress.complete')}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        
        {/* Daily Sessions View - Only shown when timeRange === 'day' */}
        {timeRange === 'day' && stats.dailySessions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {t('progress.todaySessions')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.dailySessions.length > 0 ? (
                <div className="space-y-3">
                  {stats.dailySessions.map((session) => (
                    <div 
                      key={session.id} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: session.subjectColor }}
                        ></div>
                        <div>
                          <p className="font-medium text-sm">{session.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.startTime} - {session.endTime}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{session.duration} min</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(session.duration / 5) * 2} páginas
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary of the day */}
                  <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{t('progress.todayTotal')}</span>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">{stats.totalStudyTime} min</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.dailySessions.length} {stats.dailySessions.length === 1 ? t('progress.session') : t('progress.sessions')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 opacity-50 mb-3" />
                  <p className="text-sm">{t('progress.noSessionsToday')}</p>
                  <p className="text-xs mt-1">{t('progress.startSessionHint')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Charts - Hide when in daily view */}
        {timeRange !== 'day' && (
          <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                {t('progress.studyTimeByDay')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value}m`}
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} minutos`, t('progress.studyTime')]} 
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="time" 
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]} 
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                {t('progress.pagesReadByDay')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="opacity-30" />
                    <XAxis 
                      dataKey="name" 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      fontSize={12}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value} páginas`, t('progress.pagesRead')]} 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="pages" 
                      fill="hsl(var(--secondary))" 
                      radius={[4, 4, 0, 0]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        )}
        
        {/* Subject Distribution */}
        {stats.subjectData.length > 0 && (
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                {t('progress.studyBySubject')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6 items-center">
                <div className="h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.subjectData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        className="hover:opacity-80 transition-opacity"
                      >
                        {stats.subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, t('progress.percentage')]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3">
                  {stats.subjectData.map((subject) => (
                    <div key={subject.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: subject.color }}
                        ></div>
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="font-bold"
                        style={{ 
                          backgroundColor: `${subject.color}20`,
                          color: subject.color,
                          borderColor: subject.color
                        }}
                      >
                        {subject.value}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default ProgressPage;
