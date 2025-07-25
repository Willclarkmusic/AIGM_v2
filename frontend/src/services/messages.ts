import { supabase } from './supabase';

export interface MessageCreate {
  content: any; // TipTap JSON content
  dm_conversation_id?: string;
  room_id?: string;
}

export interface Message {
  id: string;
  content: any;
  author_id: string;
  dm_conversation_id?: string;
  room_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
  has_more: boolean;
  conversation_id: string;
}

export class MessageService {
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

    return session.access_token;
  }

  /**
   * Send a new message to a DM conversation
   */
  static async sendDMMessage(conversationId: string, content: any): Promise<Message> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/messages/conversations/${conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Send DM Message Error:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to send message');
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText || 'Unknown error'}`);
      }
    }

    return response.json();
  }

  /**
   * Send a new message to a room
   */
  static async sendRoomMessage(roomId: string, content: any): Promise<Message> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/messages/rooms/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Send Room Message Error:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to send message');
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText || 'Unknown error'}`);
      }
    }

    return response.json();
  }

  /**
   * Send a new message (legacy method - kept for compatibility)
   */
  static async sendMessage(messageData: MessageCreate): Promise<Message> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(messageData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send message');
    }

    return response.json();
  }

  /**
   * Get messages from a DM conversation
   */
  static async getDMMessages(
    conversationId: string, 
    limit: number = 50, 
    offset: number = 0,
    before?: string
  ): Promise<MessageListResponse> {
    const token = await this.getAuthToken();

    // Build query parameters
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    if (before) {
      params.append('before', before);
    }

    const response = await fetch(
      `${this.getApiBaseUrl()}/api/messages/dm/${conversationId}?${params.toString()}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Messages API Error Response:', response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.detail || 'Failed to get messages');
      } catch {
        throw new Error(`API Error: ${response.status} - ${errorText || 'Unknown error'}`);
      }
    }

    const responseText = await response.text();
    console.log('Messages API Response:', responseText.substring(0, 200) + '...');
    
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
   * Get messages from a room
   */
  static async getRoomMessages(
    roomId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<MessageListResponse> {
    const token = await this.getAuthToken();

    const response = await fetch(
      `${this.getApiBaseUrl()}/api/messages/room/${roomId}?limit=${limit}&offset=${offset}`, 
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get messages');
    }

    return response.json();
  }

  /**
   * Edit an existing message
   */
  static async editMessage(messageId: string, content: any): Promise<Message> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to edit message');
    }

    return response.json();
  }

  /**
   * Delete a message
   */
  static async deleteMessage(messageId: string): Promise<void> {
    const token = await this.getAuthToken();

    const response = await fetch(`${this.getApiBaseUrl()}/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete message');
    }
  }
}