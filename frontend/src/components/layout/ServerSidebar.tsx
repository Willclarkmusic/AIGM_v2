import React from 'react';
import { Plus, Home, Settings } from 'lucide-react';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../contexts/AuthContext';

interface ServerSelection {
  id: string;
  name: string;
}

interface ServerSidebarProps {
  onServerSelect: (server: ServerSelection | null) => void;
  selectedServer: ServerSelection | null;
}

const ServerSidebar: React.FC<ServerSidebarProps> = ({ onServerSelect, selectedServer }) => {
  const { profile, signOut } = useAuth();

  // Mock servers data - will be replaced with actual data later
  const servers = [
    { id: '1', name: 'My Server', avatar: null },
    { id: '2', name: 'Gaming', avatar: null },
    { id: '3', name: 'Work', avatar: null },
  ];

  const isHomeActive = selectedServer === null;
  const isServerActive = (serverId: string) => selectedServer?.id === serverId;

  return (
    <div className="w-20 bg-gray-900 dark:bg-gray-950 flex flex-col items-center py-3 space-y-3">
      {/* Home/DMs Button */}
      <div className="relative group">
        <button 
          onClick={() => onServerSelect(null)}
          className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center text-white shadow-lg ${
            isHomeActive
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-gray-700 hover:bg-blue-600'
          }`}
        >
          <Home className="h-6 w-6" />
        </button>
        
        {/* Active Indicator */}
        {isHomeActive && (
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r"></div>
        )}
        <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          Direct Messages
        </div>
      </div>

      {/* Server Separator */}
      <div className="w-8 h-px bg-gray-600"></div>

      {/* Server List */}
      <div className="flex flex-col space-y-3 flex-1">
        {servers.map((server) => (
          <div key={server.id} className="relative group">
            <button
              onClick={() => onServerSelect({ id: server.id, name: server.name })}
              className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center text-white shadow-lg ${
                isServerActive(server.id)
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {server.avatar ? (
                <img
                  src={server.avatar}
                  alt={server.name}
                  className="w-full h-full rounded-2xl hover:rounded-xl transition-all duration-200 object-cover"
                />
              ) : (
                <span className="font-semibold text-sm">
                  {server.name.substring(0, 2).toUpperCase()}
                </span>
              )}
            </button>
            
            {/* Active Indicator */}
            {isServerActive(server.id) && (
              <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r"></div>
            )}

            {/* Tooltip */}
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {server.name}
            </div>
          </div>
        ))}

        {/* Add Server Button */}
        <div className="relative group">
          <button className="w-12 h-12 bg-gray-700 hover:bg-green-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center text-green-500 hover:text-white shadow-lg">
            <Plus className="h-6 w-6" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Add a Server
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col space-y-3">
        {/* Settings */}
        <div className="relative group">
          <button
            onClick={signOut}
            className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center text-gray-300 hover:text-white shadow-lg"
          >
            <Settings className="h-5 w-5" />
          </button>
          <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            Sign Out
          </div>
        </div>

        {/* User Avatar */}
        {profile && (
          <div className="relative group">
            <Avatar
              src={profile.avatar_url || undefined}
              name={profile.display_name || profile.username}
              size="md"
              showStatus
              status={profile.status as any}
              statusColor={profile.status_color}
              className="w-12 h-12 ring-2 ring-gray-600 hover:ring-gray-500 transition-colors"
            />
            <div className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {profile.display_name || profile.username}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServerSidebar;