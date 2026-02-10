
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Subject, GoalType, FileType, Message } from '@/types/groupTypes';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

// Mock data
const MOCK_SUBJECTS = [
  { id: 'portuguese', name: 'Português' },
  { id: 'math', name: 'Matemática' },
  { id: 'history', name: 'História' },
  { id: 'geography', name: 'Geografia' },
  { id: 'physics', name: 'Física' },
  { id: 'chemistry', name: 'Química' },
  { id: 'biology', name: 'Biologia' },
  { id: 'literature', name: 'Literatura' },
  { id: 'english', name: 'Inglês' },
  { id: 'essay', name: 'Redação' },
];

const VESTIBULAR_SUBJECTS = [...MOCK_SUBJECTS];

const MOCK_MEMBERS = [
  { id: '1', name: 'Alice Silva', isAdmin: true },
  { id: '2', name: 'Bruno Santos', isAdmin: false },
  { id: '3', name: 'Carlos Oliveira', isAdmin: false },
  { id: '4', name: 'Diana Pereira', isAdmin: false },
];

// Mock files
const MOCK_FILES = [
  { id: '1', name: 'Material de Matemática.pdf', size: '2.5 MB', uploadedBy: 'Alice Silva', uploadedAt: new Date(Date.now() - 86400000) },
  { id: '2', name: 'Resumo História.docx', size: '1.1 MB', uploadedBy: 'Bruno Santos', uploadedAt: new Date(Date.now() - 172800000) },
];

// Mock goals
const MOCK_GOALS = [
  { id: '1', subject: 'math', type: 'exercises' as const, target: 50, current: 25 },
  { id: '2', subject: 'portuguese', type: 'pages' as const, target: 100, current: 75 },
];

// Points configuration
const POINTS_CONFIG = {
  exercises: 5,  // 5 points per exercise
  pages: 1,      // 1 point per page
  time: 1        // 1 point per minute (already implemented in Timer.tsx)
};

