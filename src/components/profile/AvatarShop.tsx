import React from 'react';
import { Lock, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAvatarItems, useUserAvatarItems, useEquippedAvatar } from '@/hooks/useAvatarItems';
import { useToast } from '@/hooks/use-toast';
import AvatarItemIcon from './AvatarItemIcon';
import { getErrorMessage } from '@/lib/utils';

interface Props {
  userId?: string;
}

export default function AvatarShop({ userId }: Props) {
  const { data: items = [], isLoading } = useAvatarItems();
  const { data: owned = [] } = useUserAvatarItems(userId);
  const { data: equippedItemId, equip } = useEquippedAvatar(userId);
  const { toast } = useToast();

  if (isLoading || items.length === 0) return null;

  const ownedIds = new Set(owned.map(o => o.item_id));

  const handleToggle = async (itemId: string, isOwned: boolean) => {
    if (!isOwned) return;
    try {
      await equip.mutateAsync(equippedItemId === itemId ? null : itemId);
    } catch (err) {
      toast({ title: 'Erro', description: getErrorMessage(err), variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Loja de Avatares
          <span className="text-muted-foreground font-normal text-sm">({ownedIds.size}/{items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map(item => {
            const isOwned = ownedIds.has(item.id);
            const isEquipped = equippedItemId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleToggle(item.id, isOwned)}
                disabled={!isOwned || equip.isPending}
                className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  isEquipped
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : isOwned
                    ? 'border-border hover:bg-muted/50 cursor-pointer'
                    : 'border-border opacity-50 cursor-not-allowed'
                }`}
              >
                {isEquipped && (
                  <span className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                {!isOwned && (
                  <span className="absolute top-1 right-1 text-muted-foreground">
                    <Lock className="h-3 w-3" />
                  </span>
                )}
                <AvatarItemIcon name={item.name} className={`h-10 w-10 ${!isOwned ? 'grayscale' : ''}`} />
                <span className="text-xs font-medium text-center">{item.name}</span>
                {!isOwned && (
                  <span className="text-[10px] text-muted-foreground text-center">{item.requirement_label}</span>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
