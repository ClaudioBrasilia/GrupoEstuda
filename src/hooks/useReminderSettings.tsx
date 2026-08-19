import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'grupo-estuda-reminder-settings-v1';

export interface ReminderSettings {
  enabled: boolean;
  time: string;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  time: '19:00',
};

function readSettings(): ReminderSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(stored) as Partial<ReminderSettings>;
    return {
      enabled: parsed.enabled ?? DEFAULT_SETTINGS.enabled,
      time: parsed.time || DEFAULT_SETTINGS.time,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings>(readSettings);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<ReminderSettings>) => {
    setSettings((current) => ({ ...current, ...updates }));
  }, []);

  const requestBrowserPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported' as const;
    if (Notification.permission === 'granted') return 'granted' as const;
    return Notification.requestPermission();
  }, []);

  return { settings, updateSettings, requestBrowserPermission };
}

export function getReminderSettings(): ReminderSettings {
  return readSettings();
}
