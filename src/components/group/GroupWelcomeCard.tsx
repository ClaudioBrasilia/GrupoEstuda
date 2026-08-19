import React, { useState } from 'react';
import { X, Sparkles, Trophy, Target, MessageCircle, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  groupId: string;
  groupName?: string;
}

export default function GroupWelcomeCard({ groupId, groupName }: Props) {
  const storageKey = `welcome_seen_${groupId}`;

  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });

  if (dismissed) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // localStorage indisponível (modo privado, etc.) — só não persiste entre sessões
    }
    setDismissed(true);
  };

  return (
    <Card className="mb-6 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent relative">
      <CardContent className="p-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-7 w-7"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2 mb-2 pr-8">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-base">
            Bem-vindo{groupName ? ` ao ${groupName}` : ''}! 🎉
          </h3>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Aqui vai um resumo rápido do que você pode fazer por aqui:
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Poste suas atividades de estudo e ganhe pontos</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Participe dos desafios ativos do grupo</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Defina metas de estudo na aba Metas</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
            <span>Converse com o grupo na aba Mensagens</span>
          </div>
        </div>

        <Button size="sm" className="mt-4 w-full" onClick={handleDismiss}>
          Entendi, vamos lá!
        </Button>
      </CardContent>
    </Card>
  );
}
