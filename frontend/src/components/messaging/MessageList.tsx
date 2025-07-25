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
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isLoading,
  conversationId,
  hasMore = false,
  onLoadMore,
  isLoadingMore = false
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

  // Sort messages to show oldest first (chronological order)
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col overflow-hidden"
    >
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Load More Button */}
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center py-4">
            <button
              onClick={onLoadMore}
              disabled={isLoadingMore}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingMore ? 'Loading...' : 'Load More Messages'}
            </button>
          </div>
        )}

        {sortedMessages.map((message, index) => {
          const previousMessage = index > 0 ? sortedMessages[index - 1] : null;
          const isGrouped = previousMessage && 
            previousMessage.author_id === message.author_id &&
            (new Date(message.created_at).getTime() - new Date(previousMessage.created_at).getTime()) < 300000; // 5 minutes

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={Boolean(profile?.id && message.author_id === profile.id)}
              isGrouped={isGrouped}
              showTimestamp={!isGrouped}
            />
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
