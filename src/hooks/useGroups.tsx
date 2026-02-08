import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { PLAN_LIMITS, PlanType } from '@/config/planLimits';

export interface Group {
  id: string;
  name: string;
  description: string;
  members: number;
  type: string;
  creator_id: string;
  created_at: string;
  isMember?: boolean;
}

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch all groups with member counts
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          type,
          creator_id,
          created_at
        `)
        .order('created_at');

      if (groupsError) throw groupsError;

      // Fetch member counts for each group
      const groupsWithCounts = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Check if current user is a member
          const { data: membership } = await supabase
            .from('group_members')
            .select('id')
            .eq('group_id', group.id)
            .eq('user_id', user?.id)
            .single();

          return {
            ...group,
            members: count || 0,
            isMember: !!membership
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchGroups();
    }
  }, [user, fetchGroups]);

  const createGroup = async (name: string, description: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      // Check group creation limits based on plan
      const { count: groupCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      const userPlan = (user.plan as PlanType) || 'free';
      const maxGroups = PLAN_LIMITS[userPlan].maxGroups;
      
      if (maxGroups !== null && groupCount !== null && groupCount >= maxGroups) {
        const upgradeText = userPlan === 'free' ? ' Faça upgrade para Basic ou Premium.' : userPlan === 'basic' ? ' Faça upgrade para Premium.' : '';
        return { 
          success: false, 
          error: `Limite de ${maxGroups} grupo(s) atingido.${upgradeText}` 
        };
      }
      // Check for duplicate group name
      const { data: existingGroup } = await supabase
        .from('groups')
        .select('id')
        .eq('name', name)
        .single();

      if (existingGroup) {
        return { success: false, error: 'Já existe um grupo com este nome' };
      }

      // Create the group
      const { data: newGroup, error: createError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          creator_id: user.id,
          type: 'custom'
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: user.id,
          is_admin: true
        });

      if (memberError) throw memberError;

      // Refresh groups list
      await fetchGroups();

      return { success: true, groupId: newGroup.id };
    } catch (error) {
      console.error('Error creating group:', error);
      return { success: false, error: 'Erro ao criar grupo. Tente novamente.' };
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    try {
      // Check if user is already a member
      const { data: existingMembership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (existingMembership) {
        return { success: false, error: 'Você já é membro deste grupo' };
      }

      // Check member limit for the group
      const { data: groupData } = await supabase
        .from('groups')
        .select('creator_id')
        .eq('id', groupId)
        .single();

      if (!groupData) {
        return { success: false, error: 'Grupo não encontrado' };
      }

      // Get creator's plan to determine member limit
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', groupData.creator_id)
        .single();

      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      const creatorPlan = (creatorProfile?.plan as PlanType) || 'free';
      const maxMembers = PLAN_LIMITS[creatorPlan].maxMembersPerGroup;
      
      if (maxMembers !== null && memberCount !== null && memberCount >= maxMembers) {
        return { 
          success: false, 
          error: `Este grupo atingiu o limite de ${maxMembers} membros.` 
        };
      }

      // Add user as member
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          is_admin: false
        });

      if (error) throw error;

      // Refresh groups list
      await fetchGroups();

      return { success: true };
    } catch (error) {
      console.error('Error joining group:', error);
      return { success: false, error: 'Erro ao entrar no grupo. Tente novamente.' };
    }
  };

  return {
    groups,
    loading,
    createGroup,
    joinGroup,
    refreshGroups: fetchGroups
  };
};
