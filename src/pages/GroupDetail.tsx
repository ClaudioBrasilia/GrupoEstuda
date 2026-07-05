import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PageLayout from '@/components/layout/PageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGroupData } from '@/hooks/useGroupData';
import { useAuth } from '@/context/AuthContext';

// Group tab components
import GroupOverviewTab from '@/components/group/GroupOverviewTab';
import GroupSubjectsTab from '@/components/group/GroupSubjectsTab';
import GroupMembersTab from '@/components/group/GroupMembersTab';
import GroupMessagesTab from '@/components/group/GroupMessagesTab';
import GroupFilesTab from '@/components/group/GroupFilesTab';
import GroupGoalsTab from '@/components/group/GroupGoalsTab';
import GroupChallengesTab from '@/components/group/GroupChallengesTab';
import GroupWelcomeCard from '@/components/group/GroupWelcomeCard';
import { useChallenges } from '@/hooks/useChallenges';

const GroupDetail: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [openChallenge, setOpenChallenge] = useState<{ id: string; token: number } | null>(null);
  const { challenges } = useChallenges(groupId || '');

  const seenKey = `seen_challenges_${groupId || ''}`;
  const [seenChallengeIds, setSeenChallengeIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(seenKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const activeChallengesCount = challenges.filter(
    c => c.status === 'active' && !seenChallengeIds.includes(c.id)
  ).length;

  // Marca os desafios ativos como vistos assim que o usuário abre a aba Desafios,
  // fazendo a badge vermelha sumir.
  useEffect(() => {
    if (activeTab !== 'challenges') return;
    const activeIds = challenges.filter(c => c.status === 'active').map(c => c.id);
    if (activeIds.length === 0) return;
    setSeenChallengeIds(prev => {
      const merged = Array.from(new Set([...prev, ...activeIds]));
      try {
        localStorage.setItem(seenKey, JSON.stringify(merged));
      } catch {
        // localStorage indisponível (modo privado, etc.) — segue sem persistir
      }
      return merged;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, challenges]);

  // Abre direto o desafio quando o usuário vem do banner da tela de Grupos (?challenge=ID)
  useEffect(() => {
    const challengeId = searchParams.get('challenge');
    if (challengeId) {
      setOpenChallenge({ id: challengeId, token: Date.now() });
      setActiveTab('challenges');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const {
    subjects,
    newSubject,
    setNewSubject,
    files,
    goals,
    newGoalSubject,
    setNewGoalSubject,
    newGoalType,
    setNewGoalType,
    newGoalTarget,
    setNewGoalTarget,
    uploadDialogOpen,
    setUploadDialogOpen,
    newFile,
    currentUserIsAdmin,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    addVestibularDialogOpen,
    setAddVestibularDialogOpen,
    messages,
    messageText,
    setMessageText,
    members,
    userPoints,
    groupName,
    handleAddSubject,
    handleDeleteSubject,
    confirmDeleteSubject,
    handleAddVestibularModule,
    handleAddGoal,
    updateGoalProgress,
    handleFileUpload,
    handleFileChange,
    handleSendMessage,
    handleDownloadFile,
    getSubjectNameById,
    handleDeleteGoal,
    handleIncreaseGoalTarget
  } = useGroupData(groupId);

  return (
    <PageLayout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-study-primary">
            {groupName || `Grupo ${groupId}`}
          </h1>
          <div className="flex items-center">
            <div className="bg-study-primary text-white px-3 py-1 rounded-full text-sm font-medium">
              {userPoints} pontos
            </div>
          </div>
        </div>
      </div>

      <GroupWelcomeCard groupId={groupId || ''} groupName={groupName} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto mb-6 flex flex-wrap gap-2 justify-start">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="subjects">Matérias</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="challenges" className="relative">
            Desafios
            {activeChallengesCount > 0 && (
              <span className="ml-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {activeChallengesCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <GroupOverviewTab
            goals={goals}
            getSubjectNameById={getSubjectNameById}
            onViewAllGoals={() => setActiveTab('goals')}
            groupId={groupId || ''}
          />
        </TabsContent>
        
        <TabsContent value="subjects">
          <GroupSubjectsTab
            subjects={subjects}
            currentUserIsAdmin={currentUserIsAdmin}
            newSubject={newSubject}
            setNewSubject={setNewSubject}
            deleteConfirmOpen={deleteConfirmOpen}
            setDeleteConfirmOpen={setDeleteConfirmOpen}
            addVestibularDialogOpen={addVestibularDialogOpen}
            setAddVestibularDialogOpen={setAddVestibularDialogOpen}
            handleAddSubject={handleAddSubject}
            handleDeleteSubject={handleDeleteSubject}
            confirmDeleteSubject={confirmDeleteSubject}
            handleAddVestibularModule={handleAddVestibularModule}
          />
        </TabsContent>
        
        <TabsContent value="members">
          <GroupMembersTab
            members={members}
            groupId={groupId || ''}
            isAdmin={currentUserIsAdmin}
          />
        </TabsContent>
        
        <TabsContent value="messages">
          <GroupMessagesTab
            messages={messages}
            messageText={messageText}
            setMessageText={setMessageText}
            handleSendMessage={handleSendMessage}
            currentUserId={user?.id}
          />
        </TabsContent>

        <TabsContent value="files">
          <GroupFilesTab groupId={groupId} />
        </TabsContent>

        <TabsContent value="goals">
          <GroupGoalsTab
            goals={goals}
            subjects={subjects}
            isAdmin={currentUserIsAdmin}
            newGoalSubject={newGoalSubject}
            setNewGoalSubject={setNewGoalSubject}
            newGoalType={newGoalType}
            setNewGoalType={setNewGoalType}
            newGoalTarget={newGoalTarget}
            setNewGoalTarget={setNewGoalTarget}
            handleAddGoal={handleAddGoal}
            getSubjectNameById={getSubjectNameById}
            updateGoalProgress={updateGoalProgress}
            handleDeleteGoal={handleDeleteGoal}
            handleIncreaseGoalTarget={handleIncreaseGoalTarget}
          />
        </TabsContent>
        <TabsContent value="challenges">
          <GroupChallengesTab groupId={groupId || ''} isAdmin={currentUserIsAdmin} openChallenge={openChallenge} />
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
};

export default GroupDetail;
