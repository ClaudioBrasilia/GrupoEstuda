import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, X, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/analytics';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES, PlanType, formatLimit } from '@/config/planLimits';

const Plans: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);

  useEffect(() => {
    if (!user) return;

    supabase
      .from('premium_waitlist')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsOnWaitlist(Boolean(data)));
  }, [user]);

  // A cobrança ainda não está integrada às lojas (Google Play Billing /
  // StoreKit). Até lá a tela registra interesse — conceder o plano aqui
  // liberaria o Premium de graça para qualquer um.
  const handleJoinWaitlist = async () => {
    if (!user) return;

    setIsJoiningWaitlist(true);
    try {
      const { error } = await supabase.from('premium_waitlist').upsert({
        user_id: user.id,
        billing_period: isYearly ? 'yearly' : 'monthly',
      });

      if (error) throw error;

      setIsOnWaitlist(true);
      void track('premium_waitlist_joined', {
        billing_period: isYearly ? 'yearly' : 'monthly',
      });
      toast.success('Pronto! Avisaremos assim que o Premium estiver disponível.');
    } catch (error) {
      console.error('Erro ao entrar na lista do Premium:', error);
      toast.error('Não foi possível registrar seu interesse. Tente novamente.');
    } finally {
      setIsJoiningWaitlist(false);
    }
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

  // Os números vêm de PLAN_LIMITS para a tela nunca prometer um limite
  // diferente do que o app aplica de fato.
  const features = [
    {
      label: 'Grupos de estudo criados',
      free: formatLimit(PLAN_LIMITS.free.maxGroups),
      premium: formatLimit(PLAN_LIMITS.premium.maxGroups),
    },
    {
      label: 'Membros por grupo',
      free: formatLimit(PLAN_LIMITS.free.maxMembersPerGroup),
      premium: formatLimit(PLAN_LIMITS.premium.maxMembersPerGroup),
    },
    { label: 'Cronômetro de estudos', free: true, premium: true },
    { label: 'Controle de água', free: true, premium: true },
    { label: 'Desafios e ranking', free: true, premium: true },
    {
      label: 'Histórico de progresso',
      free: `${PLAN_LIMITS.free.historyDays} dias`,
      premium: formatLimit(PLAN_LIMITS.premium.historyDays),
    },
    {
      label: 'Upload de arquivos no grupo',
      free: false,
      premium: `${PLAN_LIMITS.premium.maxUploadSizeMB} MB`,
    },
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
                      Em breve
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
                  {isPremium ? (
                    <Button
                      className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
                      disabled={isJoiningWaitlist || isOnWaitlist}
                      onClick={handleJoinWaitlist}
                    >
                      {isOnWaitlist ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Você será avisado
                        </>
                      ) : (
                        <>
                          <Crown className="mr-2 h-4 w-4" />
                          {isJoiningWaitlist ? 'Registrando...' : 'Avise-me no lançamento'}
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={isCurrent}
                      onClick={() => navigate('/')}
                    >
                      {isCurrent ? 'Plano Atual' : 'Começar Grátis'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ or additional info */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>
            O Premium ainda não está à venda. Os valores acima são o preço
            previsto de lançamento.
          </p>
          <p>
            Quando abrir, a assinatura será cobrada pela App Store ou Google Play
            e poderá ser cancelada a qualquer momento pela própria loja.
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Plans;
