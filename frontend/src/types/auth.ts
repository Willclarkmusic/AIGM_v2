import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from './database';

export interface AuthUser extends SupabaseUser {
  profile?: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

export interface AuthContext {
  user: AuthUser | null;
  profile: User | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (credentials: SignupCredentials) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github') => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}