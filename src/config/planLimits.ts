export type PlanType = 'free' | 'basic' | 'premium';

export interface PlanLimits {
  maxGroups: number | null; // null = unlimited
  maxMembersPerGroup: number | null;
  maxUploadSizeMB: number;
  historyDays: number | null; // null = unlimited
  hasAds: boolean;
  hasAITests: boolean;
  hasPremiumBadge: boolean;
  hasCustomThemes: boolean;
  hasAdvancedStats: boolean;
  hasPrioritySupport: boolean;
  canUploadFiles: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    maxGroups: 1,
    maxMembersPerGroup: 5,
    maxUploadSizeMB: 5,
    historyDays: 30,
    hasAds: true,
    hasAITests: false,
    hasPremiumBadge: false,
    hasCustomThemes: false,
    hasAdvancedStats: false,
    hasPrioritySupport: false,
    canUploadFiles: false,
  },
  basic: {
    maxGroups: 5,
    maxMembersPerGroup: 20,
    maxUploadSizeMB: 100,
    historyDays: null,
    hasAds: false,
    hasAITests: false,
    hasPremiumBadge: false,
    hasCustomThemes: false,
    hasAdvancedStats: true,
    hasPrioritySupport: false,
    canUploadFiles: true,
  },
  premium: {
    maxGroups: null,
    maxMembersPerGroup: null,
    maxUploadSizeMB: 1024,
    historyDays: null,
    hasAds: false,
    hasAITests: true,
    hasPremiumBadge: true,
    hasCustomThemes: true,
    hasAdvancedStats: true,
    hasPrioritySupport: true,
    canUploadFiles: true,
  }
};

export const PLAN_PRICES = {
  free: { monthly: 0, yearly: 0 },
  basic: { monthly: 4.99, yearly: 49.99 },
  premium: { monthly: 9.99, yearly: 99.99 },
};

export const PLAN_NAMES: Record<PlanType, string> = {
  free: 'Free',
  basic: 'Basic',
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
