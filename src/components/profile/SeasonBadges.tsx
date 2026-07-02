import React from 'react';
import { Crown, Medal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSeasonBadges, SeasonBadge } from '@/hooks/useSeasons';

interface Props {
  userId?: string;
}

const KIND_CONFIG = {
  champion: {
    icon: <Crown className="h-6 w-6 text-yellow-500" />,
    bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
    label: 'Campeão',
  },
  top3: {
    icon: <Medal className="h-6 w-6 text-blue-500" />,
    bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    label: 'Pódio',
  },
};

function BadgeItem({ badge }: { badge: SeasonBadge }) {
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
          <p className="font-semibold">{badge.seasons?.title || 'Temporada'}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(badge.awarded_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function SeasonBadges({ userId }: Props) {
  const { data: badges = [], isLoading } = useSeasonBadges(userId);

  if (isLoading || badges.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="h-4 w-4 text-yellow-500" /> Temporadas
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
