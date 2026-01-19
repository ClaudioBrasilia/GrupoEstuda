
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

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
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (name: string, email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateUserPlan: (plan: PlanType) => Promise<void>;
}

const defaultAuthContext: AuthContextType = {
  user: null,
  session: null,
  isLoading: true,
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

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setSession(session);
        
        if (session?.user) {
          // Fetch profile and wait for it before setting loading to false
          await fetchUserProfile(session.user.id, session.user.email!);
        } else {
          setUser(null);
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      
      setSession(session);
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user.email!);
      }
      if (isMounted) {
        setIsLoading(false);
      }
    };
    
    initSession();

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
    setIsLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    setIsLoading(false);
    return { error };
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name
        }
      }
    });
    
    setIsLoading(false);
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout, updateUserPlan }}>
      {children}
    </AuthContext.Provider>
  );
};
