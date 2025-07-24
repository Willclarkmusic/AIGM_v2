import { supabase } from './supabase';
import type { LoginCredentials, SignupCredentials } from '../types/auth';
import type { User } from '../types/database';

export class AuthService {
  static async signIn(credentials: LoginCredentials) {
    console.log('🔐 AuthService: Signing in user:', credentials.email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    
    if (error) {
      console.error('❌ AuthService: Sign in error:', error);
      throw error;
    }
    
    console.log('✅ AuthService: Sign in successful:', data.user?.id);
    return data;
  }

  static async signUp(credentials: SignupCredentials) {
    console.log('📝 AuthService: Signing up user:', credentials.email);
    
    const { data, error } = await supabase.auth.signUp({
      email: credentials.email,
      password: credentials.password,
      options: {
        data: {
          username: credentials.username,
          display_name: credentials.displayName,
        },
      },
    });
    
    if (error) {
      console.error('❌ AuthService: Sign up error:', error);
      throw error;
    }
    
    console.log('✅ AuthService: Sign up successful:', data.user?.id);
    return data;
  }

  static async signInWithOAuth(provider: 'google' | 'github') {
    console.log(`🔗 AuthService: Starting ${provider} OAuth flow`);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    
    if (error) {
      console.error(`❌ AuthService: ${provider} OAuth error:`, error);
      throw error;
    }
    
    console.log(`✅ AuthService: ${provider} OAuth initiated`);
    return data;
  }

  static async signOut() {
    console.log('🚪 AuthService: Signing out user');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ AuthService: Sign out error:', error);
      throw error;
    }
    
    console.log('✅ AuthService: Sign out successful');
  }

  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }

  static async getUserProfile(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createUserProfile(userId: string, profile: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([{
        id: userId,
        ...profile,
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Development/Testing utilities
  static async testConversationRetrieval() {
    console.log('🧪 AuthService: Testing conversation retrieval with Alice login...');
    
    try {
      // Test Alice login
      console.log('🔐 Testing Alice login...');
      const { data: { session }, error } = await supabase.auth.signInWithPassword({
        email: 'alice@test.com',
        password: '12345'
      });

      if (error) {
        console.error('❌ Alice login failed:', error);
        return;
      }

      console.log('✅ Alice logged in:', session.user.id);

      // Test fetching Alice's conversations
      console.log('📥 Testing conversation retrieval...');
      const { data: conversations, error: convError } = await supabase
        .from('dm_conversations')
        .select(`
          *,
          dm_conversation_participants!inner(
            user_id,
            user_profiles(username, display_name, avatar_url)
          ),
          messages(
            id,
            content,
            created_at,
            author_id,
            user_profiles(username)
          )
        `)
        .eq('dm_conversation_participants.user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (convError) {
        console.error('❌ Conversation fetch error:', convError);
      } else {
        console.log('✅ Alice conversations retrieved:', conversations);
        console.log('📊 Number of conversations:', conversations?.length || 0);

        // Look for Alice-Bob conversation
        const aliceBobConv = conversations?.find(conv => 
          conv.dm_conversation_participants.some(p => 
            p.user_profiles.username === 'bob'
          )
        );

        if (aliceBobConv) {
          console.log('✅ Alice-Bob conversation found:', aliceBobConv);
          console.log('💬 Messages in conversation:', aliceBobConv.messages?.length || 0);
        } else {
          console.log('ℹ️ Alice-Bob conversation not found');
        }
      }

      // Test session persistence
      console.log('🔄 Testing session persistence...');
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        console.log('✅ Session persisted successfully');
      } else {
        console.log('❌ Session not persisted');
      }

    } catch (error) {
      console.error('💥 Conversation test failed:', error);
    }
  }

  static async testSessionPersistence() {
    console.log('🔄 AuthService: Testing session persistence...');
    
    // Check localStorage
    const keys = Object.keys(localStorage).filter(key => key.includes('supabase'));
    console.log('📦 Supabase localStorage keys:', keys);
    
    if (keys.length > 0) {
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`🔑 ${key}:`, value ? 'Present' : 'Empty');
      });
    }

    // Check current session
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Session check error:', error);
    } else if (session) {
      console.log('✅ Current session found:', {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date(session.expires_at * 1000).toISOString()
      });
    } else {
      console.log('ℹ️ No current session');
    }
  }
}