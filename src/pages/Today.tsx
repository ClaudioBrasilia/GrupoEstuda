import React from 'react';
import { ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Compass, Flame, Target, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStudySessions } from '@/hooks/useStudySessions';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getOnboardingPreferences, isOnboardingComplete } from '@/lib/onboarding';

const DEFAULT_DAILY_GOAL_MINUTES = 60;

const formatDuration = (minutes: number) => {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};

const Today: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { studySessions, groups, loading } = useStudySessions();

  const todayKey = new Date().toLocaleDateString('en-CA');
  const todaySessions = studySessions.filter((session) =>
    session.started_at.toLocaleDateString('en-CA') === todayKey
  );
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const weeklySessions = studySessions.filter((session) => session.started_at >= weekStart);
  const weeklyMinutes = weeklySessions.reduce((total, session) => total + session.duration_minutes, 0);
  const minutesToday = todaySessions.reduce((total, session) => total + session.duration_minutes, 0);
  const onboardingPreferences = getOnboardingPreferences();
  const dailyGoalMinutes = onboardingPreferences?.dailyMinutes || DEFAULT_DAILY_GOAL_MINUTES;
  const goalProgress = Math.min(100, Math.round((minutesToday / dailyGoalMinutes) * 100));
  const remainingMinutes = Math.max(0, dailyGoalMinutes - minutesToday);
  const latestSession = todaySessions[0];
  const firstName = user?.name?.split(' ')[0] || 'estudante';
  const onboardingComplete = isOnboardingComplete();

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Preparando seu dia de estudos...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl space-y-6 pb-4">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-white shadow-lg sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
              <Flame size={17} aria-hidden="true" />
              Seu foco de hoje
            </div>
            <h1 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bom estudo, {firstName}.
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg">
              Uma sessão de cada vez. Complete sua meta de hoje e mantenha seu ritmo junto com o grupo.
            </p>
            <Button
              className="mt-6 h-12 bg-white px-5 font-bold text-primary shadow-md transition-transform hover:-translate-y-0.5 hover:bg-white/90"
              onClick={() => navigate('/timer')}
            >
              {minutesToday > 0 ? 'Continuar estudando' : 'Começar sessão'}
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </div>
        </section>

        {!onboardingComplete && (
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-card to-secondary/5 shadow-sm">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Compass size={22} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Personalize seu começo</p>
                  <h2 className="mt-1 text-lg font-bold text-foreground">Defina seu objetivo e sua primeira meta</h2>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">Leva menos de um minuto e ajuda o Grupo Estuda a orientar seu próximo passo.</p>
                </div>
              </div>
              <Button variant="outline" className="shrink-0" onClick={() => navigate('/onboarding')}>
                Fazer configuração <ArrowRight className="ml-2" size={16} />
              </Button>
            </CardContent>
          </Card>
        )}

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumo do dia">
          <Card className="border-primary/15 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Meta de hoje</p>
                <Target className="text-primary" size={20} aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-foreground">{formatDuration(minutesToday)}</p>
              <Progress value={goalProgress} className="mt-3 h-2" />
              <p className="mt-2 text-xs text-muted-foreground">
                {remainingMinutes > 0 ? `Faltam ${formatDuration(remainingMinutes)}` : 'Meta concluída. Excelente trabalho!'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-secondary/15 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Sessões concluídas</p>
                <CheckCircle2 className="text-secondary" size={20} aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todaySessions.length}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {latestSession ? `Última: ${latestSession.subject_name}` : 'Sua primeira sessão começa agora.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/15 shadow-sm">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Pontos ganhos</p>
                <Trophy className="text-accent" size={20} aria-hidden="true" />
              </div>
              <p className="text-2xl font-bold text-foreground">{todaySessions.reduce((total, session) => total + session.points, 0)} XP</p>
              <p className="mt-2 text-xs text-muted-foreground">Cada minuto estudado conta para sua evolução.</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]" aria-label="Resumo semanal">
          <Card className="border-primary/15 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays size={23} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">Seu ritmo nos últimos 7 dias</p>
                  <span className="text-sm font-bold text-primary">{formatDuration(weeklyMinutes)}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{weeklySessions.length} {weeklySessions.length === 1 ? 'sessão concluída' : 'sessões concluídas'} nesta semana.</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${Math.min(100, Math.round((weeklyMinutes / (dailyGoalMinutes * 7)) * 100))}%` }} /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-secondary/15 bg-secondary/5 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
                <Flame size={23} aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Continue seu ritmo</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{minutesToday > 0 ? 'Você já começou bem hoje. Mais um bloco mantém sua evolução.' : 'Uma sessão curta hoje já ajuda a manter a sequência.'}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock3 className="text-primary" size={20} aria-hidden="true" />
                Próximo passo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-2xl bg-muted/50 p-5">
                <p className="text-sm font-semibold text-primary">Sessão recomendada</p>
                <h2 className="mt-1 text-xl font-bold text-foreground">
                  {remainingMinutes > 0 ? `Estude por ${Math.min(25, remainingMinutes)} minutos` : 'Escolha um novo desafio'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {remainingMinutes > 0
                    ? 'Comece com um bloco curto de foco. Ao terminar, sua meta ficará ainda mais perto.'
                    : 'Sua meta diária foi concluída. Aproveite para registrar uma nova conquista ou ajudar seu grupo.'}
                </p>
                <Button className="mt-4" onClick={() => navigate('/timer')}>
                  {remainingMinutes > 0 ? 'Abrir cronômetro' : 'Ver meu progresso'}
                  <ArrowRight className="ml-2" size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="text-secondary" size={20} aria-hidden="true" />
                Seu grupo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groups.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-2xl bg-secondary/10 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
                      <BookOpen size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{groups[0].name}</p>
                      <p className="text-xs text-muted-foreground">Pronto para mais uma sessão?</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/group/${groups[0].id}`)}>
                    Abrir grupo <ArrowRight className="ml-2" size={16} />
                  </Button>
                </div>
              ) : (
                <div className="rounded-2xl bg-muted/50 p-4">
                  <p className="font-semibold text-foreground">Você ainda não tem um grupo.</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Encontre pessoas com o mesmo objetivo e estude com mais constância.</p>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => navigate('/groups')}>
                    Encontrar um grupo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
};

export default Today;
