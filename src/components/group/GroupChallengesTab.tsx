import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Clock, Users, ChevronRight, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useChallenges, Challenge } from '@/hooks/useChallenges';
import ChallengeCreateModal from './challenges/ChallengeCreateModal';
import ChallengeDetail from './challenges/ChallengeDetail';
import { useToast } from '@/hooks/use-toast';

interface Props {
  groupId: string;
  isAdmin: boolean;
  openChallenge?: { id: string; token: number } | null;
}

const METRIC_ICONS: Record<string, React.ReactNode> = {
  study_minutes: <Clock className="h-4 w-4" />,
  exercises_solved: <Flame className="h-4 w-4" />,
  pages_read: <Trophy className="h-4 w-4" />,
};

const METRIC_LABELS = {
  study_minutes: 'Minutos estudados',
  exercises_solved: 'Exercícios',
  pages_read: 'Páginas lidas',
};

function ChallengeCard({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {METRIC_ICONS[challenge.metric]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm truncate">{challenge.title}</h3>
              {challenge.status === 'active' && (
                <Badge className="text-xs bg-green-100 text-green-700 border-green-200">Ativo</Badge>
              )}
              {challenge.status === 'finished' && (
                <Badge variant="outline" className="text-xs">Encerrado</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{METRIC_LABELS[challenge.metric]}</p>
            {challenge.goal_value && (
              <p className="text-xs text-muted-foreground">Meta: {challenge.goal_value}</p>
            )}
            {challenge.ends_at && (
              <p className="text-xs text-muted-foreground">
                Prazo: {format(new Date(challenge.ends_at), "dd/MM HH:mm", { locale: ptBR })}
              </p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function GroupChallengesTab({ groupId, isAdmin, openChallenge }: Props) {
  const { challenges, isLoading, finishChallenge } = useChallenges(groupId);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (openChallenge?.id) {
      setSelectedId(openChallenge.id);
    }
  }, [openChallenge]);

  const handleFinish = async (challengeId: string) => {
    try {
      await finishChallenge.mutateAsync(challengeId);
      toast({ title: 'Desafio encerrado!', description: 'Badges concedidos aos participantes.' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    }
  };

  if (selectedId) {
    return (
      <ChallengeDetail
        challengeId={selectedId}
        onBack={() => setSelectedId(null)}
        isAdmin={isAdmin}
        onFinish={handleFinish}
      />
    );
  }

  const active = challenges.filter(c => c.status === 'active');
  const upcoming = challenges.filter(c => c.status === 'draft');
  const finished = challenges.filter(c => c.status === 'finished' || c.status === 'cancelled');

  return (
    <div className="space-y-4">
      <ChallengeCreateModal open={createOpen} onClose={() => setCreateOpen(false)} groupId={groupId} />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" /> Desafios
        </h2>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Criar desafio
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm text-center py-8">Carregando...</p>
      ) : challenges.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
          <p className="text-muted-foreground">Nenhum desafio ainda.</p>
          {isAdmin && (
            <Button variant="outline" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Criar primeiro desafio
            </Button>
          )}
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">
              Ativos {active.length > 0 && <span className="ml-1 bg-green-500 text-white rounded-full px-1.5 text-xs">{active.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="finished">Encerrados</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-2 mt-3">
            {[...upcoming, ...active].length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum desafio ativo.</p>
            ) : (
              [...upcoming, ...active].map(c => (
                <ChallengeCard key={c.id} challenge={c} onClick={() => setSelectedId(c.id)} />
              ))
            )}
          </TabsContent>

          <TabsContent value="finished" className="space-y-2 mt-3">
            {finished.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nenhum desafio encerrado.</p>
            ) : (
              finished.map(c => (
                <ChallengeCard key={c.id} challenge={c} onClick={() => setSelectedId(c.id)} />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
