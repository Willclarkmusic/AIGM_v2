import React, { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  content: any; // TipTap JSON content
  author_id: string;
  created_at: string;
  updated_at?: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  conversationId: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  conversationId
}) => {
  const { profile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-gray-500 dark:text-gray-400">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="text-lg mb-2">No messages yet</div>
          <div className="text-sm">Start the conversation by sending a message below</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
    >
      {messages.map((message, index) => {
        const previousMessage = index > 0 ? messages[index - 1] : null;
        const isGrouped = previousMessage && 
          previousMessage.author_id === message.author_id &&
          (new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime()) < 300000; // 5 minutes

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.author_id === profile?.id}
            isGrouped={isGrouped}
            showTimestamp={!isGrouped}
          />
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};
