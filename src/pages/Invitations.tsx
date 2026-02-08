import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { InvitationsList } from '@/components/invitations/InvitationsList';
import { useTranslation } from 'react-i18next';

const Invitations: React.FC = () => {
  const { t } = useTranslation();

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Convites</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus convites para grupos de estudo
          </p>
        </div>

        <InvitationsList />
      </div>
    </PageLayout>
  );
};

export default Invitations;
