import React, { useState, useEffect } from 'react';
import { 
  Hash, 
  Volume2, 
  Plus, 
  ChevronDown, 
  ChevronRight, 
  UserPlus, 
  MessageCircle,
  Users,
  Search
} from 'lucide-react';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import { FriendService } from '../../services/friends';
import { ConversationService, type Conversation } from '../../services/conversations';
import type { User } from '../../types/database';
import { useAuth } from '../../contexts/AuthContext';

interface ConversationSelection {
  type: 'friend' | 'conversation';
  friend?: User;
  conversationId?: string;
}

type NavigationMode = 'home' | 'server';

interface ServerSelection {
  id: string;
  name: string;
}

interface ChannelSidebarProps {
  navigationMode: NavigationMode;
  selectedServer: ServerSelection | null;
  onCloseMobile: () => void;
  onAddFriend: () => void;
  onViewFriendRequests: () => void;
  onSelectConversation: (selection: ConversationSelection) => void;
}

const ChannelSidebar: React.FC<ChannelSidebarProps> = ({ 
  navigationMode, 
  selectedServer, 
  onCloseMobile, 
  onAddFriend, 
  onViewFriendRequests,
  onSelectConversation
}) => {
  const [activeTab, setActiveTab] = useState<'channels' | 'friends'>('friends');
  
  // Update active tab based on navigation mode
  useEffect(() => {
    if (navigationMode === 'home') {
      setActiveTab('friends');
    } else {
      setActiveTab('channels');
    }
  }, [navigationMode]);

  // Load friends and conversations when in home mode
  useEffect(() => {
    if (navigationMode === 'home') {
      loadFriends();
      loadConversations();
    }
  }, [navigationMode]);

  const loadFriends = async () => {
    try {
      setIsLoadingFriends(true);
      const friendsList = await FriendService.getFriendsList();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await ConversationService.getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleStartConversation = (friend: User) => {
    onSelectConversation({
      type: 'friend',
      friend: friend
    });
    onCloseMobile();
  };

  const handleSelectConversation = (conversation: Conversation) => {
    onSelectConversation({
      type: 'conversation',
      conversationId: conversation.id
    });
    onCloseMobile();
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['text-channels', 'voice-channels']));
  const [friends, setFriends] = useState<User[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  
  const { profile } = useAuth();

  // Mock data - will be replaced with actual data later
  const textChannels = [
    { id: '1', name: 'general', unreadCount: 3 },
    { id: '2', name: 'random', unreadCount: 0 },
    { id: '3', name: 'announcements', unreadCount: 1 },
  ];

  const voiceChannels = [
    { id: '1', name: 'General Voice', memberCount: 2 },
    { id: '2', name: 'Study Room', memberCount: 0 },
    { id: '3', name: 'Gaming', memberCount: 5 },
  ];

  // Mock data removed - using real friends from database

  // Real DM conversations loaded from database

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const filteredFriends = friends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friend.display_name && friend.display_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-60 bg-gray-800 dark:bg-gray-850 flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 dark:border-gray-750">
        {navigationMode === 'home' ? (
          <>
            <h2 className="font-bold text-white text-lg">AIGM</h2>
            <p className="text-gray-400 text-sm">AI Generative Messaging</p>
          </>
        ) : (
          <>
            <h2 className="font-bold text-white text-lg">{selectedServer?.name || 'Server'}</h2>
            <p className="text-gray-400 text-sm">Server Channels</p>
          </>
        )}
      </div>

      {/* Tab Navigation - Only show in home mode */}
      {navigationMode === 'home' && (
        <div className="flex border-b border-gray-700 dark:border-gray-750">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'friends'
                ? 'text-white bg-gray-700 dark:bg-gray-800'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <MessageCircle className="h-4 w-4 inline mr-2" />
            Friends
          </button>
          <button
            onClick={() => setActiveTab('channels')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'channels'
                ? 'text-white bg-gray-700 dark:bg-gray-800'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Hash className="h-4 w-4 inline mr-2" />
            Channels
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {navigationMode === 'home' && activeTab === 'friends' ? (
          <div className="p-4 space-y-4">
            {/* Search */}
            <Input
              type="text"
              placeholder="Search friends..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />

            {/* Friend Actions */}
            <div className="space-y-2">
              <button 
                onClick={onAddFriend}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span className="text-sm font-medium">Add Friend</span>
              </button>
              
              <button 
                onClick={onViewFriendRequests}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">Friend Requests</span>
              </button>
            </div>

            {/* Direct Messages */}
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Direct Messages
              </h3>
              {/* Loading State */}
              {isLoadingConversations && (
                <div className="flex items-center justify-center py-4">
                  <div className="text-gray-400 text-xs">Loading conversations...</div>
                </div>
              )}
              
              {/* No conversations state */}
              {!isLoadingConversations && conversations.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-gray-500 text-xs">No direct messages yet</div>
                  <div className="text-gray-500 text-xs mt-1">Click on a friend to start chatting</div>
                </div>
              )}
              
              {/* Conversation list */}
              {!isLoadingConversations && conversations.map((conversation) => {
                const otherParticipant = profile ? ConversationService.getOtherParticipant(conversation, profile.id) : null;
                const timestamp = conversation.last_message_at ? ConversationService.formatTimestamp(conversation.last_message_at) : null;
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation)}
                    className="w-full flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-750 text-left transition-colors group"
                  >
                    <Avatar
                      name={otherParticipant?.display_name || otherParticipant?.username || 'Unknown'}
                      src={otherParticipant?.avatar_url || undefined}
                      size="sm"
                      showStatus
                      status={otherParticipant?.status as any}
                      statusColor={otherParticipant?.status_color}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white text-sm font-medium truncate">
                          {otherParticipant?.display_name || otherParticipant?.username || 'Unknown'}
                        </span>
                        {timestamp && (
                          <span className="text-xs text-gray-400">{timestamp}</span>
                        )}
                      </div>
                      {conversation.last_message?.text && (
                        <p className={`text-xs truncate ${conversation.unread_count > 0 ? 'text-white font-medium' : 'text-gray-400'}`}>
                          {conversation.last_message.text}
                        </p>
                      )}
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Loading State */}
            {isLoadingFriends && (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400 text-sm">Loading friends...</div>
              </div>
            )}

            {/* No Friends State */}
            {!isLoadingFriends && friends.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-400 text-sm mb-2">No friends yet</div>
                <div className="text-gray-500 text-xs">Use "Add Friend" to connect with others</div>
              </div>
            )}

            {/* Online Friends */}
            {!isLoadingFriends && friends.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Online — {filteredFriends.filter(f => f.status === 'online').length}
                </h3>
                {filteredFriends
                  .filter(friend => friend.status === 'online')
                  .map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleStartConversation(friend)}
                      className="w-full flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-750 text-left transition-colors"
                    >
                      <Avatar
                        name={friend.display_name || friend.username}
                        src={friend.avatar_url || undefined}
                        size="sm"
                        showStatus
                        status={friend.status as any}
                        statusColor={friend.status_color}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-sm font-medium truncate">
                          {friend.display_name || friend.username}
                        </div>
                        {friend.status_text && (
                          <div className="text-xs text-gray-400 truncate">
                            {friend.status_text}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            )}

            {/* Offline Friends */}
            {!isLoadingFriends && friends.length > 0 && (
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Offline — {filteredFriends.filter(f => f.status !== 'online').length}
                </h3>
                {filteredFriends
                  .filter(friend => friend.status !== 'online')
                  .map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => handleStartConversation(friend)}
                      className="w-full flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-750 text-left transition-colors opacity-60 hover:opacity-100"
                    >
                      <Avatar
                        name={friend.display_name || friend.username}
                        src={friend.avatar_url || undefined}
                        size="sm"
                        showStatus
                        status={friend.status as any}
                        statusColor={friend.status_color}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-300 text-sm truncate">
                          {friend.display_name || friend.username}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        ) : navigationMode === 'server' ? (
          <div className="py-4">
            {/* Server Rooms */}
            <div className="px-2 mb-4">              
              <button
                onClick={() => toggleSection('text-channels')}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span>Rooms</span>
                <div className="flex items-center space-x-1">
                  <Plus className="h-3 w-3 hover:text-white" />
                  {expandedSections.has('text-channels') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('text-channels') && (
                <div className="mt-2 space-y-1">
                  {textChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={onCloseMobile}
                      className="w-full flex items-center justify-between px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors group"
                    >
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4" />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                      {channel.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                          {channel.unreadCount}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Server Spaces */}
            <div className="px-2">
              <button
                onClick={() => toggleSection('voice-channels')}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span>Spaces</span>
                <div className="flex items-center space-x-1">
                  <Plus className="h-3 w-3 hover:text-white" />
                  {expandedSections.has('voice-channels') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('voice-channels') && (
                <div className="mt-2 space-y-1">
                  {voiceChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={onCloseMobile}
                      className="w-full flex items-center justify-between px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                      {channel.memberCount > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{channel.memberCount}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-4">
            {/* Legacy Channels View - Placeholder */}
            <div className="px-2 mb-4">
              <button
                onClick={() => toggleSection('text-channels')}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span>Text Channels</span>
                <div className="flex items-center space-x-1">
                  <Plus className="h-3 w-3 hover:text-white" />
                  {expandedSections.has('text-channels') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('text-channels') && (
                <div className="mt-2 space-y-1">
                  {textChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={onCloseMobile}
                      className="w-full flex items-center justify-between px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors group"
                    >
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4" />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                      {channel.unreadCount > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center">
                          {channel.unreadCount}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Legacy Voice Channels View - Placeholder */}
            <div className="px-2">
              <button
                onClick={() => toggleSection('voice-channels')}
                className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300 transition-colors"
              >
                <span>Voice Channels</span>
                <div className="flex items-center space-x-1">
                  <Plus className="h-3 w-3 hover:text-white" />
                  {expandedSections.has('voice-channels') ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              </button>
              
              {expandedSections.has('voice-channels') && (
                <div className="mt-2 space-y-1">
                  {voiceChannels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={onCloseMobile}
                      className="w-full flex items-center justify-between px-2 py-1 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Volume2 className="h-4 w-4" />
                        <span className="text-sm">{channel.name}</span>
                      </div>
                      {channel.memberCount > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Users className="h-3 w-3" />
                          <span>{channel.memberCount}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChannelSidebar;