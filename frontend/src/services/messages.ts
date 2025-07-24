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
   * Send a new message
   */
  static async sendMessage(messageData: MessageCreate): Promise<Message> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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
    offset: number = 0
  ): Promise<MessageListResponse> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `/api/messages/dm/${conversationId}?limit=${limit}&offset=${offset}`, 
      {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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
   * Get messages from a room
   */
  static async getRoomMessages(
    roomId: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<MessageListResponse> {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(
      `/api/messages/room/${roomId}?limit=${limit}&offset=${offset}`, 
      {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`/api/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to delete message');
    }
  }
}