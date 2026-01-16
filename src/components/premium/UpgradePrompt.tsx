import { Crown, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlanType, PLAN_NAMES } from '@/config/planLimits';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  currentPlan?: PlanType;
  requiredPlan?: PlanType;
  compact?: boolean;
  className?: string;
}

export const UpgradePrompt = ({
  feature,
  description,
  currentPlan = 'free',
  requiredPlan = 'basic',
  compact = false,
  className,
}: UpgradePromptProps) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div 
        className={cn(
          'flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border border-amber-200 dark:border-amber-800',
          className
        )}
      >
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600" />
          <span className="text-sm text-amber-700 dark:text-amber-300">
            {feature} - Disponível no plano {PLAN_NAMES[requiredPlan]}
          </span>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          className="border-amber-300 text-amber-700 hover:bg-amber-100"
          onClick={() => navigate('/plans')}
        >
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 flex items-center justify-center">
            <Crown className="h-8 w-8 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{feature}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="px-2 py-1 rounded bg-muted">{PLAN_NAMES[currentPlan]}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
              {PLAN_NAMES[requiredPlan]}
            </span>
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white"
            onClick={() => navigate('/plans')}
          >
            <Crown className="mr-2 h-4 w-4" />
            Fazer Upgrade
          </Button>

          <p className="text-xs text-muted-foreground">
            A partir de $4.99/mês
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default UpgradePrompt;
