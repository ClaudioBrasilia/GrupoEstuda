export const ONBOARDING_STORAGE_KEY = 'grupo-estuda-onboarding-v1';

export interface OnboardingPreferences {
  goal: 'consistency' | 'exam' | 'competition' | 'focus';
  dailyMinutes: number;
  subject: string;
  groupPreference: 'join' | 'create' | 'later';
  completedAt: string;
}

export function getOnboardingPreferences(): OnboardingPreferences | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as OnboardingPreferences) : null;
  } catch {
    return null;
  }
}

export function saveOnboardingPreferences(preferences: OnboardingPreferences) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(preferences));
}

export function isOnboardingComplete() {
  return Boolean(getOnboardingPreferences());
}
