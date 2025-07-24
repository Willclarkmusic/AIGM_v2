import React from 'react';
import { Hash, Users, Phone, Video, Pin, Search, Bell, MoreHorizontal } from 'lucide-react';
import Button from '../ui/Button';

interface ChatAreaProps {
  onToggleMembers: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ onToggleMembers }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-3">
          <Hash className="h-5 w-5 text-gray-500" />
          <div>
            <h1 className="font-semibold text-gray-900 dark:text-white">general</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">General discussion channel</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" icon={Bell}>
            <span className="sr-only">Notifications</span>
          </Button>
          <Button variant="ghost" size="sm" icon={Pin}>
            <span className="sr-only">Pinned Messages</span>
          </Button>
          <Button variant="ghost" size="sm" icon={Search}>
            <span className="sr-only">Search</span>
          </Button>
          <Button variant="ghost" size="sm" icon={Phone}>
            <span className="sr-only">Voice Call</span>
          </Button>
          <Button variant="ghost" size="sm" icon={Video}>
            <span className="sr-only">Video Call</span>
          </Button>
          <Button variant="ghost" size="sm" icon={Users} onClick={onToggleMembers}>
            <span className="sr-only">Toggle Members</span>
          </Button>
          <Button variant="ghost" size="sm" icon={MoreHorizontal}>
            <span className="sr-only">More Options</span>
          </Button>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Welcome Message */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Hash className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to #general!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            This is the beginning of the #general channel. Start a conversation and connect with your team!
          </p>
        </div>

        {/* Sample Messages */}
        <div className="space-y-4 max-w-4xl">
          {/* System Message */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>AIGM Chat is now active! Start messaging with your friends.</span>
          </div>

          {/* Coming Soon Message */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🚧 Coming Soon: Real-time Messaging
            </h3>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              The message composer and real-time chat functionality will be implemented next. 
              You'll be able to send rich text messages, share files, and communicate with friends in real-time!
            </p>
          </div>
        </div>
      </div>

      {/* Message Composer Placeholder */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center space-x-3 bg-white dark:bg-gray-700 rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-600">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Message #general (Coming Soon)"
              className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
              disabled
            />
          </div>
          <Button variant="ghost" size="sm" disabled>
            Send
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>TipTap rich text editor will be integrated here</span>
          <span>File uploads & emoji picker coming soon</span>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;