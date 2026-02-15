
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { withTimeout } from '@/lib/authUtils';

export type PlanType = 'free' | 'basic' | 'premium';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  plan: PlanType;
}

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthActionLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (name: string, email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateUserPlan: (plan: PlanType) => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
  isAuthActionLoading: false,
  login: async () => ({ error: null }),
  register: async () => ({ error: null }),
  logout: async () => {},
  updateUserPlan: async () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let authResolved = false;

    const resolveAuth = () => {
      if (isMounted && !authResolved) {
        authResolved = true;
        setIsLoading(false);
      }
    };

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          setTimeout(() => {
            if (!isMounted) return;
            fetchUserProfile(currentSession.user.id, currentSession.user.email!);
          }, 0);
        } else {
          setUser(null);
        }
        
        resolveAuth();
      }
    );

    // Fallback: Verificar sessão manualmente após 2 segundos
    const fallbackTimeout = setTimeout(async () => {
      if (!authResolved && isMounted) {
        try {
          const { data: { session: existingSession } } = await supabase.auth.getSession();
          if (!isMounted) return;
          
          setSession(existingSession);
          if (existingSession?.user) {
            await fetchUserProfile(existingSession.user.id, existingSession.user.email!);
          }
        } catch (error) {
          console.warn('Failed to get session:', error);
        }
        resolveAuth();
      }
    }, 2000);

    // Timeout máximo de segurança: 5 segundos
    const maxTimeout = setTimeout(() => {
      if (!authResolved) {
        console.warn('Auth timeout reached, forcing loading to complete');
        resolveAuth();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimeout);
      clearTimeout(maxTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string, email: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        setUser({
          id: profile.id,
          email: email,
          name: profile.name,
          plan: profile.plan as PlanType
        });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsAuthActionLoading(true);
    
    try {
      const result = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        30000,
        'Sem resposta do servidor. Verifique sua conexão e tente novamente.'
      );
      
      return { error: result.error };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Erro ao fazer login' 
        } 
      };
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsAuthActionLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    try {
      const result = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { name }
          }
        }),
        15000,
        'Sem resposta do servidor. Verifique sua conexão e tente novamente.'
      );
      
      return { error: result.error };
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Erro ao registrar' 
        } 
      };
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const logout = async () => {
    setIsAuthActionLoading(true);
    try {
      await withTimeout(
        supabase.auth.signOut(),
        10000,
        'Erro ao sair. Tente novamente.'
      );
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout locally even if request fails
      setUser(null);
      setSession(null);
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const updateUserPlan = async (plan: PlanType) => {
    if (!user || !session) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ plan })
      .eq('id', user.id);
      
    if (!error) {
      setUser({ ...user, plan });
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isLoading, 
      isAuthActionLoading,
      login, 
      register, 
      logout, 
      updateUserPlan 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
