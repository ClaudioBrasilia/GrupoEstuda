import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useGroups } from '@/hooks/useGroups';
import { GlobalActivityFeed } from '@/components/group/GlobalActivityFeed';
import { FloatingActionButton } from '@/components/group/FloatingActionButton';
import { CreateActivityDialog } from '@/components/group/CreateActivityDialog';

const Feed: React.FC = () => {
  const { groups } = useGroups();
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  return (
    <PageLayout>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">🔥 Atividades Recentes</h2>
        <GlobalActivityFeed />
      </div>

      {/* Floating Action Button */}
      <FloatingActionButton onClick={() => setIsActivityDialogOpen(true)} />

      {/* Create Activity Dialog */}
      <CreateActivityDialog
        open={isActivityDialogOpen}
        onOpenChange={setIsActivityDialogOpen}
        userGroups={groups
          .filter(g => g.isMember)
          .map(g => ({ id: g.id, name: g.name }))}
      />
    </PageLayout>
  );
};

export default Feed;
