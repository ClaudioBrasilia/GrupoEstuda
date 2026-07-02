import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarItems, useEquippedAvatar } from '@/hooks/useAvatarItems';

interface Props {
  userId?: string;
  name?: string;
  size?: 'sm' | 'lg';
}

export default function AvatarWithFrame({ userId, name, size = 'lg' }: Props) {
  const { data: items = [] } = useAvatarItems();
  const { data: equippedItemId } = useEquippedAvatar(userId);

  const equippedItem = items.find(i => i.id === equippedItemId);
  const dimension = size === 'lg' ? 'h-24 w-24' : 'h-10 w-10';
  const iconSize = size === 'lg' ? 'text-3xl -bottom-1 -right-1' : 'text-base -bottom-1 -right-1';

  return (
    <div className="relative inline-block">
      <Avatar className={dimension}>
        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
          {name?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      {equippedItem && (
        <span className={`absolute ${iconSize} drop-shadow`}>{equippedItem.icon}</span>
      )}
    </div>
  );
}
