import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, User, Users, Crown, AlertCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useGroups } from '@/hooks/useGroups';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GlobalActivityFeed } from '@/components/group/GlobalActivityFeed';
import { FloatingActionButton } from '@/components/group/FloatingActionButton';
import { CreateActivityDialog } from '@/components/group/CreateActivityDialog';

// Fixed group ID for Vestibular Brasil
const VESTIBULAR_GROUP_ID = 'b47ac10b-58cc-4372-a567-0e02b2c3d479';

// Schema validation for group creation
const createGroupSchema = z.object({
  name: z.string()
    .min(3, 'Nome do grupo deve ter pelo menos 3 caracteres')
    .max(50, 'Nome do grupo não pode ter mais de 50 caracteres'),
  description: z.string()
    .max(200, 'Descrição não pode ter mais de 200 caracteres')
    .optional()
});

type CreateGroupFormValues = z.infer<typeof createGroupSchema>;

const CreateGroupForm: React.FC<{ onCreateGroup: (name: string, description: string) => Promise<void> }> = ({ onCreateGroup }) => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateGroupFormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const onSubmit = async (data: CreateGroupFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    
    try {
      await onCreateGroup(data.name, data.description || '');
      form.reset();
    } catch (error: any) {
      setErrorMessage(error.message || 'Erro ao criar grupo. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Grupo</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Digite o nome do grupo" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Descreva seu grupo de estudo" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full bg-study-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Criando...' : 'Criar Grupo'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

const Groups: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, loading, createGroup, joinGroup } = useGroups();
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  const handleCreateGroup = async (name: string, description: string) => {
    const result = await createGroup(name, description);
    
    if (result.success) {
      setOpen(false);
      navigate(`/group/${result.groupId}`);
      toast.success('Grupo criado com sucesso!');
    } else {
      if (result.error === 'Criar grupos requer uma assinatura paga') {
        setOpen(false);
        navigate('/plans');
        toast.error(result.error);
      } else {
        throw new Error(result.error);
      }
    }
  };

  const handleGroupClick = async (group: any) => {
    // Premium gating for premium groups
    if (group.isPremium && user?.plan !== 'premium') {
      toast.error('Este é um grupo exclusivo para usuários Premium');
      navigate('/plans');
      return;
    }

    // Special case: Vestibular Brasil group (premium-only join allowed)
    if (group.id === VESTIBULAR_GROUP_ID) {
      if (user?.plan !== 'premium') {
        toast.error('Este é um grupo exclusivo para usuários Premium');
        navigate('/plans');
        return;
      }
      if (!group.isMember) {
        const result = await joinGroup(group.id);
        if (result.success) {
          toast.success('Você entrou no grupo!');
        } else {
          toast.error(result.error);
          return;
        }
      }
      navigate(`/group/${group.id}`);
      return;
    }

    // Other groups: only allow access if already a member
    if (!group.isMember) {
      toast.error('Você não faz parte deste grupo');
      return;
    }

    navigate(`/group/${group.id}`);
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-study-primary mx-auto mb-2"></div>
            <p className="text-gray-500">Carregando grupos...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Input 
            type="text" 
            placeholder={t('groups.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        </div>
        
        <div className="flex gap-2">
          {/* Botão Criar Teste IA - COM GATE PREMIUM */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => {
                    if (user?.plan !== 'premium') {
                      toast.error('Recurso exclusivo para usuários Premium');
                      navigate('/plans');
                      return;
                    }
                    navigate('/generate-test');
                  }}
                  variant="outline"
                  className="flex items-center gap-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-950"
                >
                  <FileText size={18} />
                  <span>Criar Teste IA</span>
                  <Crown size={14} className="text-yellow-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Gere testes personalizados com Inteligência Artificial</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">🔒 Exclusivo Premium</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Botão Criar Grupo */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-study-primary flex items-center gap-2">
                <Plus size={18} />
                <span>Criar Grupo</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('groups.create')}</DialogTitle>
              </DialogHeader>
              <CreateGroupForm onCreateGroup={handleCreateGroup} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">🔥 Atividades Recentes</h2>
        <GlobalActivityFeed />
      </div>

      {/* Lista de Grupos */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-4">📚 Grupos Disponíveis</h2>
      </div>
      
      <div className="space-y-3">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => (
            <div 
              key={group.id}
              className="card hover:border-study-primary cursor-pointer transition-colors"
              onClick={() => handleGroupClick(group)}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg flex items-center">
                  {group.name}
                </h3>
                <div className="flex gap-1">
                  {group.isMember && (
                    <Badge variant="secondary">Membro</Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">{group.description}</p>
              <div className="flex items-center mt-2">
                <Users size={16} className="mr-1 text-gray-400" />
                <span className="text-sm text-gray-500">{group.members} {t('groups.members')}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('groups.noGroups')}</p>
            <Button 
              className="mt-4 bg-study-primary"
              onClick={() => setOpen(true)}
            >
              {t('groups.createFirst')}
            </Button>
          </div>
        )}
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

export default Groups;
