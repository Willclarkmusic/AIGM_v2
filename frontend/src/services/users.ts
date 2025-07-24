import { supabase } from './supabase';
import type { User } from '../types/database';
import { DEFAULT_USER_SEARCH_LIMIT } from '../utils/constants';

export interface UserSearchResponse {
  users: User[];
  total: number;
  has_more: boolean;
  query: string;
  limit: number;
  offset: number;
}

export class UserService {
  /**
   * Search for users by username or display name
   */
  static async searchUsers(
    query: string,
    limit: number = DEFAULT_USER_SEARCH_LIMIT,
    offset: number = 0
  ): Promise<UserSearchResponse> {
    // Validate input
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    const trimmedQuery = query.trim();
    const currentUserId = await this.getCurrentUserId();

    // Query limit + 1 to check if there are more results
    const queryLimit = limit + 1;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .or(`username.ilike.%${trimmedQuery}%,display_name.ilike.%${trimmedQuery}%`)
      .neq('id', currentUserId)
      .limit(queryLimit);

    if (error) {
      throw new Error(error.message);
    }

    const users = data || [];
    const hasMore = users.length > limit;
    
    // Return only the requested limit
    const resultUsers = hasMore ? users.slice(0, limit) : users;

    return {
      users: resultUsers,
      total: resultUsers.length,
      has_more: hasMore,
      query: trimmedQuery,
      limit,
      offset,
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // User not found
      }
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    userId: string,
    updates: Partial<User>
  ): Promise<User> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get current user ID from auth session
   */
  static async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(error.message);
    }

    if (!user) {
      throw new Error('No authenticated user');
    }

    return user.id;
  }

  /**
   * Search users with friendship status included
   * This is useful for showing friend request buttons correctly
   */
  static async searchUsersWithFriendshipStatus(
    query: string,
    limit: number = DEFAULT_USER_SEARCH_LIMIT,
    offset: number = 0
  ): Promise<UserSearchResponse> {
    const currentUserId = await this.getCurrentUserId();
    
    // First get the basic search results
    const searchResults = await this.searchUsers(query, limit, offset);
    
    if (searchResults.users.length === 0) {
      return searchResults;
    }

    // Get friendship statuses for the found users
    const userIds = searchResults.users.map(user => user.id);
    
    const { data: friendships } = await supabase
      .from('friendships')
      .select('addressee_id, requester_id, status')
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.in.(${userIds.join(',')})),` +
        `and(addressee_id.eq.${currentUserId},requester_id.in.(${userIds.join(',')}))`
      );

    // Add friendship status to each user
    const usersWithStatus = searchResults.users.map(user => {
      const friendship = friendships?.find(f => 
        (f.requester_id === currentUserId && f.addressee_id === user.id) ||
        (f.addressee_id === currentUserId && f.requester_id === user.id)
      );

      return {
        ...user,
        friendship_status: friendship?.status || null,
        is_friend_requester: friendship?.requester_id === currentUserId,
      };
    });

    return {
      ...searchResults,
      users: usersWithStatus,
    };
  }

  /**
   * Get user's current status
   */
  static async getCurrentUserProfile(): Promise<User | null> {
    const currentUserId = await this.getCurrentUserId();
    return this.getUserById(currentUserId);
  }

  /**
   * Update current user's status
   */
  static async updateCurrentUserStatus(
    status: string,
    statusText?: string,
    statusColor?: string
  ): Promise<User> {
    const currentUserId = await this.getCurrentUserId();
    
    const updates: Partial<User> = {
      status: status as any,
      updated_at: new Date().toISOString(),
    };

    if (statusText !== undefined) {
      updates.status_text = statusText;
    }

    if (statusColor !== undefined) {
      updates.status_color = statusColor;
    }

    return this.updateUserProfile(currentUserId, updates);
  }
}