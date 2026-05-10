import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState<PlanType | null>(null);

  const handleSubscribe = async (planId: PlanType) => {
    if (planId === 'free') {
      navigate('/my-plan');
      return;
    }

    setIsCheckoutLoading(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan: planId,
          billingCycle: isYearly ? 'yearly' : 'monthly',
        },
      });

      if (error) {
        throw new Error(error.message || 'Falha ao iniciar checkout.');
      }

      if (!data?.checkoutUrl) {
        throw new Error(
          'Checkout indisponível no momento. Configure Stripe para habilitar assinatura premium.'
        );
      }

      window.location.assign(data.checkoutUrl);
    } catch (checkoutError) {
      const message = checkoutError instanceof Error ? checkoutError.message : 'Erro ao iniciar assinatura';
      toast.error(message);
    } finally {
      setIsCheckoutLoading(null);
    }
  };

  const getPrice = (plan: PlanType) => {
    const prices = PLAN_PRICES[plan];
    if (plan === 'free') return 'Grátis';
    if (isYearly) {
      const monthlyEquivalent = (prices.yearly / 12).toFixed(2);
      return `$${monthlyEquivalent}`;
    }
    return `$${prices.monthly}`;
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
    { label: 'Grupos de estudo', free: '3', basic: '5', premium: 'Ilimitado' },
    { label: 'Membros por grupo', free: '5', basic: '20', premium: 'Ilimitado' },
    { label: 'Timer de estudos', free: true, basic: true, premium: true },
    { label: 'Controle de água', free: true, basic: true, premium: true },
    { label: 'Progresso básico', free: true, basic: true, premium: true },
    { label: 'Upload de arquivos', free: false, basic: '100 MB', premium: '1 GB' },
    { label: 'Histórico completo', free: '30 dias', basic: true, premium: true },
    { label: 'Sem anúncios', free: false, basic: true, premium: true },
    { label: 'Estatísticas avançadas', free: false, basic: true, premium: true },
    { label: 'Gerador de testes com IA', free: false, basic: false, premium: true },
    { label: 'Badge Premium exclusivo', free: false, basic: false, premium: true },
    { label: 'Suporte prioritário', free: false, basic: false, premium: true },
  ];

  const plans: { id: PlanType; description: string }[] = [
    { id: 'free', description: 'Para começar a estudar' },
    { id: 'basic', description: 'Para estudantes dedicados' },
    { id: 'premium', description: 'Para o máximo desempenho' },
  ];

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('plans.title')}</h1>
          <p className="text-muted-foreground mt-2">Escolha o plano ideal para alcançar seus objetivos</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Label htmlFor="billing-toggle" className={!isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Mensal
          </Label>
          <Switch id="billing-toggle" checked={isYearly} onCheckedChange={setIsYearly} />
          <Label htmlFor="billing-toggle" className={isYearly ? 'font-semibold' : 'text-muted-foreground'}>
            Anual
          </Label>
          {isYearly && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Economize até 17%
            </Badge>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = user?.plan === plan.id;
            const isPremium = plan.id === 'premium';
            const isBasic = plan.id === 'basic';

            return (
              <Card
                key={plan.id}
                className={`relative overflow-hidden transition-all ${
                  isPremium ? 'border-amber-400 dark:border-amber-500 shadow-lg' : ''
                } ${isBasic ? 'border-primary' : ''} ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                <div className={`h-1 ${isPremium ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : isBasic ? 'bg-primary' : 'bg-muted'}`} />

                {isBasic && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-primary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                {isPremium && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-white">
                      <Crown className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  </div>
                )}

                <CardHeader className="pt-8">
                  <CardTitle className="flex items-center gap-2">{PLAN_NAMES[plan.id]}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div>
                    <span className="text-3xl font-bold">{getPrice(plan.id)}</span>
                    <span className="text-muted-foreground text-sm">{getBillingText(plan.id)}</span>
                    {isYearly && plan.id !== 'free' && (
                      <div className="text-sm text-green-600 dark:text-green-400 mt-1">Economize {getYearlySavings(plan.id)}%</div>
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
                        : isBasic
                          ? 'bg-primary'
                          : ''
                    }`}
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                    disabled={isCurrent || isCheckoutLoading === plan.id}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {isCurrent ? 'Plano Atual' : plan.id === 'free' ? 'Começar Grátis' : `Assinar ${PLAN_NAMES[plan.id]}`}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Comparação Detalhada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Recurso</th>
                    <th className="text-center py-3 px-2">Free</th>
                    <th className="text-center py-3 px-2 bg-primary/5">
                      <div className="flex flex-col items-center">
                        <span>Basic</span>
                        <Badge variant="outline" className="text-xs mt-1">Popular</Badge>
                      </div>
                    </th>
                    <th className="text-center py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <Crown className="h-3 w-3 text-amber-500" />
                        Premium
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                      <td className="py-3 px-2">{feature.label}</td>
                      {(['free', 'basic', 'premium'] as const).map((plan) => {
                        const value = feature[plan];
                        const isBasicCol = plan === 'basic';
                        return (
                          <td key={plan} className={`text-center py-3 px-2 ${isBasicCol ? 'bg-primary/5' : ''}`}>
                            {value === true ? (
                              <Check className="h-4 w-4 text-green-500 mx-auto" />
                            ) : value === false ? (
                              <X className="h-4 w-4 text-muted-foreground mx-auto" />
                            ) : (
                              <span className="font-medium">{value}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Todos os planos pagos incluem 7 dias de garantia de reembolso.</p>
          <p>Cancele a qualquer momento, sem taxas adicionais.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Plans;
