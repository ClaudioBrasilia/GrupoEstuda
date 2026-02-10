
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Member } from '@/types/groupTypes';
import { useTranslation } from 'react-i18next';
import { InvitationDialog } from '@/components/invitations/InvitationDialog';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { supabase } from '@/integrations/supabase/client';

interface GroupMembersTabProps {
  members: Member[];
  groupId: string;
  isAdmin?: boolean;
}

const GroupMembersTab: React.FC<GroupMembersTabProps> = ({ members, groupId, isAdmin = false }) => {
  const { t } = useTranslation();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [memberPlans, setMemberPlans] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchMemberPlans();
  }, [members]);

  const fetchMemberPlans = async () => {
    const memberIds = members.map(m => m.id);
    if (memberIds.length === 0) return;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, plan')
      .in('id', memberIds);

    if (profiles) {
      const plans: Record<string, string> = {};
      profiles.forEach(p => {
        plans[p.id] = p.plan;
      });
      setMemberPlans(plans);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{t('group.members')} ({members.length})</h3>
        {isAdmin && (
          <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
            {t('group.inviteMember')}
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {members.map((member) => (
          <div key={member.id} className="card p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span>{member.name}</span>
                {memberPlans[member.id] === 'premium' && (
                  <PremiumBadge size="sm" />
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {member.isAdmin && (
                <Badge>{t('group.admin')}</Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      <InvitationDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        groupId={groupId}
      />
    </div>
  );
};

export default GroupMembersTab;
