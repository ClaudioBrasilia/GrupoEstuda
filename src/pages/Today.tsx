import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Flame, Target, Trophy, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useStudySessions } from '@/hooks/useStudySessions';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const DAILY_GOAL_MINUTES = 60;

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
  const minutesToday = todaySessions.reduce((total, session) => total + session.duration_minutes, 0);
  const goalProgress = Math.min(100, Math.round((minutesToday / DAILY_GOAL_MINUTES) * 100));
  const remainingMinutes = Math.max(0, DAILY_GOAL_MINUTES - minutesToday);
  const latestSession = todaySessions[0];
  const firstName = user?.name?.split(' ')[0] || 'estudante';

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
