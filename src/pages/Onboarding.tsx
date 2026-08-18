import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Compass, Flame, Trophy, Users } from 'lucide-react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/context/AuthContext';
import { OnboardingPreferences, saveOnboardingPreferences } from '@/lib/onboarding';

const GOALS = [
  { id: 'consistency' as const, title: 'Criar constância', description: 'Transformar o estudo em um hábito possível de manter.', icon: Flame },
  { id: 'exam' as const, title: 'Passar em uma prova', description: 'Organizar minha preparação e acompanhar minha evolução.', icon: Trophy },
  { id: 'competition' as const, title: 'Estudar em grupo', description: 'Usar desafios e competição saudável para manter o ritmo.', icon: Users },
  { id: 'focus' as const, title: 'Ter mais foco', description: 'Proteger meu tempo de estudo e reduzir a procrastinação.', icon: Compass },
];

const DAILY_MINUTES = [
  { value: 25, label: '25 min', description: 'Começar leve' },
  { value: 45, label: '45 min', description: 'Ritmo consistente' },
  { value: 60, label: '1 hora', description: 'Meta equilibrada' },
  { value: 90, label: '1h30', description: 'Ritmo intenso' },
];

const SUBJECTS = ['Matemática', 'Linguagens', 'Ciências Humanas', 'Ciências da Natureza', 'Programação', 'Concurso público', 'Outro'];

const SOCIAL_OPTIONS = [
  { id: 'join' as const, title: 'Encontrar um grupo', description: 'Ver grupos abertos e começar acompanhado.', icon: Users },
  { id: 'create' as const, title: 'Criar meu grupo', description: 'Convidar amigos para uma meta compartilhada.', icon: Trophy },
  { id: 'later' as const, title: 'Decidir depois', description: 'Começar sozinho e explorar os grupos quando quiser.', icon: Clock3 },
];

const TOTAL_STEPS = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<OnboardingPreferences['goal'] | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [groupPreference, setGroupPreference] = useState<OnboardingPreferences['groupPreference'] | null>(null);

  const canContinue = useMemo(() => {
    if (step === 1) return Boolean(goal);
    if (step === 2) return Boolean(dailyMinutes);
    if (step === 3) return Boolean(subject);
    return Boolean(groupPreference);
  }, [dailyMinutes, goal, groupPreference, step, subject]);

  const finishOnboarding = () => {
    if (!goal || !dailyMinutes || !subject || !groupPreference) return;

    saveOnboardingPreferences({
      goal,
      dailyMinutes,
      subject,
      groupPreference,
      completedAt: new Date().toISOString(),
    });

    if (groupPreference === 'join') {
      navigate('/groups');
      return;
    }

    if (groupPreference === 'create') {
      navigate('/groups');
      return;
    }

    navigate('/timer');
  };

  const next = () => {
    if (!canContinue) return;
    if (step === TOTAL_STEPS) {
      finishOnboarding();
      return;
    }
    setStep((current) => current + 1);
  };

  const back = () => {
    if (step === 1) {
      navigate('/today');
      return;
    }
    setStep((current) => current - 1);
  };

  return (
    <PageLayout hideNav>
      <div className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={back} className="-ml-3">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Voltar
          </Button>
          <span className="text-sm font-medium text-muted-foreground">Passo {step} de {TOTAL_STEPS}</span>
        </div>

        <Progress value={(step / TOTAL_STEPS) * 100} className="mb-10 h-2" />

        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">Vamos preparar seu estudo</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {step === 1 && `Olá${user?.name ? `, ${user.name.split(' ')[0]}` : ''}. O que você quer alcançar?`}
            {step === 2 && 'Qual meta cabe na sua rotina?'}
            {step === 3 && 'Em que você quer focar primeiro?'}
            {step === 4 && 'Como você quer começar?'}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            {step === 1 && 'Escolha uma direção. Você poderá ajustar suas metas depois, sem pressão.'}
            {step === 2 && 'Uma meta pequena e clara facilita o primeiro passo e ajuda a criar consistência.'}
            {step === 3 && 'Vamos usar essa escolha para deixar sua primeira experiência mais relevante.'}
            {step === 4 && 'Você pode estudar com outras pessoas agora ou começar no seu próprio ritmo.'}
          </p>
        </div>

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {GOALS.map((item) => {
              const Icon = item.icon;
              const selected = goal === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setGoal(item.id)} className={`rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card'}`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={22} /></div>
                    {selected && <Check className="h-5 w-5 text-primary" />}
                  </div>
                  <p className="font-semibold text-foreground">{item.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {DAILY_MINUTES.map((item) => {
              const selected = dailyMinutes === item.value;
              return (
                <button key={item.value} type="button" onClick={() => setDailyMinutes(item.value)} className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card'}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary"><Clock3 size={22} /></div>
                  <div className="flex-1"><p className="font-semibold text-foreground">{item.label}</p><p className="text-sm text-muted-foreground">{item.description}</p></div>
                  {selected && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBJECTS.map((item) => {
              const selected = subject === item;
              return (
                <button key={item} type="button" onClick={() => setSubject(item)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card'}`}>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><BookOpen size={19} /></div>
                  <span className="flex-1 font-medium text-foreground">{item}</span>
                  {selected && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            {SOCIAL_OPTIONS.map((item) => {
              const Icon = item.icon;
              const selected = groupPreference === item.id;
              return (
                <button key={item.id} type="button" onClick={() => setGroupPreference(item.id)} className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card'}`}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={22} /></div>
                  <div className="flex-1"><p className="font-semibold text-foreground">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.description}</p></div>
                  {selected && <Check className="h-5 w-5 text-primary" />}
                </button>
              );
            })}
          </div>
        )}

        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p><strong className="text-foreground">Seu plano inicial:</strong> {dailyMinutes || '—'} minutos por dia{subject ? ` em ${subject}` : ''}. Você poderá mudar isso a qualquer momento.</p>
          </CardContent>
        </Card>

        <div className="mt-8 flex justify-end">
          <Button size="lg" onClick={next} disabled={!canContinue} className="min-w-40">
            {step === TOTAL_STEPS ? 'Começar agora' : 'Continuar'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
