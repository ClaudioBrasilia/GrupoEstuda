import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Crown, LockKeyhole, Plus, Search, Sparkles, User, Users, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Group, useGroups } from '@/hooks/useGroups';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import GlobalActiveChallengeBanner from '@/components/group/GlobalActiveChallengeBanner';

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
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao criar grupo. Tente novamente.');
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

  const handleGroupClick = async (group: Group) => {
    const isPremiumGroup = group.isPremium || group.id === VESTIBULAR_GROUP_ID;

    if (group.isMember) {
      navigate(`/group/${group.id}`);
      return;
    }

    if (isPremiumGroup && user?.plan !== 'premium') {
      toast.info('Este grupo inclui desafios e estatísticas exclusivas do Premium.');
      navigate('/plans');
      return;
    }

    const result = await joinGroup(group.id);
    if (result.success) {
      toast.success('Você entrou no grupo!');
      navigate(`/group/${group.id}`);
    } else {
      toast.error(result.error || 'Não foi possível entrar no grupo.');
    }
  };

  const getGroupMeta = (group: Group) => {
    const isPremiumGroup = group.isPremium || group.id === VESTIBULAR_GROUP_ID;
    if (isPremiumGroup) {
      return {
        label: 'Premium',
        description: 'Desafios exclusivos, estatísticas avançadas e temporadas competitivas.',
        icon: Crown,
        className: 'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300'
      };
    }

    return {
      label: group.isMember ? 'Seu grupo' : 'Grupo aberto',
      description: group.isMember ? 'Continue sua jornada com este grupo.' : 'Entre agora e comece a estudar com outras pessoas.',
      icon: Users,
      className: 'bg-primary/10 text-primary border-primary/20'
    };
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
        
        <div className="flex flex-wrap gap-2">
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

      <GlobalActiveChallengeBanner groups={groups} />

      <div className="mb-5">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Grupos para estudar junto</h2>
          <Sparkles size={18} className="text-secondary" aria-hidden="true" />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Entre em um grupo aberto ou descubra os benefícios dos grupos Premium.
        </p>
      </div>
      
      <div className="grid gap-4 lg:grid-cols-2">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const meta = getGroupMeta(group);
            const MetaIcon = meta.icon;
            const isPremiumGroup = group.isPremium || group.id === VESTIBULAR_GROUP_ID;

            return (
              <article
                key={group.id}
                className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.className}`}>
                      <MetaIcon size={21} aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold text-foreground">{group.name}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                        {group.isMember && <Badge variant="secondary">Você participa</Badge>}
                      </div>
                    </div>
                  </div>
                  {isPremiumGroup && <LockKeyhole size={18} className="shrink-0 text-amber-500" aria-label="Grupo Premium" />}
                </div>

                <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-relaxed text-muted-foreground">
                  {group.description || meta.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Users size={16} aria-hidden="true" />{group.members} {t('groups.members')}</span>
                  <span className="inline-flex items-center gap-1.5"><Activity size={16} aria-hidden="true" />Ativo para novos estudantes</span>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
                  <p className="text-xs text-muted-foreground">{meta.description}</p>
                  <Button
                    size="sm"
                    variant={group.isMember ? 'outline' : 'default'}
                    className="shrink-0"
                    onClick={() => handleGroupClick(group)}
                  >
                    {group.isMember ? 'Abrir grupo' : isPremiumGroup ? 'Ver Premium' : 'Entrar no grupo'}
                    <ArrowRight className="ml-1.5" size={15} />
                  </Button>
                </div>
              </article>
            );
          })
        ) : (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center lg:col-span-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Users size={24} aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">Ainda não encontramos esse grupo</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Crie um grupo com seus amigos e transforme o estudo em um compromisso compartilhado.
            </p>
            <Button className="mt-5 bg-study-primary" onClick={() => setOpen(true)}>
              <Plus size={18} className="mr-2" />
              {t('groups.createFirst')}
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Groups;
