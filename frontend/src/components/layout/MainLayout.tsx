import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import ServerSidebar from './ServerSidebar';
import ChannelSidebar from './ChannelSidebar';
import MemberSidebar from './MemberSidebar';
import ChatArea from './ChatArea';
import { UserSearch } from '../friends/UserSearch';
import { FriendRequestList } from '../friends/FriendRequestList';
import { ConversationView } from '../messaging/ConversationView';
import type { User } from '../../types/database';

type MainView = 'chat' | 'user-search' | 'friend-requests' | 'conversation';
type NavigationMode = 'home' | 'server';

interface ServerSelection {
  id: string;
  name: string;
}

interface ConversationSelection {
  type: 'friend' | 'conversation';
  friend?: User;
  conversationId?: string;
}

const MainLayout: React.FC = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const [currentView, setCurrentView] = useState<MainView>('chat');
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('home');
  const [selectedServer, setSelectedServer] = useState<ServerSelection | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSelection | null>(null);

  const handleServerSelection = (server: ServerSelection | null) => {
    if (server) {
      setNavigationMode('server');
      setSelectedServer(server);
    } else {
      setNavigationMode('home');
      setSelectedServer(null);
    }
    // Reset to chat view when switching modes
    setCurrentView('chat');
    setSelectedConversation(null);
  };

  const handleConversationSelection = (selection: ConversationSelection) => {
    setSelectedConversation(selection);
    setCurrentView('conversation');
  };

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileMenu(!showMobileMenu)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-md shadow-lg"
      >
        {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile Backdrop */}
      {showMobileMenu && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Server Sidebar - Leftmost */}
      <div
        className={`${
          showMobileMenu ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative z-40 lg:z-auto`}
      >
        <ServerSidebar 
          onServerSelect={handleServerSelection}
          selectedServer={selectedServer}
        />
      </div>

      {/* Channel/Friends Sidebar - Center Left */}
      <div
        className={`${
          showMobileMenu ? 'translate-x-20' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative z-40 lg:z-auto`}
      >
        <ChannelSidebar 
          navigationMode={navigationMode}
          selectedServer={selectedServer}
          onCloseMobile={() => setShowMobileMenu(false)}
          onAddFriend={() => setCurrentView('user-search')}
          onViewFriendRequests={() => setCurrentView('friend-requests')}
          onSelectConversation={handleConversationSelection}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentView === 'chat' && (
          <ChatArea onToggleMembers={() => setShowMembers(!showMembers)} />
        )}
        {currentView === 'conversation' && selectedConversation && (
          <ConversationView 
            selection={selectedConversation}
            onToggleMembers={() => setShowMembers(!showMembers)}
            onClose={() => {
              setCurrentView('chat');
              setSelectedConversation(null);
            }}
          />
        )}
        {currentView === 'user-search' && (
          <UserSearch onClose={() => setCurrentView('chat')} />
        )}
        {currentView === 'friend-requests' && (
          <FriendRequestList onClose={() => setCurrentView('chat')} />
        )}
      </div>

      {/* Member Sidebar - Rightmost */}
      <div
        className={`${
          showMembers ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative right-0 z-30 lg:z-auto`}
      >
        <MemberSidebar />
      </div>
    </div>
  );
};

export default MainLayout;