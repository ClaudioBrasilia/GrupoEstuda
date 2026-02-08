import { createClient } from "@supabase/supabase-js";

// Credenciais do Supabase (obtidas do painel do projeto)
const SUPABASE_URL = "https://230beb1cfaab22bf115bb6fa18aad3a035c0c571ccdacccbac1e07174ca41c85.supabase.co";
const SUPABASE_ANON_KEY = "1dfc121d1cec7e85141f7ddfa17b93b83103f3bfecc9734777dcaa7391dbee9d";

// Criar cliente Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar_url?: string;
        };
        Update: {
          name?: string;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description?: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string;
          created_by: string;
        };
        Update: {
          name?: string;
          description?: string;
          updated_at?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string;
        };
      };
    };
  };
};
