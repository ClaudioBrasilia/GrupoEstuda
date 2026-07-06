import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { PLAN_NAMES, PLAN_PRICES, PlanType } from '@/config/planLimits';

const Plans: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUserPlan } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  const handleSubscribe = (planId: PlanType) => {
    // Em um app real, isso conectaria com o Stripe
    updateUserPlan(planId);
    toast.success(`Você assinou o plano ${PLAN_NAMES[planId]}!`);
    navigate('/my-plan');
  };

  const formatPrice = (value: number) => value.toFixed(2).replace('.', ',');

  const getPrice = (plan: PlanType) => {
    const prices = PLAN_PRICES[plan];
    if (plan === 'free') return 'Grátis';
    if (isYearly) {
      const monthlyEquivalent = prices.yearly / 12;
      return `R$ ${formatPrice(monthlyEquivalent)}`;
    }
    return `R$ ${formatPrice(prices.monthly)}`;
  };

  const getBillingText = (plan: PlanType) => {
    if (plan === 'free') return 'Para sempre';
    if (isYearly) return '/mês (cobrado anualmente)';
    return '/mês';
  };

  const getYearlySavings = (plan: PlanType) => {
    if (plan === 'free') return 0;
    const monthly = PLAN_PRICES[plan].monthly * 12;
    const yearly = PLAN_PRICES[plan].yearly;
    return Math.round(((monthly - yearly) / monthly) * 100);
  };

  const features = [
    { label: 'Grupos de estudo criados', free: '3', premium: 'Ilimitado' },
    { label: 'Membros por grupo', free: '15', premium: 'Ilimitado' },
    { label: 'Cronômetro de estudos', free: true, premium: true },
    { label: 'Controle de água', free: true, premium: true },
    { label: 'Desafios e ranking', free: true, premium: true },
    { label: 'Histórico de progresso', free: '30 dias', premium: 'Ilimitado' },
    { label: 'Upload de arquivos no grupo', free: false, premium: '500 MB' },
    { label: 'Estatísticas avançadas', free: false, premium: true },
    { label: 'Badge exclusivo no perfil', free: false, premium: true },
    { label: 'Suporte prioritário', free: false, premium: true },
  ];

  const plans: { id: PlanType; description: string }[] = [
    { id: 'free', description: 'Para começar a estudar' },
    { id: 'premium', description: 'Para o máximo desempenho' },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('plans.title')}</h1>
          <p className="text-muted-foreground mt-2">
            Escolha o plano ideal para alcançar seus objetivos
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Anual
          </Label>
          {isYearly && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Economize até {getYearlySavings('premium')}%
            </Badge>
          )}
        </div>

        {/* Plan Cards */}
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {plans.map((plan) => {
            const isCurrent = user?.plan === plan.id;
            const isPremium = plan.id === 'premium';

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  isPremium ? 'border-amber-400 dark:border-amber-500 shadow-lg' : ''
                } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {/* Top accent bar */}
                <div className={`h-1 ${
                  isPremium ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-muted'
                }`} />

                {isPremium && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Recomendado
                    </Badge>
                  </div>
                )}

                <CardHeader className="pt-8">
                  <CardTitle className="flex items-center gap-2">
                    {PLAN_NAMES[plan.id]}
                    {isPremium && <Crown className="h-5 w-5 text-amber-500" />}
                  </CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="pt-4">
                    <span className="text-3xl font-bold">{getPrice(plan.id)}</span>
                    <span className="text-muted-foreground text-sm">{getBillingText(plan.id)}</span>
                    {isYearly && plan.id !== 'free' && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Economize {getYearlySavings(plan.id)}%
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {features.map((feature, index) => {
                      const value = feature[plan.id as keyof typeof feature];
                      const hasFeature = value === true || (typeof value === 'string' && value !== '');

                      return (
                        <li key={index} className="flex items-start gap-2">
                          {hasFeature ? (
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${!hasFeature ? 'text-muted-foreground' : ''}`}>
                            {feature.label}
                            {typeof value === 'string' && value !== '' && !['true', 'false'].includes(value) && (
                              <span className="text-muted-foreground ml-1">({value})</span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className={`w-full ${
                      isPremium
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white'
                        : ''
                    }`}
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                    disabled={isCurrent}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isCurrent ? (
                      'Plano Atual'
                    ) : plan.id === 'free' ? (
                      'Começar Grátis'
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        Assinar {PLAN_NAMES[plan.id]}
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ or additional info */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>O plano Premium inclui 7 dias de garantia de reembolso.</p>
          <p>Cancele a qualquer momento, sem taxas adicionais.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Plans;
