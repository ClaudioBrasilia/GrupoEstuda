
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthError, Session } from '@supabase/supabase-js';
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
  login: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  register: (name: string, email: string, password: string) => Promise<{ error: AuthError | null }>;
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

    const initializeAuth = async () => {
      try {
        // 1. Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (initialSession) {
          setSession(initialSession);
          if (initialSession.user) {
            await fetchUserProfile(initialSession.user.id, initialSession.user.email!);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;
        
        setSession(currentSession);
        
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id, currentSession.user.email!);
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
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
        15000,
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
