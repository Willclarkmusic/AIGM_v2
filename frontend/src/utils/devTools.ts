import { AuthService } from '../services/auth';
import { supabase } from '../services/supabase';

// Development testing utilities
export const devTools = {
  // Test authentication persistence
  testAuth: AuthService.testSessionPersistence,
  
  // Test conversation retrieval with Alice
  testConversations: AuthService.testConversationRetrieval,
  
  // Quick Alice login for testing
  loginAsAlice: async () => {
    console.log('🧪 DevTools: Quick Alice login...');
    try {
      await supabase.auth.signInWithPassword({
        email: 'alice@test.com',
        password: '12345'
      });
      console.log('✅ DevTools: Alice login successful');
    } catch (error) {
      console.error('❌ DevTools: Alice login failed:', error);
    }
  },
  
  // Quick Bob login for testing
  loginAsBob: async () => {
    console.log('🧪 DevTools: Quick Bob login...');
    try {
      await supabase.auth.signInWithPassword({
        email: 'bob@test.com',
        password: '12345'
      });
      console.log('✅ DevTools: Bob login successful');
    } catch (error) {
      console.error('❌ DevTools: Bob login failed:', error);
    }
  },
  
  // Check current session
  checkSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ Session check error:', error);
    } else {
      console.log('📋 Current session:', session ? {
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date(session.expires_at * 1000).toISOString()
      } : 'No session');
    }
    return session;
  },
  
  // Clear all auth data
  clearAuth: async () => {
    console.log('🧹 DevTools: Clearing all auth data...');
    await supabase.auth.signOut();
    localStorage.clear();
    console.log('✅ DevTools: Auth data cleared');
  },
  
  // Test conversation API directly
  testConversationAPI: async () => {
    console.log('🧪 DevTools: Testing conversation API...');
    const session = await devTools.checkSession();
    if (!session) {
      console.log('❌ No session found. Login first.');
      return;
    }
    
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Conversation API response:', data);
      } else {
        console.error('❌ Conversation API error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('❌ Conversation API request failed:', error);
    }
  }
};

// Expose devTools globally for browser console access
if (typeof window !== 'undefined') {
  (window as any).devTools = devTools;
  console.log('🛠️ DevTools available as window.devTools');
  console.log('Available commands:');
  console.log('  devTools.loginAsAlice() - Quick login as Alice');
  console.log('  devTools.loginAsBob() - Quick login as Bob');
  console.log('  devTools.checkSession() - Check current session');
  console.log('  devTools.testAuth() - Test auth persistence');
  console.log('  devTools.testConversations() - Test conversation retrieval');
  console.log('  devTools.testConversationAPI() - Test conversation API endpoint');
  console.log('  devTools.clearAuth() - Clear all auth data');
}