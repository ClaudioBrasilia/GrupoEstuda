import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface Invitation {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_email: string;
  invitee_id: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  expires_at: string;
  groups?: {
    name: string;
    description: string | null;
  };
}

interface SearchedUser {
  id: string;
  name: string;
  email: string;
}

export const useGroupInvitations = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchPendingInvitations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select(`
          *,
          groups:group_id (
            name,
            description
          )
        `)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setInvitations((data as any) || []);
      setPendingCount(data?.length || 0);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
    }
  };

  useEffect(() => {
    fetchPendingInvitations();

    // Subscribe to changes in invitations
    const channel = supabase
      .channel('invitations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_invitations',
        },
        () => {
          fetchPendingInvitations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const searchUsersByName = async (searchTerm: string): Promise<SearchedUser[]> => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    setSearchLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', `%${searchTerm.trim()}%`)
        .limit(10);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        return [];
      }

      const usersWithEmails = await Promise.all(
        profiles.map(async (profile) => {
          const { data: email } = await supabase.rpc('get_user_email', {
            user_uuid: profile.id,
          });

          return {
            id: profile.id,
            name: profile.name,
            email: email || '',
          };
        })
      );

      return usersWithEmails.filter((u) => u.email);
    } catch (error: any) {
      console.error('Error searching users:', error);
      return [];
    } finally {
      setSearchLoading(false);
    }
  };

  const sendInvitation = async (
    groupId: string,
    email: string,
    userId?: string
  ) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return { error: 'Not authenticated' };
    }

    setLoading(true);
    try {
      let targetEmail = email;

      if (userId) {
        const { data: userEmail } = await supabase.rpc('get_user_email', {
          user_uuid: userId,
        });
        if (userEmail) {
          targetEmail = userEmail;
        }
      }

      const { data: invitationData, error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          inviter_id: user.id,
          invitee_email: targetEmail.toLowerCase(),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('Este usuário já foi convidado para este grupo');
        } else {
          throw error;
        }
        return { error };
      }

      // Create notification for the invitee if they have an account
      if (userId && invitationData) {
        const { data: groupData } = await supabase
          .from('groups')
          .select('name')
          .eq('id', groupId)
          .single();

        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'invitation',
          title: '📬 Novo convite de grupo',
          message: `Você foi convidado para ${groupData?.name || 'um grupo de estudo'}`,
          link: '/invitations'
        });
      }

      toast.success('Convite enviado com sucesso!');
      return { error: null };
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error('Erro ao enviar convite');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const getGroupInvitations = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('group_id', groupId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Error fetching group invitations:', error);
      return { data: [], error };
    }
  };

  const acceptInvitation = async (invitationId: string, groupId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return { error: 'Not authenticated' };
    }

    setLoading(true);
    try {
      // Update invitation status
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted', invitee_id: user.id })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      // Add user to group_members
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          is_admin: false,
        });

      if (memberError) {
        if (memberError.code === '23505') {
          toast.info('Você já é membro deste grupo');
        } else {
          throw memberError;
        }
      } else {
        toast.success('Você entrou no grupo!');
      }

      await fetchPendingInvitations();
      return { error: null };
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      toast.error('Erro ao aceitar convite');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const rejectInvitation = async (invitationId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return { error: 'Not authenticated' };
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'rejected', invitee_id: user.id })
        .eq('id', invitationId);

      if (error) throw error;

      toast.success('Convite rejeitado');
      await fetchPendingInvitations();
      return { error: null };
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      toast.error('Erro ao rejeitar convite');
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    invitations,
    pendingCount,
    loading,
    searchLoading,
    sendInvitation,
    searchUsersByName,
    getGroupInvitations,
    acceptInvitation,
    rejectInvitation,
    refreshInvitations: fetchPendingInvitations,
  };
};
