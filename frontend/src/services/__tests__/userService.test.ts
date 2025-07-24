import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { User, Friendship } from '../../types/database';

// Mock the supabase client using factory function for Vitest hoisting
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
    table: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  },
}));

// Import services and supabase after mocking
import { UserService } from '../users';
import { FriendService } from '../friends';
import { supabase } from '../supabase';

// Get the mocked supabase with proper typing
const mockedSupabase = supabase as any;

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          username: 'alice',
          display_name: 'Alice Johnson',
          avatar_url: null,
          status: 'online',
          status_text: 'Working',
          status_color: '#22c55e',
        },
        {
          id: 'user-2',
          username: 'alicia',
          display_name: 'Alicia Smith',
          avatar_url: 'https://example.com/avatar.jpg',
          status: 'idle',
          status_text: 'Away',
          status_color: '#f59e0b',
        },
      ];

      const mockResponse = {
        data: mockUsers,
        error: null,
        count: 2,
      };

      // Setup auth mock
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'current-user-id' } },
        error: null
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResponse),
      };

      mockedSupabase.from.mockReturnValue(mockQuery);

      const result = await UserService.searchUsers('alice', 10, 0);

      expect(mockedSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.or).toHaveBeenCalledWith(
        'username.ilike.%alice%,display_name.ilike.%alice%'
      );
      expect(mockQuery.neq).toHaveBeenCalledWith('id', expect.any(String));
      expect(mockQuery.limit).toHaveBeenCalledWith(11); // limit + 1 for has_more check

      expect(result).toEqual({
        users: mockUsers,
        total: mockUsers.length,
        has_more: false,
        query: 'alice',
        limit: 10,
        offset: 0,
      });
    });

    it('should handle search with has_more true', async () => {
      const mockUsers = new Array(11).fill(0).map((_, index) => ({
        id: `user-${index}`,
        username: `alice${index}`,
        display_name: `Alice ${index}`,
        avatar_url: null,
        status: 'online',
        status_text: '',
        status_color: '#22c55e',
      }));

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(
          Promise.resolve({ data: mockUsers, error: null, count: 11 })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await UserService.searchUsers('alice', 10, 0);

      expect(result.users).toHaveLength(10); // Should return only requested limit
      expect(result.has_more).toBe(true);
      expect(result.total).toBe(10);
    });

    it('should handle empty search results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(
          Promise.resolve({ data: [], error: null, count: 0 })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await UserService.searchUsers('nonexistent', 10, 0);

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.has_more).toBe(false);
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(
          Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' },
            count: 0,
          })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(UserService.searchUsers('alice', 10, 0)).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('should validate input parameters', async () => {
      // Empty query
      await expect(UserService.searchUsers('', 10, 0)).rejects.toThrow(
        'Search query cannot be empty'
      );

      // Invalid limit
      await expect(UserService.searchUsers('alice', 0, 0)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );
      await expect(UserService.searchUsers('alice', 101, 0)).rejects.toThrow(
        'Limit must be between 1 and 100'
      );

      // Invalid offset
      await expect(UserService.searchUsers('alice', 10, -1)).rejects.toThrow(
        'Offset must be non-negative'
      );
    });

    it('should escape special characters in search query', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(
          Promise.resolve({ data: [], error: null, count: 0 })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await UserService.searchUsers('alice@#$%', 10, 0);

      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('alice@#$%')
      );
    });

    it('should filter current user from results', async () => {
      const mockCurrentUserId = 'current-user-id';
      
      // Mock getCurrentUser to return a user ID
      vi.spyOn(UserService, 'getCurrentUserId').mockResolvedValue(mockCurrentUserId);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnValue(
          Promise.resolve({ data: [], error: null, count: 0 })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await UserService.searchUsers('alice', 10, 0);

      expect(mockQuery.neq).toHaveBeenCalledWith('id', mockCurrentUserId);
    });
  });

  describe('getUserById', () => {
    it('should get user by ID successfully', async () => {
      const mockUser = {
        id: 'user-1',
        username: 'alice',
        display_name: 'Alice Johnson',
        avatar_url: null,
        status: 'online',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({ data: mockUser, error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await UserService.getUserById('user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result).toEqual(mockUser);
    });

    it('should handle user not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({
            data: null,
            error: { code: 'PGRST116', message: 'No rows returned' },
          })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await UserService.getUserById('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({
            data: null,
            error: { message: 'Database error' },
          })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(UserService.getUserById('user-1')).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updates = {
        display_name: 'New Display Name',
        status_text: 'New Status',
      };

      const mockUpdatedUser = {
        id: 'user-1',
        username: 'alice',
        display_name: 'New Display Name',
        status_text: 'New Status',
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({ data: mockUpdatedUser, error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await UserService.updateUserProfile('user-1', updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'user-1');
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle update errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({
            data: null,
            error: { message: 'Update failed' },
          })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        UserService.updateUserProfile('user-1', { display_name: 'New Name' })
      ).rejects.toThrow('Update failed');
    });
  });
});

