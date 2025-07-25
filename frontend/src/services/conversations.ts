import { supabase } from './supabase';
import type { User } from '../types/database';

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at?: string;
  participants: User[];
  last_message?: any;
  last_message_at?: string;
  unread_count: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export class ConversationService {
  /**
   * Get the API base URL
   */
  private static getApiBaseUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || '';
  }

  /**
   * Get the current auth token from Supabase
   */
  private static async getAuthToken(): Promise<string> {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.access_token) {
      throw new Error('Not authenticated');
    }

    const token = session.access_token;
    console.log('Using auth token:', token.substring(0, 50) + '...');
    return token;
  }

  /**
   * Create a new conversation or find existing one with another user
   */
  static async createConversation(participantUsername: string): Promise<Conversation> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        participant_username: participantUsername,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to create conversation');
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText || 'Unknown error'}`);
      }
    }

    const responseText = await response.text();
    console.log('Create Conversation Response:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Empty response from server');
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response Text:', responseText);
      throw new Error('Invalid JSON response from server');
    }
  }

  /**
   * Get all conversations for the current user
   */
  static async getConversations(): Promise<ConversationListResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to get conversations');
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText || 'Unknown error'}`);
      }
    }

    const responseText = await response.text();
    console.log('API Response Text:', responseText);
    
    if (!responseText.trim()) {
      throw new Error('Empty response from server');
    }

    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Response Text:', responseText);
      throw new Error('Invalid JSON response from server');
    }
  }

  /**
   * Get a specific conversation
   */
  static async getConversation(conversationId: string): Promise<Conversation> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/conversations/${conversationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get conversation');
    }

    return response.json();
  }

  /**
   * Delete a conversation
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete conversation');
    }
  }

  /**
   * Get the other participant in a 1:1 conversation
   */
  static getOtherParticipant(conversation: Conversation, currentUserId: string): User | null {
    return conversation.participants.find(p => p.id !== currentUserId) || null;
  }

  /**
   * Format last message timestamp for display
   */
  static formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
    }
  }
}