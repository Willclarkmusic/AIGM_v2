import { useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface Message {
  id: string;
  content: any;
  author_id: string;
  dm_conversation_id?: string;
  room_id?: string;
  created_at: string;
  updated_at?: string;
}

interface UseRealtimeMessagesProps {
  conversationId?: string;
  roomId?: string;
  onNewMessage: (message: Message) => void;
  onMessageUpdate: (message: Message) => void;
  onMessageDelete: (messageId: string) => void;
}

export const useRealtimeMessages = ({
  conversationId,
  roomId,
  onNewMessage,
  onMessageUpdate,
  onMessageDelete
}: UseRealtimeMessagesProps) => {
  const handleInsert = useCallback((payload: any) => {
    const newMessage = payload.new as Message;
    console.log('Real-time message received:', newMessage);
    
    // Only handle messages for the current conversation/room
    if (conversationId && newMessage.dm_conversation_id === conversationId) {
      onNewMessage(newMessage);
    } else if (roomId && newMessage.room_id === roomId) {
      onNewMessage(newMessage);
    }
  }, [conversationId, roomId, onNewMessage]);

  const handleUpdate = useCallback((payload: any) => {
    const updatedMessage = payload.new as Message;
    console.log('Real-time message update:', updatedMessage);
    
    // Only handle messages for the current conversation/room
    if (conversationId && updatedMessage.dm_conversation_id === conversationId) {
      onMessageUpdate(updatedMessage);
    } else if (roomId && updatedMessage.room_id === roomId) {
      onMessageUpdate(updatedMessage);
    }
  }, [conversationId, roomId, onMessageUpdate]);

  const handleDelete = useCallback((payload: any) => {
    const deletedMessage = payload.old as Message;
    console.log('Real-time message delete:', deletedMessage);
    
    // Only handle messages for the current conversation/room
    if (conversationId && deletedMessage.dm_conversation_id === conversationId) {
      onMessageDelete(deletedMessage.id);
    } else if (roomId && deletedMessage.room_id === roomId) {
      onMessageDelete(deletedMessage.id);
    }
  }, [conversationId, roomId, onMessageDelete]);

  useEffect(() => {
    if (!conversationId && !roomId) return;

    let channel: RealtimeChannel;

    // Create channel name based on whether it's DM or room
    const channelName = conversationId 
      ? `dm-${conversationId}` 
      : `room-${roomId}`;

    console.log(`Setting up real-time subscription for ${channelName}`);

    // Set up Supabase real-time subscription
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: conversationId 
            ? `dm_conversation_id=eq.${conversationId}`
            : `room_id=eq.${roomId}`
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: conversationId 
            ? `dm_conversation_id=eq.${conversationId}`
            : `room_id=eq.${roomId}`
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: conversationId 
            ? `dm_conversation_id=eq.${conversationId}`
            : `room_id=eq.${roomId}`
        },
        handleDelete
      )
      .subscribe((status) => {
        console.log(`Real-time subscription status for ${channelName}:`, status);
      });

    // Cleanup function
    return () => {
      console.log(`Cleaning up real-time subscription for ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [conversationId, roomId, handleInsert, handleUpdate, handleDelete]);
};