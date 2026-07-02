import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AvatarItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  requirement_label: string;
}

export interface UserAvatarItem {
  user_id: string;
  item_id: string;
  unlocked_at: string;
}

export function useAvatarItems() {
  return useQuery({
    queryKey: ['avatar-items'],
    queryFn: async () => {
      const { data, error } = await supabase.from('avatar_items').select('*').order('created_at');
      if (error) throw error;
      return data as AvatarItem[];
    },
  });
}

export function useUserAvatarItems(userId?: string) {
  return useQuery({
    queryKey: ['user-avatar-items', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_avatar_items')
        .select('*')
        .eq('user_id', userId!);
      if (error) throw error;
      return data as UserAvatarItem[];
    },
    enabled: !!userId,
  });
}

export function useEquippedAvatar(userId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['equipped-avatar', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_avatar')
        .select('equipped_item_id')
        .eq('user_id', userId!)
        .maybeSingle();
      if (error) throw error;
      return data?.equipped_item_id as string | null;
    },
    enabled: !!userId,
  });

  const equip = useMutation({
    mutationFn: async (itemId: string | null) => {
      const { error } = await supabase
        .from('user_avatar')
        .upsert({ user_id: userId!, equipped_item_id: itemId, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipped-avatar', userId] }),
  });

  return { ...query, equip };
}
