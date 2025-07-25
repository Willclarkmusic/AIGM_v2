import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationService } from '../services/conversations';
import { supabase } from '../services/supabase';

// Mock fetch
global.fetch = vi.fn();

// Mock supabase
vi.mock('../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn()
    }
  }
}));

describe('ConversationService Authentication Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getConversations', () => {
    it('should fail when supabase.auth.getSession returns error', async () => {
      // Mock session failure
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: new Error('Session error')
      });

      await expect(ConversationService.getConversations()).rejects.toThrow('Not authenticated');
    });

    it('should fail when supabase.auth.getSession returns no session', async () => {
      // Mock no session
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null
      });

      await expect(ConversationService.getConversations()).rejects.toThrow('Not authenticated');
    });

    it('should make API call when authenticated', async () => {
      // Mock successful session
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { access_token: 'mock-access-token' } },
        error: null
      });

      // Mock successful API response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          conversations: [
            {
              id: 'conv-123',
              participants: [
                { id: 'alice-id', username: 'alice', display_name: 'Alice' },
                { id: 'bob-id', username: 'bob', display_name: 'Bob' }
              ],
              last_message: { content: 'Hello' },
              unread_count: 0
            }
          ],
          total: 1
        })
      });

      const result = await ConversationService.getConversations();

      // Verify fetch was called with correct headers
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations', {
        headers: {
          'Authorization': 'Bearer mock-access-token'
        }
      });

      // Verify result
      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].id).toBe('conv-123');
    });

    it('should handle API error responses', async () => {
      // Mock successful session
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { access_token: 'mock-token' } },
        error: null
      });

      // Mock API error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ detail: 'API Error' })
      });

      await expect(ConversationService.getConversations()).rejects.toThrow('API Error');
    });
  });

  describe('createConversation', () => {
    it('should create conversation with bob when authenticated as alice', async () => {
      // Mock Alice session
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { access_token: 'alice-token' } },
        error: null
      });

      // Mock successful conversation creation
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'alice-bob-conv',
          participants: [
            { id: 'alice-id', username: 'alice', display_name: 'Alice' },
            { id: 'bob-id', username: 'bob', display_name: 'Bob' }
          ],
          created_at: '2024-01-01T00:00:00Z',
          unread_count: 0
        })
      });

      const result = await ConversationService.createConversation('bob');

      // Verify correct API call
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer alice-token'
        },
        body: JSON.stringify({
          participant_username: 'bob'
        })
      });

      // Verify result
      expect(result.id).toBe('alice-bob-conv');
      expect(result.participants).toHaveLength(2);
    });

    it('should handle not friends error', async () => {
      // Mock session
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { access_token: 'token' } },
        error: null
      });

      // Mock API error for non-friend
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
});

describe('ConversationService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Alice-Bob Conversation Flow', () => {
    const mockAliceAuth = () => {
      (supabase.auth.getUser as any).mockResolvedValue({
        data: { user: { id: 'alice_123', email: 'alice@test.com' } },
        error: null
      });

      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { access_token: 'alice-session-token' } },
        error: null
      });
    };

    it('should retrieve existing Alice-Bob conversation', async () => {
      mockAliceAuth();

      // Mock API response with existing Alice-Bob conversation
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          conversations: [
            {
              id: 'alice-bob-existing',
              created_at: '2024-01-01T00:00:00Z',
              participants: [
                { 
                  id: 'alice_123', 
                  username: 'alice', 
                  display_name: 'Alice',
                  status: 'online'
                },
                { 
                  id: 'bob_456', 
                  username: 'bob', 
                  display_name: 'Bob',
                  status: 'online'
                }
              ],
              last_message: {
                content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello Bob!' }] }] },
                author_id: 'alice_123',
                created_at: '2024-01-01T12:00:00Z'
              },
              last_message_at: '2024-01-01T12:00:00Z',
              unread_count: 0
            }
          ],
          total: 1
        })
      });

      const result = await ConversationService.getConversations();

      expect(result.conversations).toHaveLength(1);
      expect(result.conversations[0].id).toBe('alice-bob-existing');
      expect(result.conversations[0].participants.some(p => p.username === 'bob')).toBe(true);
      expect(result.conversations[0].last_message).toBeDefined();
    });

    it('should create new conversation with Eve (blank conversation)', async () => {
      mockAliceAuth();

      // Mock successful conversation creation with Eve
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          id: 'alice-eve-new',
          created_at: '2024-01-02T00:00:00Z',
          participants: [
            { 
              id: 'alice_123', 
              username: 'alice', 
              display_name: 'Alice',
              status: 'online'
            },
            { 
              id: 'eve_789', 
              username: 'eve', 
              display_name: 'Eve',
              status: 'online'
            }
          ],
          last_message: null,
          last_message_at: null,
          unread_count: 0
        })
      });

      const result = await ConversationService.createConversation('eve');

      expect(result.id).toBe('alice-eve-new');
      expect(result.participants.some(p => p.username === 'eve')).toBe(true);
      expect(result.last_message).toBeNull();
      expect(result.unread_count).toBe(0);
    });

    it('should handle authentication token passing correctly', async () => {
      mockAliceAuth();

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ conversations: [], total: 0 })
      });

      await ConversationService.getConversations();

      // Verify the Authorization header format
      expect(global.fetch).toHaveBeenCalledWith('/api/conversations', {
        headers: {
          'Authorization': 'Bearer alice-session-token'
        }
      });
    });
  });
});

describe('ConversationService Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle network errors gracefully', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null
    });

    // Mock network error
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(ConversationService.getConversations()).rejects.toThrow('Network error');
  });

  it('should handle malformed API responses', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null
    });

    // Mock malformed response
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}) // No detail field
    });

    await expect(ConversationService.getConversations())
      .rejects.toThrow('Failed to get conversations');
  });

  it('should handle missing access token', async () => {
    // Mock session without access token
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: { access_token: '' } }, // Empty token
      error: null
    });

    await expect(ConversationService.getConversations()).rejects.toThrow('Not authenticated');
  });
});