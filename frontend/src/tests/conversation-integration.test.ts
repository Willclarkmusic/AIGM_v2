import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationService } from '../services/conversations';
import { supabase } from '../services/supabase';

// Mock fetch for integration tests
global.fetch = vi.fn();

// Mock supabase with real session behavior
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn()
    }
  }
}));

describe('ConversationService Integration Tests', () => {
  const mockSession = {
    access_token: 'mock-jwt-token-12345',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    token_type: 'bearer',
    user: {
      id: 'alice_123',
      email: 'alice@test.com'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful session
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: mockSession },
      error: null
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication Token Handling', () => {
    it('should extract token from session correctly', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ conversations: [], total: 0 })
      });

      await ConversationService.getConversations();

      expect(global.fetch).toHaveBeenCalledWith('/api/conversations', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-12345'
        }
      });
    });

    it('should throw error when no session exists', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(ConversationService.getConversations()).rejects.toThrow('Not authenticated');
    });

    it('should throw error when session has error', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: new Error('Session expired')
      });

      await expect(ConversationService.getConversations()).rejects.toThrow('Not authenticated');
    });

    it('should throw error when session has no access token', async () => {
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { 
          session: { 
            ...mockSession, 
            access_token: null 
          } 
        },
        error: null
      });

      await expect(ConversationService.getConversations()).rejects.toThrow('Not authenticated');
    });
  });

  describe('Alice-Bob Conversation Loading', () => {
    it('should load Alice-Bob conversation successfully', async () => {
      const mockAliceBobConversation = {
        conversations: [
          {
            id: 'conv_alice_bob_123',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T12:00:00Z',
            participants: [
              {
                id: 'alice_123',
                username: 'alice',
                display_name: 'Alice Demo',
                status: 'online',
                avatar_url: null,
                status_color: null,
                status_text: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              },
              {
                id: 'bob_456',
                username: 'bob',
                display_name: 'Bob Smith',
                status: 'online',
                avatar_url: null,
                status_color: null,
                status_text: null,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z'
              }
            ],
            last_message: {
              id: 'msg_123',
              content: {
                type: 'doc',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'text',
                        text: 'Hello Bob! How are you doing?'
                      }
                    ]
                  }
                ]
              },
              author_id: 'alice_123',
              created_at: '2024-01-01T12:00:00Z'
            },
            last_message_at: '2024-01-01T12:00:00Z',
            unread_count: 0
          }
        ],
        total: 1
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockAliceBobConversation)
      });

      const result = await ConversationService.getConversations();

      // Verify the API call
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-12345'
        }
      });

      // Verify the response structure
      expect(result.conversations).toHaveLength(1);
      expect(result.total).toBe(1);
      
      const conversation = result.conversations[0];
      expect(conversation.id).toBe('conv_alice_bob_123');
      expect(conversation.participants).toHaveLength(2);
      
      // Verify Alice participant
      const alice = conversation.participants.find(p => p.username === 'alice');
      expect(alice).toBeDefined();
      expect(alice?.id).toBe('alice_123');
      expect(alice?.display_name).toBe('Alice Demo');
      
      // Verify Bob participant
      const bob = conversation.participants.find(p => p.username === 'bob');
      expect(bob).toBeDefined();
      expect(bob?.id).toBe('bob_456');
      expect(bob?.display_name).toBe('Bob Smith');
      
      // Verify last message
      expect(conversation.last_message).toBeDefined();
      expect(conversation.last_message?.author_id).toBe('alice_123');
      expect(conversation.last_message?.content.content[0].content[0].text).toBe('Hello Bob! How are you doing?');
      expect(conversation.unread_count).toBe(0);
    });

    it('should handle empty conversations list', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ conversations: [], total: 0 })
      });

      const result = await ConversationService.getConversations();

      expect(result.conversations).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ 
          detail: 'User not found or not authorized' 
        })
      });

      await expect(ConversationService.getConversations())
        .rejects.toThrow('User not found or not authorized');
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network connection failed'));

      await expect(ConversationService.getConversations())
        .rejects.toThrow('Network connection failed');
    });
  });

  describe('Blank Conversation Flow', () => {
    it('should create new conversation with Eve successfully', async () => {
      const mockNewConversation = {
        id: 'conv_alice_eve_new',
        created_at: '2024-01-02T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
        participants: [
          {
            id: 'alice_123',
            username: 'alice',
            display_name: 'Alice Demo',
            status: 'online',
            avatar_url: null,
            status_color: null,
            status_text: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'eve_789',
            username: 'eve',
            display_name: 'Eve Wilson',
            status: 'online',
            avatar_url: null,
            status_color: null,
            status_text: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        last_message: null,
        last_message_at: null,
        unread_count: 0
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNewConversation)
      });

      const result = await ConversationService.createConversation('eve');

      // Verify the API call
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-12345'
        },
        body: JSON.stringify({
          participant_username: 'eve'
        })
      });

      // Verify the response
      expect(result.id).toBe('conv_alice_eve_new');
      expect(result.participants).toHaveLength(2);
      expect(result.last_message).toBeNull();
      expect(result.last_message_at).toBeNull();
      expect(result.unread_count).toBe(0);

      // Verify participants
      const alice = result.participants.find(p => p.username === 'alice');
      const eve = result.participants.find(p => p.username === 'eve');
      expect(alice).toBeDefined();
      expect(eve).toBeDefined();
      expect(eve?.display_name).toBe('Eve Wilson');
    });

    it('should handle friend not found error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ 
          detail: 'User not found' 
        })
      });

      await expect(ConversationService.createConversation('nonexistent'))
        .rejects.toThrow('User not found');
    });

    it('should handle not friends error', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ 
          detail: 'You can only start conversations with friends' 
        })
      });

      await expect(ConversationService.createConversation('stranger'))
        .rejects.toThrow('You can only start conversations with friends');
    });
  });

  describe('Specific Conversation Loading', () => {
    it('should load specific Alice-Bob conversation', async () => {
      const mockConversation = {
        id: 'conv_alice_bob_123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T12:00:00Z',
        participants: [
          {
            id: 'alice_123',
            username: 'alice',
            display_name: 'Alice Demo',
            status: 'online',
            avatar_url: null,
            status_color: null,
            status_text: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          },
          {
            id: 'bob_456',
            username: 'bob',
            display_name: 'Bob Smith',
            status: 'online',
            avatar_url: null,
            status_color: null,
            status_text: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z'
          }
        ],
        last_message: {
          id: 'msg_123',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Hello Bob! How are you doing?'
                  }
                ]
              }
            ]
          },
          author_id: 'alice_123',
          created_at: '2024-01-01T12:00:00Z'
        },
        last_message_at: '2024-01-01T12:00:00Z',
        unread_count: 0
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockConversation)
      });

      const result = await ConversationService.getConversation('conv_alice_bob_123');

      // Verify the API call
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations/conv_alice_bob_123', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-12345'
        }
      });

      // Verify the response
      expect(result.id).toBe('conv_alice_bob_123');
      expect(result.participants).toHaveLength(2);
      expect(result.last_message).toBeDefined();
    });

    it('should handle conversation not found', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ 
          detail: 'Conversation not found' 
        })
      });

      await expect(ConversationService.getConversation('nonexistent'))
        .rejects.toThrow('Conversation not found');
    });
  });

  describe('API Response Validation', () => {
    it('should handle malformed API responses', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}) // No detail field
      });

      await expect(ConversationService.getConversations())
        .rejects.toThrow('Failed to get conversations');
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(ConversationService.getConversations())
        .rejects.toThrow('Invalid JSON');
    });
  });
});