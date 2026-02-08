import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PLAN_LIMITS, getPlanLimits, PlanType } from '@/config/planLimits';

interface UsageStats {
  groupsCreated: number;
  storageUsedMB: number;
}

export const usePlanLimits = () => {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageStats>({ groupsCreated: 0, storageUsedMB: 0 });
  const [loading, setLoading] = useState(true);

  const currentPlan: PlanType = (user?.plan as PlanType) || 'free';
  const limits = getPlanLimits(currentPlan);

  const fetchUsage = useCallback(async () => {
    if (!user) return;

    try {
      // Get groups created by user
      const { count: groupsCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      // Get storage used (from group_files)
      const { data: filesData } = await supabase
        .from('group_files')
        .select('file_size')
        .eq('user_id', user.id);

      const totalBytes = filesData?.reduce((acc, file) => acc + (file.file_size || 0), 0) || 0;
      const totalMB = totalBytes / (1024 * 1024);

      setUsage({
        groupsCreated: groupsCount || 0,
        storageUsedMB: Math.round(totalMB * 100) / 100,
      });
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUsage();
    }
  }, [user, fetchUsage]);

  const canCreateGroup = (): boolean => {
    if (limits.maxGroups === null) return true;
    return usage.groupsCreated < limits.maxGroups;
  };

  const canUploadFile = (fileSizeMB: number): boolean => {
    if (!limits.canUploadFiles) return false;
    return fileSizeMB <= limits.maxUploadSizeMB;
  };

  const canAccessFeature = (feature: keyof typeof limits): boolean => {
    const value = limits[feature];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value > 0;
    return value !== null;
  };

  const groupsRemaining = (): number | null => {
    if (limits.maxGroups === null) return null;
    return Math.max(0, limits.maxGroups - usage.groupsCreated);
  };

  const getUpgradeRequiredPlan = (feature: string): PlanType | null => {
    // Check which plan is needed for a feature
    if (feature === 'aiTests' || feature === 'premiumBadge' || feature === 'customThemes') {
      return currentPlan === 'premium' ? null : 'premium';
    }
    if (feature === 'uploadFiles' || feature === 'advancedStats') {
      if (currentPlan === 'premium' || currentPlan === 'basic') return null;
      return 'basic';
    }
    return null;
  };

  return {
    currentPlan,
    limits,
    usage,
    loading,
    canCreateGroup,
    canUploadFile,
    canAccessFeature,
    groupsRemaining,
    groupsUsed: usage.groupsCreated,
    storageUsedMB: usage.storageUsedMB,
    getUpgradeRequiredPlan,
    refreshUsage: fetchUsage,
  };
};

export default usePlanLimits;
