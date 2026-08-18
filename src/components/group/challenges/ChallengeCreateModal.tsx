import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, CalendarClock, Flame, Plus, Sparkles, Target, Trash2, UsersRound } from 'lucide-react';
import { useChallenges, ChallengeMetric, ChallengeMode } from '@/hooks/useChallenges';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  groupId: string;
}

interface FormValues {
  title: string;
  description: string;
  metric: ChallengeMetric;
  mode: ChallengeMode;
  goal_value: string;
  ends_at: string;
  teams: { name: string; color: string }[];
}

const METRIC_LABELS: Record<ChallengeMetric, string> = {
  study_minutes: 'Minutos estudados',
  exercises_solved: 'Exercícios resolvidos',
  pages_read: 'Páginas lidas',
};

const TEAM_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];

interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  helper: string;
  metric: ChallengeMetric;
  mode: ChallengeMode;
  goal: number;
  durationDays?: number;
  icon: React.ElementType;
  color: string;
}

const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  {
    id: 'consistency',
    title: '7 dias de constância',
    description: 'Crie o hábito de estudar um pouco todos os dias.',
    helper: '300 minutos em 7 dias',
    metric: 'study_minutes',
    mode: 'deadline',
    goal: 300,
    durationDays: 7,
    icon: Flame,
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
  },
  {
    id: 'team-hours',
    title: '100 horas em equipe',
    description: 'Some o esforço do grupo para alcançar uma meta coletiva.',
    helper: '6.000 minutos em 30 dias',
    metric: 'study_minutes',
    mode: 'teams',
    goal: 6000,
    durationDays: 30,
    icon: UsersRound,
    color: 'text-primary bg-primary/10 border-primary/20',
  },
  {
    id: 'exam-review',
    title: 'Revisão para a prova',
    description: 'Organize uma revisão objetiva antes da data importante.',
    helper: '100 páginas em 14 dias',
    metric: 'pages_read',
    mode: 'deadline',
    goal: 100,
    durationDays: 14,
    icon: BookOpen,
    color: 'text-secondary bg-secondary/10 border-secondary/20',
  },
  {
    id: 'exercise-sprint',
    title: 'Desafio por exercícios',
    description: 'Veja quem consegue resolver mais questões primeiro.',
    helper: '200 exercícios',
    metric: 'exercises_solved',
    mode: 'first_to_goal',
    goal: 200,
    icon: Target,
    color: 'text-accent bg-accent/10 border-accent/20',
  },
];

const formatLocalDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export default function ChallengeCreateModal({ open, onClose, groupId }: Props) {
  const { createChallenge } = useChallenges(groupId);
  const { toast } = useToast();

  const { register, handleSubmit, watch, control, setValue, reset } = useForm<FormValues>({
    defaultValues: {
      metric: 'study_minutes',
      mode: 'deadline',
      teams: [],
    },
  });

  const { fields: teamFields, append: appendTeam, remove: removeTeam, replace: replaceTeams } = useFieldArray({
    control,
    name: 'teams',
  });

  const mode = watch('mode');
  const metric = watch('metric');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const applyTemplate = (template: ChallengeTemplate) => {
    const endDate = template.durationDays ? new Date(Date.now() + template.durationDays * 24 * 60 * 60 * 1000) : undefined;
    setSelectedTemplate(template.id);
    setValue('title', template.title);
    setValue('description', template.description);
    setValue('metric', template.metric);
    setValue('mode', template.mode);
    setValue('goal_value', String(template.goal));
    setValue('ends_at', endDate ? formatLocalDateTime(endDate) : '');
    replaceTeams(template.mode === 'teams' ? [{ name: 'Equipe 1', color: TEAM_COLORS[0] }, { name: 'Equipe 2', color: TEAM_COLORS[1] }] : []);
  };
  const metricUnit = metric === 'study_minutes' ? 'minutos' : metric === 'exercises_solved' ? 'exercícios' : 'páginas';

  const onSubmit = async (values: FormValues) => {
    try {
      await createChallenge.mutateAsync({
        title: values.title,
        description: values.description || undefined,
        metric: values.metric,
        mode: values.mode,
        goal_value: values.goal_value ? parseInt(values.goal_value) : undefined,
        starts_at: new Date().toISOString(),
        ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : undefined,
        teams: values.mode === 'teams' ? values.teams : undefined,
      });
      toast({ title: 'Desafio criado!', description: 'O desafio foi criado com sucesso.' });
      reset();
      setSelectedTemplate(null);
      onClose();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Comece com um modelo pronto
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-2xl bg-primary/5 p-3 text-sm text-muted-foreground">
          Escolha uma sugestão para começar em poucos segundos. Depois, você pode ajustar qualquer detalhe.
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {CHALLENGE_TEMPLATES.map((template) => {
            const TemplateIcon = template.icon;
            const isSelected = selectedTemplate === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() => applyTemplate(template)}
                className={`rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  isSelected ? 'border-primary bg-primary/10 ring-2 ring-primary/20' : 'border-border bg-card'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${template.color}`}>
                    <TemplateIcon size={16} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{template.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{template.description}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary">
                      <CalendarClock size={13} aria-hidden="true" /> {template.helper}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>ou personalize abaixo</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Título *</Label>
            <Input {...register('title', { required: true })} placeholder="Ex: Quem estuda mais essa semana?" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea {...register('description')} placeholder="Descreva o desafio..." rows={2} />
          </div>

          <div>
            <Label>Métrica</Label>
            <Select onValueChange={v => setValue('metric', v as ChallengeMetric)} defaultValue="study_minutes">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(METRIC_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Modo</Label>
            <RadioGroup
              defaultValue="deadline"
              onValueChange={v => setValue('mode', v as ChallengeMode)}
              className="flex gap-4 mt-1"
            >
              <div className="flex items-center gap-1">
                <RadioGroupItem value="first_to_goal" id="m1" />
                <Label htmlFor="m1" className="cursor-pointer">Primeiro a atingir meta</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="deadline" id="m2" />
                <Label htmlFor="m2" className="cursor-pointer">Por prazo</Label>
              </div>
              <div className="flex items-center gap-1">
                <RadioGroupItem value="teams" id="m3" />
                <Label htmlFor="m3" className="cursor-pointer">Por equipes</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label>Meta — quantidade de {metricUnit} a atingir</Label>
            <Input type="number" min={1} {...register('goal_value')} placeholder={`Ex: 100 ${metricUnit}`} />
            <p className="text-xs text-muted-foreground mt-1">
              {mode === 'first_to_goal'
                ? `Vence quem alcançar ${metricUnit} primeiro.`
                : mode === 'teams'
                ? `Quantidade de ${metricUnit} que a equipe deve alcançar.`
                : `Quantidade de ${metricUnit} a alcançar até o prazo. Opcional — deixe em branco para uma disputa livre (vence quem tiver mais).`}
            </p>
          </div>

          {(mode === 'deadline' || mode === 'teams') && (
            <div>
              <Label>Prazo</Label>
              <Input type="datetime-local" {...register('ends_at')} />
            </div>
          )}

          {mode === 'teams' && (
            <div>
              <Label>Equipes</Label>
              <div className="space-y-2 mt-1">
                {teamFields.map((field, i) => (
                  <div key={field.id} className="flex gap-2 items-center">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TEAM_COLORS[i % TEAM_COLORS.length] }}
                    />
                    <Input
                      {...register(`teams.${i}.name`)}
                      placeholder={`Nome da equipe ${i + 1}`}
                    />
                    <input type="hidden" {...register(`teams.${i}.color`)} value={TEAM_COLORS[i % TEAM_COLORS.length]} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeTeam(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendTeam({ name: '', color: TEAM_COLORS[teamFields.length % TEAM_COLORS.length] })}
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar equipe
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={createChallenge.isPending}>
              {createChallenge.isPending ? 'Criando...' : 'Criar Desafio'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
