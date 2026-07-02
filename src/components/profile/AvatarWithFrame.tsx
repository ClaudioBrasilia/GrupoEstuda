import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarItems, useEquippedAvatar } from '@/hooks/useAvatarItems';
import AvatarItemIcon from './AvatarItemIcon';

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
  const iconDimension = size === 'lg' ? 'h-10 w-10 -bottom-1 -right-1' : 'h-5 w-5 -bottom-1 -right-1';

  return (
    <div className="relative inline-block">
      <Avatar className={dimension}>
        <AvatarFallback className="bg-primary text-primary-foreground text-xl">
          {name?.charAt(0)?.toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>
      {equippedItem && (
        <AvatarItemIcon name={equippedItem.name} className={`absolute ${iconDimension} drop-shadow-lg`} />
      )}
    </div>
  );
}
