import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { BookOpen, Users, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [forceShowButtons, setForceShowButtons] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/groups');
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

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-gradient-hero" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16 md:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="space-y-7"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Plataforma colaborativa de estudos
            </span>

            <h1 className="text-balance text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              <span className="text-gradient">{t('app.name')}</span>
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground sm:text-xl">
              {t('app.slogan')}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isLoading && !forceShowButtons ? (
                <Button size="lg" className="h-12 px-8" disabled>
                  {t('loading')}
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="h-12 px-8 bg-gradient-primary shadow-glow transition-all hover:opacity-95"
                    onClick={handleGetStarted}
                  >
                    {t('home.getStarted')}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 border-2 px-8"
                    onClick={handleLogin}
                  >
                    {t('login.title')}
                  </Button>
                </>
              )}
            </div>
          </motion.div>

          <motion.section
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="rounded-3xl border border-border/60 bg-card/70 p-6 shadow-lg backdrop-blur-sm"
          >
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-primary p-5 text-primary-foreground">
                <div className="mb-4 inline-flex rounded-full bg-white/20 p-3">
                  <BookOpen className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold">Organize seus estudos</h2>
                <p className="mt-2 text-sm text-primary-foreground/90">
                  Defina metas, mantenha foco e evolua todos os dias em grupo.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <Users className="mb-2 h-5 w-5 text-primary" />
                  <p className="text-sm font-medium">Grupos colaborativos</p>
                </div>
                <div className="rounded-xl border border-border bg-background/80 p-4">
                  <Target className="mb-2 h-5 w-5 text-secondary" />
                  <p className="text-sm font-medium">Metas compartilhadas</p>
                </div>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
};

export default Index;
