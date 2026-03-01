import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Target, TrendingUp, Award, Clock, BookOpen, Users, RefreshCw } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { SubjectMetric, useProgressData } from '@/hooks/useProgressData';
import { useParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

const ProgressPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [view, setView] = useState<'individual' | 'group'>('individual');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resolvedGroupId, setResolvedGroupId] = useState<string | undefined>(undefined);
  const [availableGroups, setAvailableGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [subjectMetric, setSubjectMetric] = useState<SubjectMetric>('time');
  const { t } = useTranslation();
  const { user } = useAuth();
  const params = useParams();
  const routeGroupId = params?.groupId;
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    const fetchAvailableGroups = async () => {
      if (!user) {
        if (isMounted) {
          setAvailableGroups([]);
        }
        return;
      }

      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = (memberships || []).map((membership) => membership.group_id);

      if (groupIds.length === 0) {
        if (isMounted) {
          setAvailableGroups([]);
        }
        return;
      }

      const { data: groups } = await supabase
        .from('groups')
        .select('id, name')
        .in('id', groupIds)
        .order('name', { ascending: true });

      if (isMounted) {
        setAvailableGroups((groups || []).map((group) => ({ id: group.id, name: group.name })));
      }
    };

    void fetchAvailableGroups();

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const resolveGroupId = async () => {
      if (routeGroupId) {
        if (isMounted) {
          setResolvedGroupId(routeGroupId);
        }
        localStorage.setItem('activeGroupId', routeGroupId);
        return;
      }

      const storedGroupId = localStorage.getItem('activeGroupId');
      if (storedGroupId) {
        if (isMounted) {
          setResolvedGroupId(storedGroupId);
        }
        return;
      }

      if (!user) {
        if (isMounted) {
          setResolvedGroupId(undefined);
        }
        return;
      }

      const { data: membership } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const fallbackGroupId = membership?.group_id;

      if (fallbackGroupId) {
        localStorage.setItem('activeGroupId', fallbackGroupId);
      }

      if (isMounted) {
        setResolvedGroupId(fallbackGroupId || undefined);
      }
    };

    void resolveGroupId();

    return () => {
      isMounted = false;
    };
  }, [routeGroupId, user]);

  useEffect(() => {
    if (routeGroupId) return;
    if (availableGroups.length === 0) return;

    const hasSelectedGroup = resolvedGroupId && availableGroups.some((group) => group.id === resolvedGroupId);
    if (hasSelectedGroup) return;

    const defaultGroupId = availableGroups[0].id;
    setResolvedGroupId(defaultGroupId);
    localStorage.setItem('activeGroupId', defaultGroupId);
  }, [availableGroups, resolvedGroupId, routeGroupId]);

  const groupId = resolvedGroupId;
  
  const { stats, loading, refreshData } = useProgressData(
    view === 'group' ? groupId : undefined,
    timeRange as 'day' | 'week' | 'month' | 'year',
    groupId,
    subjectMetric
  );

  useEffect(() => {
    refreshData();

    const handleFocus = () => {
      refreshData();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData, view, groupId]);


  const dayActivitiesData = [
    { name: 'Tempo (min)', value: stats.totalStudyTime, color: 'hsl(var(--primary))' },
    { name: 'Páginas', value: stats.totalPages, color: 'hsl(var(--secondary))' },
    { name: 'Exercícios', value: stats.totalExercises, color: 'hsl(var(--accent))' }
  ];

  const remainingGoals = stats.goalsProgress.map((goal) => {
    const remaining = Math.max(goal.target - goal.current, 0);
    return {
      ...goal,
      remaining
    };
  });


  const subjectMetricLabel = {
    time: 'Tempo',
    pages: 'Páginas',
    exercises: 'Exercícios'
  }[subjectMetric];

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({
        title: "Atualizado",
        description: "Progresso atualizado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os dados",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
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
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {t('progress.title')}
            </h2>
          </div>
          
          <div className="flex gap-2">
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
                  Individual
                </TabsTrigger>
                {availableGroups.length > 0 && (
                  <TabsTrigger value="group" className="text-xs flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Grupo
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
            
            {view === 'group' && availableGroups.length > 0 && (
              <Select
                value={groupId}
                onValueChange={(selectedGroupId) => {
                  setResolvedGroupId(selectedGroupId);
                  localStorage.setItem('activeGroupId', selectedGroupId);
                }}
              >
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>
                <SelectContent>
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Tabs value={timeRange} onValueChange={setTimeRange} className="w-auto">
              <TabsList className="grid grid-cols-4 h-9">
                <TabsTrigger value="day" className="text-xs">Dia</TabsTrigger>
                <TabsTrigger value="week" className="text-xs">{t('leaderboard.week')}</TabsTrigger>
                <TabsTrigger value="month" className="text-xs">{t('leaderboard.month')}</TabsTrigger>
                <TabsTrigger value="year" className="text-xs">Ano</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
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
                  <div className="text-2xl font-bold text-secondary">{stats.totalStudyTime}m</div>
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
          
          <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-background to-background/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('progress.awards')}</p>
                  <div className="text-2xl font-bold text-yellow-500">{stats.awardsCount}</div>
                </div>
                <Award className="h-8 w-8 text-yellow-500 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {timeRange === 'day' && (
          <>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Atividades de Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dayActivitiesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[4, 4, 0, 0]}
                        className="hover:opacity-80 transition-opacity"
                      >
                        {dayActivitiesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-secondary" />
                  Metas Restantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {remainingGoals.length > 0 ? (
                    remainingGoals.map((goal) => (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{goal.title}</span>
                          <span className="text-muted-foreground">
                            {goal.remaining > 0 ? `Faltam ${goal.remaining}` : 'Meta batida!'}
                          </span>
                        </div>
                        <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Nenhuma meta definida para hoje</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Sessões de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.dailySessions.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {stats.dailySessions.map((session, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{session.subject_name || 'Sem matéria'}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.duration_minutes} min • {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Total de hoje</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{stats.totalStudyTime} minutos</p>
                        <p className="text-xs text-muted-foreground">
                          {stats.dailySessions.length} {stats.dailySessions.length === 1 ? 'sessão' : 'sessões'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="mx-auto h-12 w-12 opacity-50 mb-3" />
                  <p className="text-sm">Nenhuma sessão de estudo registrada hoje</p>
                  <p className="text-xs mt-1">Inicie uma sessão no Timer para começar!</p>
                </div>
              )}
            </CardContent>
          </Card>
          </>
        )}
        
        {timeRange !== 'day' && (
          <div className="grid gap-6 lg:grid-cols-3">
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

          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Exercícios Resolvidos por Dia
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
                      formatter={(value) => [`${value} exercícios`, t('progress.exercises')]}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="exercises"
                      fill="hsl(var(--accent))"
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
        
        {stats.subjectData.length > 0 && (
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
            <CardHeader className="pb-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  {t('progress.studyBySubject')}
                </CardTitle>
                <Tabs value={subjectMetric} onValueChange={(value) => setSubjectMetric(value as SubjectMetric)} className="w-auto">
                  <TabsList className="grid grid-cols-3 h-8">
                    <TabsTrigger value="time" className="text-xs">Tempo</TabsTrigger>
                    <TabsTrigger value="pages" className="text-xs">Páginas</TabsTrigger>
                    <TabsTrigger value="exercises" className="text-xs">Exercícios</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
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
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={true}
                        className="hover:opacity-80 transition-opacity"
                      >
                        {stats.subjectData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, `${subjectMetricLabel} por matéria`]}
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
        
        {stats.subjectData.length === 0 && (
          <Card className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-lg">
            <CardHeader className="pb-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-accent" />
                  {t('progress.studyBySubject')}
                </CardTitle>
                <Tabs value={subjectMetric} onValueChange={(value) => setSubjectMetric(value as SubjectMetric)} className="w-auto">
                  <TabsList className="grid grid-cols-3 h-8">
                    <TabsTrigger value="time" className="text-xs">Tempo</TabsTrigger>
                    <TabsTrigger value="pages" className="text-xs">Páginas</TabsTrigger>
                    <TabsTrigger value="exercises" className="text-xs">Exercícios</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground py-6">
                Sem dados de {subjectMetricLabel.toLowerCase()} por matéria neste período.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
};

export default ProgressPage;
