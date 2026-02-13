import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Crown, Check, X, ArrowRight, CreditCard, Settings, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { PremiumBadge } from '@/components/premium/PremiumBadge';
import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES, PlanType } from '@/config/planLimits';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const MyPlan: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlan, limits, usage, loading } = usePlanLimits();

  const features = [
    { key: 'maxGroups', label: 'Grupos de estudo', getValue: (plan: PlanType) => PLAN_LIMITS[plan].maxGroups === null ? 'Ilimitado' : PLAN_LIMITS[plan].maxGroups },
    { key: 'maxMembersPerGroup', label: 'Membros por grupo', getValue: (plan: PlanType) => PLAN_LIMITS[plan].maxMembersPerGroup === null ? 'Ilimitado' : PLAN_LIMITS[plan].maxMembersPerGroup },
    { key: 'maxUploadSizeMB', label: 'Limite de upload', getValue: (plan: PlanType) => `${PLAN_LIMITS[plan].maxUploadSizeMB >= 1024 ? '1 GB' : PLAN_LIMITS[plan].maxUploadSizeMB + ' MB'}` },
    { key: 'historyDays', label: 'Histórico de atividades', getValue: (plan: PlanType) => PLAN_LIMITS[plan].historyDays === null ? 'Completo' : `${PLAN_LIMITS[plan].historyDays} dias` },
    { key: 'hasAds', label: 'Sem anúncios', getValue: (plan: PlanType) => !PLAN_LIMITS[plan].hasAds },
    { key: 'canUploadFiles', label: 'Upload de arquivos', getValue: (plan: PlanType) => PLAN_LIMITS[plan].canUploadFiles },
    { key: 'hasAdvancedStats', label: 'Estatísticas avançadas', getValue: (plan: PlanType) => PLAN_LIMITS[plan].hasAdvancedStats },
    { key: 'hasAITests', label: 'Gerador de testes com IA', getValue: (plan: PlanType) => PLAN_LIMITS[plan].hasAITests },
    { key: 'hasPremiumBadge', label: 'Badge Premium exclusivo', getValue: (plan: PlanType) => PLAN_LIMITS[plan].hasPremiumBadge },
    { key: 'hasPrioritySupport', label: 'Suporte prioritário', getValue: (plan: PlanType) => PLAN_LIMITS[plan].hasPrioritySupport },
  ];

  const plans: PlanType[] = ['free', 'basic', 'premium'];

  const groupsPercentage = limits.maxGroups 
    ? Math.min((usage.groupsCreated / limits.maxGroups) * 100, 100)
    : 0;

  const storagePercentage = limits.maxUploadSizeMB
    ? Math.min((usage.storageUsedMB / limits.maxUploadSizeMB) * 100, 100)
    : 0;

  return (
    <PageLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Meu Plano</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura e veja seu uso</p>
        </div>

        {/* Current Plan Card */}
        <Card className="overflow-hidden">
          <div className={`h-2 ${currentPlan === 'premium' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : currentPlan === 'basic' ? 'bg-primary' : 'bg-muted'}`} />
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="text-xl flex items-center gap-2">
                  Plano {PLAN_NAMES[currentPlan]}
                  {currentPlan === 'premium' && <PremiumBadge size="md" />}
                </CardTitle>
              </div>
              <Badge variant={currentPlan === 'premium' ? 'default' : 'secondary'} className={currentPlan === 'premium' ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white' : ''}>
                Ativo
              </Badge>
            </div>
            <CardDescription>
              {currentPlan === 'free' && 'Plano gratuito com recursos básicos'}
              {currentPlan === 'basic' && 'Recursos avançados para estudantes dedicados'}
              {currentPlan === 'premium' && 'Acesso completo a todos os recursos'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                ${PLAN_PRICES[currentPlan].monthly}
                <span className="text-sm font-normal text-muted-foreground">/mês</span>
              </span>
              {currentPlan !== 'premium' && (
                <Button onClick={() => navigate('/plans')}>
                  <Crown className="mr-2 h-4 w-4" />
                  Fazer Upgrade
                </Button>
              )}
            </div>

            {/* Mock renewal info */}
            {currentPlan !== 'free' && (
              <div className="text-sm text-muted-foreground">
                Próxima renovação: 15 de Fevereiro, 2026
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Uso Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Groups Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Grupos Criados</span>
                <span className="font-medium">
                  {usage.groupsCreated} / {limits.maxGroups ?? '∞'}
                </span>
              </div>
              {limits.maxGroups && (
                <Progress value={groupsPercentage} className="h-2" />
              )}
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Armazenamento Usado</span>
                <span className="font-medium">
                  {usage.storageUsedMB.toFixed(2)} MB / {limits.maxUploadSizeMB >= 1024 ? '1 GB' : `${limits.maxUploadSizeMB} MB`}
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Feature Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Comparação de Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Recurso</th>
                    {plans.map((plan) => (
                      <th 
                        key={plan} 
                        className={`text-center py-3 px-2 font-medium ${plan === currentPlan ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1">
                            {PLAN_NAMES[plan]}
                            {plan === 'premium' && <Crown className="h-3 w-3 text-amber-500" />}
                          </span>
                          {plan === currentPlan && (
                            <Badge variant="outline" className="text-xs">Atual</Badge>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={feature.key} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-3 px-2">{feature.label}</td>
                      {plans.map((plan) => {
                        const value = feature.getValue(plan);
                        return (
                          <td 
                            key={plan} 
                            className={`text-center py-3 px-2 ${plan === currentPlan ? 'bg-primary/5' : ''}`}
                          >
                            {typeof value === 'boolean' ? (
                              value ? (
                                <Check className="h-4 w-4 text-green-500 mx-auto" />
                              ) : (
                                <X className="h-4 w-4 text-muted-foreground mx-auto" />
                              )
                            ) : (
                              <span className="font-medium">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Pricing row */}
                  <tr className="border-t">
                    <td className="py-3 px-2 font-medium">Preço Mensal</td>
                    {plans.map((plan) => (
                      <td 
                        key={plan} 
                        className={`text-center py-3 px-2 font-bold ${plan === currentPlan ? 'bg-primary/5' : ''}`}
                      >
                        {PLAN_PRICES[plan].monthly === 0 ? 'Grátis' : `$${PLAN_PRICES[plan].monthly}`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gerenciar Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/plans')}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              {currentPlan === 'premium' ? 'Ver todos os planos' : 'Fazer upgrade do plano'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Histórico de pagamentos
              <Badge variant="secondary" className="ml-auto text-xs">Em breve</Badge>
            </Button>

            <Button 
              variant="outline" 
              className="w-full justify-start"
              disabled
            >
              <Settings className="mr-2 h-4 w-4" />
              Método de pagamento
              <Badge variant="secondary" className="ml-auto text-xs">Em breve</Badge>
            </Button>

            {currentPlan !== 'free' && (
              <Separator className="my-4" />
            )}

            {currentPlan !== 'free' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Cancelar assinatura
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancelar Assinatura</DialogTitle>
                    <DialogDescription>
                      Tem certeza que deseja cancelar sua assinatura? Você continuará tendo acesso até o final do período atual.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4 space-y-2 text-sm text-muted-foreground">
                    <p>• Seu acesso continuará até 15 de Fevereiro, 2026</p>
                    <p>• Você perderá acesso aos recursos premium após essa data</p>
                    <p>• Seus dados serão mantidos, mas alguns recursos ficarão limitados</p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Manter Assinatura</Button>
                    <Button variant="destructive" disabled>
                      Confirmar Cancelamento
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default MyPlan;