export const useGroupData = (groupId: string | undefined) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [isVestibularGroup, setIsVestibularGroup] = useState(false);
  const [files, setFiles] = useState<FileType[]>([]);
  const [goals, setGoals] = useState<GoalType[]>([]);
  const [newGoalSubject, setNewGoalSubject] = useState('');
  const [newGoalType, setNewGoalType] = useState<'exercises' | 'pages' | 'time'>('exercises');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  const [addVestibularDialogOpen, setAddVestibularDialogOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [userPoints, setUserPoints] = useState<number>(0);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState<string>('');

  useEffect(() => {
    if (!groupId || !user) return;
    
    fetchGroupData();
    
    // Set up real-time subscription for messages
    const channel = supabase
      .channel(`group-${groupId}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          // Fetch the author's profile name
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage = {
            id: payload.new.id,
            userId: payload.new.user_id,
            userName: profile?.name || 'Unknown User',
            text: payload.new.content,
            timestamp: new Date(payload.new.created_at)
          };

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user]);

  const fetchGroupData = async () => {
    if (!groupId || !user) return;
    
    setLoading(true);
    try {
      // Fetch group information
      const { data: groupData } = await supabase
        .from('groups')
        .select('name, type')
        .eq('id', groupId)
        .single();
      
      setGroupName(groupData?.name || '');
      
      // Fetch group membership and admin status
      const { data: membership } = await supabase
        .from('group_members')
        .select('is_admin')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();
      
      setCurrentUserIsAdmin(membership?.is_admin || false);
      
      // Fetch all group members
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select(`
          user_id,
          is_admin
        `)
        .eq('group_id', groupId);
      
      // Get profile names for members
      const memberIds = groupMembers?.map(m => m.user_id) || [];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', memberIds);
      
      const formattedMembers = groupMembers?.map(member => ({
        id: member.user_id,
        name: profilesData?.find(p => p.id === member.user_id)?.name || 'Unknown User',
        isAdmin: member.is_admin
      })) || [];
      
      setMembers(formattedMembers);
      
      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('group_id', groupId)
        .order('name');
      
      const formattedSubjects = subjectsData?.map(subj => ({
        id: subj.id,
        name: subj.name
      })) || [];
      
      setSubjects(formattedSubjects);
      
      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at');
      
      const formattedGoals = goalsData?.map(goal => ({
        id: goal.id,
        subject: goal.subject_id || '',
        type: goal.type as 'exercises' | 'pages' | 'time',
        target: goal.target,
        current: goal.current
      })) || [];
      
      setGoals(formattedGoals);
      
      // Fetch messages
      const { data: messagesData } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .eq('group_id', groupId)
        .order('created_at');
      
      // Get profile names for message authors
      const authorIds = messagesData?.map(m => m.user_id) || [];
      const { data: authorProfiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', authorIds);
      
      const formattedMessages = messagesData?.map(msg => ({
        id: msg.id,
        userId: msg.user_id,
        userName: authorProfiles?.find(p => p.id === msg.user_id)?.name || 'Unknown User',
        text: msg.content,
        timestamp: new Date(msg.created_at)
      })) || [];
      
      setMessages(formattedMessages);
      
      // Fetch user points for this group
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();
      
      setUserPoints(pointsData?.points || 0);
      
    } catch (error) {
      console.error('Error fetching group data:', error);
      toast.error('Erro ao carregar dados do grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSubject.trim() || !groupId || !user || !currentUserIsAdmin) return;
    
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          name: newSubject,
          group_id: groupId
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newSubjectObj = {
        id: data.id,
        name: data.name
      };
      
      setSubjects([...subjects, newSubjectObj]);
      setNewSubject('');
      
      toast.success('Matéria adicionada com sucesso');
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Erro ao adicionar matéria');
    }
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjectToDelete(subjectId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteSubject = async () => {
    if (!subjectToDelete || !currentUserIsAdmin) return;
    
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectToDelete);
      
      if (error) throw error;
      
      const updatedSubjects = subjects.filter(subject => subject.id !== subjectToDelete);
      setSubjects(updatedSubjects);
      setDeleteConfirmOpen(false);
      setSubjectToDelete(null);
      
      toast.success('Matéria excluída com sucesso');
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Erro ao excluir matéria');
    }
  };

  const handleAddVestibularModule = async () => {
    if (!groupId || !user || !currentUserIsAdmin) return;
    
    try {
      const vestibularSubjects = [
        'Português', 'Matemática', 'História', 'Geografia', 'Física', 
        'Química', 'Biologia', 'Literatura', 'Inglês', 'Redação'
      ];
      
      const existingNames = subjects.map(s => s.name);
      const newSubjects = vestibularSubjects.filter(name => !existingNames.includes(name));
      
      if (newSubjects.length === 0) {
        toast.info('Todas as matérias do vestibular já foram adicionadas');
        return;
      }
      
      const subjectsToInsert = newSubjects.map(name => ({
        name,
        group_id: groupId
      }));
      
      const { data, error } = await supabase
        .from('subjects')
        .insert(subjectsToInsert)
        .select();
      
      if (error) throw error;
      
      const newSubjectObjs = data.map(subj => ({
        id: subj.id,
        name: subj.name
      }));
      
      setSubjects([...subjects, ...newSubjectObjs]);
      setAddVestibularDialogOpen(false);
      
      toast.success('Módulo Vestibular adicionado com sucesso');
    } catch (error) {
      console.error('Error adding vestibular module:', error);
      toast.error('Erro ao adicionar módulo vestibular');
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newGoalSubject || !newGoalType || !newGoalTarget || !groupId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          group_id: groupId,
          subject_id: newGoalSubject,
          type: newGoalType,
          target: parseInt(newGoalTarget),
          current: 0,
          created_by: user.id
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const newGoal: GoalType = {
        id: data.id,
        subject: data.subject_id || '',
        type: data.type as 'exercises' | 'pages' | 'time',
        target: data.target,
        current: data.current
      };
      
      setGoals([...goals, newGoal]);
      setNewGoalSubject('');
      setNewGoalType('exercises');
      setNewGoalTarget('');
      
      toast.success('Meta adicionada com sucesso');
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('Erro ao adicionar meta');
    }
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    const goalToUpdate = goals.find(g => g.id === goalId);
    if (!goalToUpdate || !groupId || !user) return;
    
    // Validate progress input
    if (progress <= 0) {
      toast.error('O progresso deve ser maior que zero');
      return;
    }
    
    // Calculate points based on the goal type and progress
    let pointsEarned = 0;
    if (goalToUpdate.type === 'exercises') {
      pointsEarned = progress * POINTS_CONFIG.exercises;
    } else if (goalToUpdate.type === 'pages') {
      pointsEarned = progress * POINTS_CONFIG.pages;
    } else if (goalToUpdate.type === 'time') {
      pointsEarned = progress * POINTS_CONFIG.time;
    }
    
    const newCurrent = Math.min(goalToUpdate.current + progress, goalToUpdate.target);
    const actualProgress = newCurrent - goalToUpdate.current;
    const actualPoints = Math.floor((actualProgress / progress) * pointsEarned);
    
    try {
      // Update goal progress with timestamp
      const { error: goalError } = await supabase
        .from('goals')
        .update({ 
          current: newCurrent,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
      
      if (goalError) throw goalError;
      
      // Get current points and add new points
      const { data: currentPointsData } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id)
        .eq('group_id', groupId)
        .single();
      
      const currentPoints = currentPointsData?.points || 0;
      const newTotalPoints = currentPoints + actualPoints;
      
      // Update user points
      const { error: pointsError } = await supabase
        .from('user_points')
        .upsert({
          user_id: user.id,
          group_id: groupId,
          points: newTotalPoints,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,group_id'
        });
      
      if (pointsError) throw pointsError;
      
      // Update local state
      const updatedGoals = goals.map(goal => {
        if (goal.id === goalId) {
          return { ...goal, current: newCurrent };
        }
        return goal;
      });
      
      setGoals(updatedGoals);
      setUserPoints(newTotalPoints);
      
      const goalType = goalToUpdate.type === 'exercises' ? 'exercícios' : 
                        goalToUpdate.type === 'pages' ? 'páginas' : 'minutos';
      
      toast.success(`Progresso atualizado! +${actualPoints} pontos por ${actualProgress} ${goalType}.`);
      
      // Check if goal is completed
      if (newCurrent >= goalToUpdate.target) {
        toast.success(`🎉 Meta concluída! Parabéns!`, { duration: 5000 });
      }
      
      // Call automatic update function to sync with study sessions
      if (goalToUpdate.type === 'time') {
        await supabase.functions.invoke('auto-update-goals');
      }
      
    } catch (error) {
      console.error('Error updating goal progress:', error);
      toast.error('Erro ao atualizar progresso da meta');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!currentUserIsAdmin || !groupId) {
      toast.error('Apenas administradores podem excluir metas');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);
      
      if (error) throw error;
      
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      setGoals(updatedGoals);
      
      toast.success('Meta excluída com sucesso');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Erro ao excluir meta');
    }
  };

  const handleIncreaseGoalTarget = async (goalId: string, additionalTarget: number) => {
    if (!currentUserIsAdmin || !groupId) {
      toast.error('Apenas administradores podem modificar metas');
      return;
    }
    
    const goalToUpdate = goals.find(g => g.id === goalId);
    if (!goalToUpdate) return;
    
    if (additionalTarget <= 0) {
      toast.error('O valor adicional deve ser maior que zero');
      return;
    }
    
    const newTarget = goalToUpdate.target + additionalTarget;
    
    try {
      const { error } = await supabase
        .from('goals')
        .update({ 
          target: newTarget,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
      
      if (error) throw error;
      
      const updatedGoals = goals.map(goal => {
        if (goal.id === goalId) {
          return { ...goal, target: newTarget };
        }
        return goal;
      });
      
      setGoals(updatedGoals);
      
      const goalType = goalToUpdate.type === 'exercises' ? 'exercícios' : 
                        goalToUpdate.type === 'pages' ? 'páginas' : 'minutos';
      
      toast.success(`Meta aumentada! Novo alvo: ${newTarget} ${goalType}`);
    } catch (error) {
      console.error('Error increasing goal target:', error);
      toast.error('Erro ao aumentar meta');
    }
  };

  const handleFileUpload = () => {
    if (!newFile) return;
    
    const fileObj: FileType = {
      id: Date.now().toString(),
      name: newFile.name,
      size: `${(newFile.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: user?.name || 'Usuário',
      uploadedAt: new Date()
    };
    
    setFiles([fileObj, ...files]);
    setNewFile(null);
    setUploadDialogOpen(false);
    
    toast.success('Arquivo enviado com sucesso');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewFile(e.target.files[0]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || !user || !groupId) return;
    
    try {
      // Validate message length
      if (messageText.length > 1000) {
        toast.error('Mensagem muito longa. Máximo 1000 caracteres.');
        return;
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content: messageText.trim()
        })
        .select(`
          id,
          content,
          created_at,
          user_id
        `)
        .single();
      
      if (error) throw error;
      
      // Don't add to local state since real-time subscription will handle it
      setMessageText('');
      
      toast.success('Mensagem enviada com sucesso');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleDownloadFile = (fileId: string) => {
    toast.success('Download iniciado');
  };

  const getSubjectNameById = (id: string) => {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : id;
  };

  return {
    subjects,
    setSubjects,
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
    subjectToDelete,
    addVestibularDialogOpen,
    setAddVestibularDialogOpen,
    messages,
    messageText,
    setMessageText,
    members,
    loading,
    userPoints,
    groupName,
    handleAddSubject,
    handleDeleteSubject,
    confirmDeleteSubject,
    handleAddVestibularModule,
    handleAddGoal,
    updateGoalProgress,
    handleDeleteGoal,
    handleIncreaseGoalTarget,
    handleFileUpload,
    handleFileChange,
    handleSendMessage,
    handleDownloadFile,
    getSubjectNameById
  };
};
