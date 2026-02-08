import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGroupInvitations } from '@/hooks/useGroupInvitations';
import { useNavigate } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const InvitationsList: React.FC = () => {
  const { invitations, loading, acceptInvitation, rejectInvitation } = useGroupInvitations();
  const navigate = useNavigate();

  const handleAccept = async (invitationId: string, groupId: string) => {
    const { error } = await acceptInvitation(invitationId, groupId);
    if (!error) {
      navigate(`/group/${groupId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            Você não tem convites pendentes no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => (
        <Card key={invitation.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">
                  {invitation.groups?.name || 'Grupo'}
                </CardTitle>
                {invitation.groups?.description && (
                  <CardDescription className="mt-1">
                    {invitation.groups.description}
                  </CardDescription>
                )}
              </div>
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(invitation.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                onClick={() => handleAccept(invitation.id, invitation.group_id)}
                className="flex-1"
                disabled={loading}
              >
                Aceitar
              </Button>
              <Button
                variant="outline"
                onClick={() => rejectInvitation(invitation.id)}
                className="flex-1"
                disabled={loading}
              >
                Recusar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
