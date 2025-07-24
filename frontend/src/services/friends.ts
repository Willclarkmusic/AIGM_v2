import { supabase } from './supabase';
import type { Friendship, User } from '../types/database';

export interface FriendshipResponse extends Friendship {
  requester?: User;
  addressee?: User;
}

export interface FriendshipListResponse {
  friendships: FriendshipResponse[];
  total: number;
}

export class FriendService {
  /**
   * Send a friend request to another user by their username
   */
  static async sendFriendRequest(addresseeUsername: string): Promise<FriendshipResponse> {
    const currentUserId = await this.getCurrentUserId();
    
    // First, find the user by username
    const { data: targetUser, error: userError } = await supabase
      .from('user_profiles')
      .select('id, username')
      .eq('username', addresseeUsername.toLowerCase())
      .single();

    if (userError || !targetUser) {
      throw new Error(`User '${addresseeUsername}' not found`);
    }

    // Check if trying to friend yourself
    if (targetUser.id === currentUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check for existing friendship
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('status')
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${targetUser.id}),` +
        `and(requester_id.eq.${targetUser.id},addressee_id.eq.${currentUserId})`
      )
      .single();

    if (existingFriendship) {
      const status = existingFriendship.status;
      if (status === 'pending') {
        throw new Error('Friend request already pending');
      } else if (status === 'accepted') {
        throw new Error('You are already friends with this user');
      } else if (status === 'blocked') {
        throw new Error('Cannot send friend request to this user');
      }
    }

    // Create the friend request
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUserId,
        addressee_id: targetUser.id,
        status: 'pending',
        action_user_id: currentUserId,
      })
      .select(`
        *,
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Send a friend request to another user by their ID
   */
  static async sendFriendRequestById(addresseeId: string): Promise<FriendshipResponse> {
    const currentUserId = await this.getCurrentUserId();

    // Check if trying to friend yourself
    if (addresseeId === currentUserId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check for existing friendship
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('status')
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${addresseeId}),` +
        `and(requester_id.eq.${addresseeId},addressee_id.eq.${currentUserId})`
      )
      .single();

    if (existingFriendship) {
      const status = existingFriendship.status;
      if (status === 'pending') {
        throw new Error('Friend request already pending');
      } else if (status === 'accepted') {
        throw new Error('You are already friends with this user');
      } else if (status === 'blocked') {
        throw new Error('Cannot send friend request to this user');
      }
    }

    // Create the friend request
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        requester_id: currentUserId,
        addressee_id: addresseeId,
        status: 'pending',
        action_user_id: currentUserId,
      })
      .select(`
        *,
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Accept a friend request
   */
  static async acceptFriendRequest(friendshipId: string): Promise<FriendshipResponse> {
    const currentUserId = await this.getCurrentUserId();

    const { data, error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        action_user_id: currentUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipId)
      .select(`
        *,
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Block/decline a friend request
   */
  static async blockFriendRequest(friendshipId: string): Promise<FriendshipResponse> {
    const currentUserId = await this.getCurrentUserId();

    const { data, error } = await supabase
      .from('friendships')
      .update({
        status: 'blocked',
        action_user_id: currentUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', friendshipId)
      .select(`
        *,
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get user's friendships with optional status filter
   */
  static async getFriendships(status?: string): Promise<FriendshipListResponse> {
    const currentUserId = await this.getCurrentUserId();

    let query = supabase
      .from('friendships')
      .select(`
        *,
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return {
      friendships: data || [],
      total: data?.length || 0,
    };
  }

  /**
   * Delete a friendship (cancel request or remove friend)
   */
  static async deleteFriendship(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Get a simple list of accepted friends
   */
  static async getFriendsList(): Promise<User[]> {
    const currentUserId = await this.getCurrentUserId();

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
      .eq('status', 'accepted');

    if (error) {
      throw new Error(error.message);
    }

    // Extract the friend (the other user in each friendship)
    const friends: User[] = [];
    for (const friendship of data || []) {
      if (friendship.requester && friendship.addressee) {
        if (friendship.requester.id === currentUserId) {
          friends.push(friendship.addressee as User);
        } else if (friendship.addressee.id === currentUserId) {
          friends.push(friendship.requester as User);
        }
      }
    }

    return friends;
  }

  /**
   * Get pending friend requests (both received and sent)
   */
  static async getPendingRequests(): Promise<{
    received: FriendshipResponse[];
    sent: FriendshipResponse[];
  }> {
    const result = await this.getFriendships('pending');
    const currentUserId = await this.getCurrentUserId();

    const received = result.friendships.filter(
      friendship => friendship.addressee_id === currentUserId
    );

    const sent = result.friendships.filter(
      friendship => friendship.requester_id === currentUserId
    );

    return { received, sent };
  }

  /**
   * Get friendship status between current user and another user
   */
  static async getFriendshipStatus(otherUserId: string): Promise<{
    status: string | null;
    friendship: FriendshipResponse | null;
    isRequester: boolean;
  }> {
    const currentUserId = await this.getCurrentUserId();

    const { data } = await supabase
      .from('friendships')
      .select(`
        *,
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .or(
        `and(requester_id.eq.${currentUserId},addressee_id.eq.${otherUserId}),` +
        `and(requester_id.eq.${otherUserId},addressee_id.eq.${currentUserId})`
      )
      .single();

    if (!data) {
      return {
        status: null,
        friendship: null,
        isRequester: false,
      };
    }

    return {
      status: data.status,
      friendship: data,
      isRequester: data.requester_id === currentUserId,
    };
  }

  /**
   * Get current user ID from auth
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
   * Check if two users are friends
   */
  static async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const { data } = await supabase
      .from('friendships')
      .select('status')
      .or(
        `and(requester_id.eq.${userId1},addressee_id.eq.${userId2}),` +
        `and(requester_id.eq.${userId2},addressee_id.eq.${userId1})`
      )
      .eq('status', 'accepted')
      .single();

    return !!data;
  }

  /**
   * Get mutual friends between current user and another user
   */
  static async getMutualFriends(otherUserId: string): Promise<User[]> {
    
    // Get current user's friends
    const currentUserFriends = await this.getFriendsList();
    const currentUserFriendIds = currentUserFriends.map(f => f.id);

    if (currentUserFriendIds.length === 0) {
      return [];
    }

    // Get other user's friends that are also current user's friends
    const { data } = await supabase
      .from('friendships')
      .select(`
        requester:user_profiles!friendships_requester_id_fkey(*),
        addressee:user_profiles!friendships_addressee_id_fkey(*)
      `)
      .or(`requester_id.eq.${otherUserId},addressee_id.eq.${otherUserId}`)
      .eq('status', 'accepted');

    const mutualFriends: User[] = [];
    for (const friendship of data || []) {
      if (friendship.requester && friendship.addressee) {
        const friend = friendship.requester.id === otherUserId 
          ? friendship.addressee 
          : friendship.requester;
        
        if (friend && currentUserFriendIds.includes(friend.id)) {
          mutualFriends.push(friend as User);
        }
      }
    }

    return mutualFriends;
  }
}