import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const containerSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const PremiumBadge = ({ 
  size = 'sm', 
  showTooltip = true,
  className 
}: PremiumBadgeProps) => {
  const badge = (
    <div 
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm',
        containerSizeClasses[size],
        className
      )}
    >
      <Crown className={cn('text-white', sizeClasses[size])} />
    </div>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Usuário Premium</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default PremiumBadge;
