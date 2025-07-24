import React, { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
// Removed unused SupabaseUser import
import type {
  AuthContext as AuthContextType,
  AuthUser,
  LoginCredentials,
  SignupCredentials,
} from "../types/auth";
import type { User } from "../types/database";
import { AuthService } from "../services/auth";
import { supabase } from "../services/supabase";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthProvider: Initializing authentication...');
    let isInitialized = false;
    let isMounted = true;

    // Handle user session (login, session restore, etc.)
    const handleUserSession = async (user: any, event: string) => {
      try {
        if (!isMounted) return;
        
        console.log(`🔄 AuthProvider: Handling ${event} for user:`, user.id);
        const authUser = user as AuthUser;
        setUser(authUser);

        // Load user profile
        console.log('📥 AuthProvider: Loading user profile...');
        let userProfile = await AuthService.getUserProfile(authUser.id);

        // Create profile if it doesn't exist (for new signups or OAuth)
        if (!userProfile && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'OAUTH_CALLBACK')) {
          console.log('👤 AuthProvider: Creating new user profile...');
          try {
            userProfile = await AuthService.createUserProfile(authUser.id, {
              username:
                authUser.user_metadata?.username ||
                authUser.user_metadata?.preferred_username ||
                authUser.email?.split("@")[0] ||
                `user_${authUser.id.slice(0, 8)}`,
              display_name:
                authUser.user_metadata?.display_name ||
                authUser.user_metadata?.full_name ||
                authUser.user_metadata?.name,
              avatar_url: authUser.user_metadata?.avatar_url,
              status: 'online'
            });
            console.log('✅ AuthProvider: User profile created successfully');
          } catch (createError) {
            console.error('❌ AuthProvider: Failed to create user profile:', createError);
            // Continue without profile - user can update it later
          }
        }

        if (isMounted) {
          setProfile(userProfile);
          authUser.profile = userProfile || undefined;
          console.log('✅ AuthProvider: User session handled successfully');
        }
        
      } catch (error) {
        console.error('💥 AuthProvider: Error handling user session:', error);
        // Set user anyway - profile can be loaded later
        if (isMounted) {
          setUser(user as AuthUser);
          setProfile(null);
        }
      }
    };

    // Get initial session on app load
    const initializeAuth = async () => {
      try {
        if (!isMounted) return;
        
        console.log('🔍 AuthProvider: Checking for existing session...');
        
        // Check for OAuth callback in URL
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const isOAuthCallback = urlParams.has('code') || hashParams.has('access_token') || 
                               window.location.pathname === '/auth/callback';
        
        if (isOAuthCallback) {
          console.log('🔗 AuthProvider: OAuth callback detected');
          // Clear URL parameters after handling
          window.history.replaceState({}, document.title, window.location.pathname);
          // Give Supabase time to process the OAuth callback
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (error) {
          console.error('❌ AuthProvider: Session error:', error);
          setUser(null);
          setProfile(null);
        } else if (session?.user) {
          console.log('✅ AuthProvider: Session found for user:', session.user.id);
          await handleUserSession(session.user, isOAuthCallback ? 'OAUTH_CALLBACK' : 'INITIAL_SESSION');
        } else {
          console.log('ℹ️ AuthProvider: No existing session found');
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('💥 AuthProvider: Failed to get session:', error);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted && !isInitialized) {
          console.log('✅ AuthProvider: Initialization complete');
          isInitialized = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    console.log('👂 AuthProvider: Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('🔔 AuthProvider: Auth state change:', event, session ? `User: ${session.user?.id}` : 'No session');
        
        // Ignore SIGNED_IN events during initialization to prevent double handling
        if (event === 'SIGNED_IN' && !isInitialized) {
          console.log('⏭️ AuthProvider: Ignoring SIGNED_IN during initialization');
          return;
        }
        
        if (session?.user) {
          await handleUserSession(session.user, event);
        } else {
          console.log('🚪 AuthProvider: User signed out or session ended');
          if (isMounted) {
            setUser(null);
            setProfile(null);
            // Clear any cached data
            localStorage.removeItem('conversations');
            localStorage.removeItem('friends');
          }
        }
        
        // Only set loading to false after initialization is complete
        if (isInitialized && isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 AuthProvider: Cleaning up auth listener');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      await AuthService.signIn(credentials);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (credentials: SignupCredentials) => {
    setLoading(true);
    try {
      await AuthService.signUp(credentials);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    try {
      await AuthService.signInWithOAuth(provider);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user?.id) throw new Error("No authenticated user");

    try {
      const updatedProfile = await AuthService.updateUserProfile(
        user.id,
        updates
      );
      setProfile(updatedProfile);
      if (user) {
        user.profile = updatedProfile;
      }
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithOAuth,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
