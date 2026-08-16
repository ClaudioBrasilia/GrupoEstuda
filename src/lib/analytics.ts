import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

/**
 * Eventos de produto do Grupo Estuda.
 *
 * A lista é fechada de propósito: nome de evento digitado à mão vira um
 * conjunto de dados que ninguém consegue analisar depois.
 */
export type AnalyticsEvent =
  | 'app_open'
  | 'sign_up'
  | 'login'
  | 'group_created'
  | 'group_joined'
  | 'invitation_sent'
  | 'study_session_completed'
  | 'challenge_joined'
  | 'premium_waitlist_joined';

type AnalyticsProperties = Record<string, string | number | boolean | null>;

/**
 * Registra um evento. Nunca lança e nunca bloqueia a interface: análise não
 * pode ser motivo de erro numa ação que o usuário pediu.
 */
export const track = async (
  name: AnalyticsEvent,
  properties: AnalyticsProperties = {}
): Promise<void> => {
  try {
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;

    // A policy de INSERT exige user_id = auth.uid(); sem sessão o evento
    // seria rejeitado de qualquer forma.
    if (!userId) return;

    await supabase.from('app_events').insert({
      user_id: userId,
      name,
      properties,
      platform: Capacitor.getPlatform(),
    });
  } catch (error) {
    console.warn('Falha ao registrar evento de analytics:', name, error);
  }
};

const APP_OPEN_STORAGE_KEY = 'grupoestuda.lastAppOpen';

/**
 * Marca uma abertura do app por dia, por usuário. É desse evento que sai a
 * curva de retenção (view `retention_by_signup_day`), então contar várias
 * vezes no mesmo dia só inflaria o número.
 */
export const trackAppOpen = async (): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (localStorage.getItem(APP_OPEN_STORAGE_KEY) === today) return;
    localStorage.setItem(APP_OPEN_STORAGE_KEY, today);
  } catch {
    // Modo privado / storage bloqueado: registra mesmo assim.
  }

  await track('app_open');
};