describe('FriendService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendFriendRequest', () => {
    it('should send friend request successfully', async () => {
      const mockFriendship = {
        id: 'friendship-1',
        requester_id: 'current-user-id',
        addressee_id: 'target-user-id',
        status: 'pending',
        action_user_id: 'current-user-id',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({ data: mockFriendship, error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FriendService.sendFriendRequest('target-user-id');

      expect(mockSupabase.from).toHaveBeenCalledWith('friendships');
      expect(mockQuery.insert).toHaveBeenCalledWith({
        addressee_id: 'target-user-id',
        status: 'pending',
      });
      expect(result).toEqual(mockFriendship);
    });

    it('should handle send request errors', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({
            data: null,
            error: { message: 'Friendship already exists' },
          })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        FriendService.sendFriendRequest('target-user-id')
      ).rejects.toThrow('Friendship already exists');
    });
  });

  describe('acceptFriendRequest', () => {
    it('should accept friend request successfully', async () => {
      const mockUpdatedFriendship = {
        id: 'friendship-1',
        status: 'accepted',
        action_user_id: 'current-user-id',
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({ data: mockUpdatedFriendship, error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FriendService.acceptFriendRequest('friendship-1');

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'accepted',
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedFriendship);
    });
  });

  describe('blockFriendRequest', () => {
    it('should block friend request successfully', async () => {
      const mockUpdatedFriendship = {
        id: 'friendship-1',
        status: 'blocked',
        action_user_id: 'current-user-id',
      };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnValue(
          Promise.resolve({ data: mockUpdatedFriendship, error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FriendService.blockFriendRequest('friendship-1');

      expect(mockQuery.update).toHaveBeenCalledWith({
        status: 'blocked',
        updated_at: expect.any(String),
      });
      expect(result).toEqual(mockUpdatedFriendship);
    });
  });

  describe('getFriendships', () => {
    it('should get friendships successfully', async () => {
      const mockFriendships = [
        {
          id: 'friendship-1',
          requester_id: 'current-user-id',
          addressee_id: 'friend-1',
          status: 'accepted',
          requester: { id: 'current-user-id', username: 'current_user' },
          addressee: { id: 'friend-1', username: 'friend1' },
        },
        {
          id: 'friendship-2',
          requester_id: 'friend-2',
          addressee_id: 'current-user-id',
          status: 'pending',
          requester: { id: 'friend-2', username: 'friend2' },
          addressee: { id: 'current-user-id', username: 'current_user' },
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(
          Promise.resolve({ data: mockFriendships, error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await FriendService.getFriendships('accepted');

      expect(mockSupabase.from).toHaveBeenCalledWith('friendships');
      expect(mockQuery.select).toHaveBeenCalledWith(`
        *,
        requester:users!friendships_requester_id_fkey(*),
        addressee:users!friendships_addressee_id_fkey(*)
      `);
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'accepted');
      expect(result).toEqual({
        friendships: mockFriendships,
        total: mockFriendships.length,
      });
    });

    it('should get all friendships when no status filter provided', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnValue(
          Promise.resolve({ data: [], error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await FriendService.getFriendships();

      expect(mockQuery.eq).not.toHaveBeenCalled();
    });
  });

  describe('deleteFriendship', () => {
    it('should delete friendship successfully', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(
          Promise.resolve({ error: null })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        FriendService.deleteFriendship('friendship-1')
      ).resolves.not.toThrow();

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'friendship-1');
    });

    it('should handle delete errors', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue(
          Promise.resolve({ error: { message: 'Delete failed' } })
        ),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await expect(
        FriendService.deleteFriendship('friendship-1')
      ).rejects.toThrow('Delete failed');
    });
  });

  describe('getCurrentUserId', () => {
    it('should get current user ID from auth', async () => {
      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'current-user-id' } },
          error: null,
        }),
      };

      // Mock supabase auth
      (mockSupabase as any).auth = mockAuth;

      const result = await FriendService.getCurrentUserId();

      expect(mockAuth.getUser).toHaveBeenCalled();
      expect(result).toBe('current-user-id');
    });

    it('should throw error when user not authenticated', async () => {
      const mockAuth = {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      };

      (mockSupabase as any).auth = mockAuth;

      await expect(FriendService.getCurrentUserId()).rejects.toThrow(
        'No authenticated user'
      );
    });
  });
});

// Integration-style tests
describe('UserService and FriendService Integration', () => {
  it('should work together for user search and friend requests', async () => {
    // Mock finding a user
    const mockUser = {
      id: 'target-user-id',
      username: 'alice',
      display_name: 'Alice Johnson',
    };

    const userSearchMock = {
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnValue(
        Promise.resolve({ data: [mockUser], error: null })
      ),
    };

    // Mock sending friend request
    const friendRequestMock = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnValue(
        Promise.resolve({
          data: {
            id: 'friendship-1',
            requester_id: 'current-user-id',
            addressee_id: 'target-user-id',
            status: 'pending',
          },
          error: null,
        })
      ),
    };

    mockSupabase.from
      .mockReturnValueOnce(userSearchMock)
      .mockReturnValueOnce(friendRequestMock);

    // Search for user
    const searchResult = await UserService.searchUsers('alice', 10, 0);
    expect(searchResult.users).toHaveLength(1);

    // Send friend request to found user
    const friendshipResult = await FriendService.sendFriendRequest(
      searchResult.users[0].id
    );
    expect(friendshipResult.status).toBe('pending');
    expect(friendshipResult.addressee_id).toBe('target-user-id');
  });
});