import React from 'react';
import { Trophy, Medal, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useChallengeBadges, ChallengeBadge } from '@/hooks/useChallenges';

interface Props {
  userId?: string;
}

const KIND_CONFIG = {
  winner: {
    icon: <Trophy className="h-6 w-6 text-yellow-500" />,
    bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    label: '1º lugar',
  },
  top3: {
    icon: <Medal className="h-6 w-6 text-blue-500" />,
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    label: 'Top 3',
  },
  finisher: {
    icon: <Star className="h-6 w-6 text-purple-500" />,
    bg: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    label: 'Finalista',
  },
};

function BadgeItem({ badge }: { badge: ChallengeBadge }) {
  const config = KIND_CONFIG[badge.kind];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${config.bg} cursor-default`}>
            {config.icon}
            <span className="text-xs font-medium">{config.label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-semibold">{badge.challenges?.title || 'Desafio'}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(badge.awarded_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function ChallengeBadges({ userId }: Props) {
  const { data: badges = [], isLoading } = useChallengeBadges(userId);

  if (isLoading) return null;
  if (badges.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" /> Troféus de Desafios
          <span className="text-muted-foreground font-normal text-sm">({badges.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {badges.map(badge => (
            <BadgeItem key={badge.id} badge={badge} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
