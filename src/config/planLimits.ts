export type PlanType = 'free' | 'premium';

export interface PlanLimits {
  maxGroups: number | null; // null = ilimitado
  maxMembersPerGroup: number | null;
  maxUploadSizeMB: number;
  historyDays: number | null; // null = ilimitado
  canUploadFiles: boolean;
  hasPremiumBadge: boolean;
  hasAdvancedStats: boolean;
  hasPrioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxGroups: 3,
    maxMembersPerGroup: 15,
    maxUploadSizeMB: 0,
    historyDays: 30,
    canUploadFiles: false,
    hasPremiumBadge: false,
    hasAdvancedStats: false,
    hasPrioritySupport: false,
  },
  premium: {
    maxGroups: null,
    maxMembersPerGroup: null,
    maxUploadSizeMB: 500,
    historyDays: null,
    canUploadFiles: true,
    hasPremiumBadge: true,
    hasAdvancedStats: true,
    hasPrioritySupport: true,
  }
};

export const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  premium: { monthly: 9.90, yearly: 99.00 },
};

export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Grátis',
  premium: 'Premium',
};

export const getPlanLimits = (plan: PlanType): PlanLimits => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

export const formatLimit = (limit: number | null, t?: (key: string) => string): string => {
  if (limit === null) {
    return t ? t('plans.unlimited') : 'Ilimitado';
  }
  return limit.toString();
};
