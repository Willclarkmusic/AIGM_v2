import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import Avatar from '../ui/Avatar';
import { TipTapRenderer } from './TipTapRenderer';

interface Message {
  id: string;
  content: any; // TipTap JSON content
  author_id: string;
  created_at: string;
  updated_at?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  isGrouped: boolean;
  showTimestamp: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  isGrouped,
  showTimestamp
}) => {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  return (
    <div className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''} ${isGrouped ? 'mt-1' : 'mt-4'}`}>
      {/* Avatar - only show for first message in group */}
      <div className="flex-shrink-0">
        {!isGrouped ? (
          <Avatar
            name="User" // We'll need to get user data for this
            size="sm"
            className="ring-2 ring-white dark:ring-gray-800"
          />
        ) : (
          <div className="w-8 h-8" /> // Spacer to maintain alignment
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${isOwn ? 'text-right' : 'text-left'}`}>
        {/* Timestamp - only show for first message in group */}
        {showTimestamp && (
          <div className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTimestamp(message.created_at)}
            {message.updated_at && message.updated_at !== message.created_at && (
              <span className="ml-1 text-gray-400">(edited)</span>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`inline-block px-4 py-2 rounded-2xl ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-bl-sm'
          } ${isGrouped ? 'mt-1' : ''}`}
        >
          <TipTapRenderer content={message.content} />
        </div>
      </div>
    </div>
  );
};