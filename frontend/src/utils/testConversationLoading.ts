/**
 * Manual test utility for conversation loading
 * Use this in browser console to test conversation loading
 */

import { ConversationService } from '../services/conversations';
import { supabase } from '../services/supabase';

export const testConversationLoading = async () => {
  console.log('🧪 Testing conversation loading...');
  
  try {
    // Check if user is authenticated
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.error('❌ No active session found. Please log in first.');
      return;
    }
    
    console.log('✅ Active session found for user:', session.user.id);
    console.log('🔑 Token:', session.access_token.substring(0, 20) + '...');
    
    // Test conversation loading
    console.log('📱 Loading conversations...');
    const conversations = await ConversationService.getConversations();
    
    console.log('✅ Conversations loaded successfully!');
    console.log('📊 Total conversations:', conversations.total);
    console.log('📝 Conversations:', conversations.conversations);
    
    // If there are conversations, test loading a specific one
    if (conversations.conversations.length > 0) {
      const firstConversation = conversations.conversations[0];
      console.log('🔍 Loading specific conversation:', firstConversation.id);
      
      const specificConversation = await ConversationService.getConversation(firstConversation.id);
      console.log('✅ Specific conversation loaded:', specificConversation);
    }
    
    return conversations;
    
  } catch (error) {
    console.error('❌ Conversation loading failed:', error);
    throw error;
  }
};

// Export for global access
(window as any).testConversationLoading = testConversationLoading;