import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Flame, Target, Trophy, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [forceShowButtons, setForceShowButtons] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/today');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setForceShowButtons(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const isReady = !isLoading || forceShowButtons;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-primary/10 px-6 py-10 sm:px-10 lg:px-16">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center gap-12 lg:flex-row lg:items-center lg:gap-20">
        <section className="max-w-xl animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <Users size={16} aria-hidden="true" />
            Estudo em grupo, com propósito
          </div>

          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Estude com companhia.{' '}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Evolua com propósito.
            </span>
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Transforme suas horas de estudo em metas, desafios e conquistas compartilhadas com quem também quer chegar mais longe.
          </p>

          <div className="mt-9 flex w-full max-w-md flex-col gap-3 sm:flex-row">
            {!isReady ? (
              <Button className="h-12 flex-1" disabled>
                {t('loading')}
              </Button>
            ) : user ? (
              <Button
                className="h-12 flex-1 bg-gradient-to-r from-primary to-primary/90 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                onClick={() => navigate('/groups')}
              >
                Continuar estudando <ArrowRight className="ml-2" size={18} />
              </Button>
            ) : (
              <>
                <Button
                  className="h-12 flex-1 bg-gradient-to-r from-primary to-primary/90 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  onClick={() => navigate('/register')}
                >
                  Começar agora <ArrowRight className="ml-2" size={18} />
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex-1 border-primary/40 bg-background/70 transition-all hover:border-primary hover:bg-primary/10"
                  onClick={() => navigate('/login')}
                >
                  Já tenho uma conta
                </Button>
              </>
            )}
          </div>

          {!user && isReady && (
            <p className="mt-4 text-sm text-muted-foreground">
              Comece com uma meta simples e dê o primeiro passo hoje.
            </p>
          )}
        </section>

        <section className="relative flex w-full max-w-md justify-center animate-in fade-in zoom-in-95 duration-700 lg:max-w-lg" aria-label="Benefícios do Grupo Estuda">
          <div className="absolute inset-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 blur-2xl" />
          <div className="relative w-full rounded-[2rem] border border-white/60 bg-card/90 p-5 shadow-xl backdrop-blur sm:p-7">
            <div className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-xl font-extrabold text-white shadow-lg shadow-primary/25">
                  GE
                </div>
                <div>
                  <p className="font-bold text-foreground">Grupo Estuda</p>
                  <p className="text-sm text-muted-foreground">Seu ritmo. Seu grupo. Sua evolução.</p>
                </div>
              </div>
              <div className="rounded-full bg-secondary/15 p-2 text-secondary" title="Sequência de estudos">
                <Flame size={20} aria-hidden="true" />
              </div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-5 text-primary-foreground shadow-lg">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white/80">Meta do grupo</p>
                  <p className="mt-1 text-2xl font-bold">Constância em equipe</p>
                </div>
                <Target size={28} className="text-white/80" aria-hidden="true" />
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/25">
                <div className="h-full w-3/4 rounded-full bg-white" />
              </div>
              <p className="mt-2 text-right text-sm text-white/80">75% concluído</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <Users className="mb-3 text-primary" size={21} aria-hidden="true" />
                <p className="text-sm font-bold text-foreground">Junte-se</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Estude com pessoas que têm o mesmo objetivo.</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <Target className="mb-3 text-secondary" size={21} aria-hidden="true" />
                <p className="text-sm font-bold text-foreground">Cumpra</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Defina metas simples e acompanhe seu ritmo.</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/70 p-4">
                <Trophy className="mb-3 text-accent" size={21} aria-hidden="true" />
                <p className="text-sm font-bold text-foreground">Conquiste</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Transforme constância em XP, badges e evolução.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Home;
