import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useChallenges, ChallengeMetric, ChallengeMode } from '@/hooks/useChallenges';
import { useToast } from '@/hooks/use-toast';
import { getErrorMessage } from '@/lib/utils';

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

  const { fields: teamFields, append: appendTeam, remove: removeTeam } = useFieldArray({
    control,
    name: 'teams',
  });

  const mode = watch('mode');

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
      onClose();
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Desafio</DialogTitle>
        </DialogHeader>

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

          {(mode === 'first_to_goal' || mode === 'teams') && (
            <div>
              <Label>Meta (valor a atingir)</Label>
              <Input type="number" min={1} {...register('goal_value')} placeholder="Ex: 120 (minutos)" />
            </div>
          )}

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
