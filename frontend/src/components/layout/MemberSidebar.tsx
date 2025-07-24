import React from 'react';
import { Crown, Shield, User, Search } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';

const MemberSidebar: React.FC = () => {
  // Mock data - will be replaced with actual data later
  const members = [
    {
      id: '1',
      username: 'alice',
      displayName: 'Alice Johnson',
      role: 'owner',
      status: 'online',
      statusText: 'Working on AIGM',
      avatar: null,
    },
    {
      id: '2',
      username: 'bob',
      displayName: 'Bob Smith',
      role: 'admin',
      status: 'idle',
      statusText: 'Away for lunch',
      avatar: null,
    },
    {
      id: '3',
      username: 'charlie',
      displayName: 'Charlie Brown',
      role: 'member',
      status: 'online',
      statusText: 'Coding',
      avatar: null,
    },
    {
      id: '4',
      username: 'diana',
      displayName: 'Diana Prince',
      role: 'member',
      status: 'away',
      statusText: '',
      avatar: null,
    },
    {
      id: '5',
      username: 'eve',
      displayName: 'Eve Wilson',
      role: 'member',
      status: 'offline',
      statusText: '',
      avatar: null,
    },
  ];

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-400" />;
      case 'admin':
        return <Shield className="h-3 w-3 text-red-400" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'text-yellow-400';
      case 'admin':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  const onlineMembers = members.filter(member => member.status === 'online');
  const idleMembers = members.filter(member => member.status === 'idle');
  const awayMembers = members.filter(member => member.status === 'away');
  const offlineMembers = members.filter(member => member.status === 'offline');

  const MemberSection: React.FC<{ title: string; members: typeof members; count: number }> = ({
    title,
    members: sectionMembers,
    count,
  }) => {
    if (sectionMembers.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
          {title} — {count}
        </h3>
        <div className="space-y-1">
          {sectionMembers.map((member) => (
            <button
              key={member.id}
              className={`w-full flex items-center space-x-3 px-2 py-2 rounded-md hover:bg-gray-700 dark:hover:bg-gray-750 text-left transition-colors ${
                member.status === 'offline' ? 'opacity-60 hover:opacity-100' : ''
              }`}
            >
              <div className="relative">
                <Avatar
                  src={member.avatar || undefined}
                  name={member.displayName}
                  size="sm"
                  showStatus
                  status={member.status as any}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`flex items-center space-x-1 ${getRoleColor(member.role)}`}>
                  {getRoleIcon(member.role)}
                  <span className="text-sm font-medium truncate">
                    {member.displayName}
                  </span>
                </div>
                {member.statusText && (
                  <div className="text-xs text-gray-400 truncate">
                    {member.statusText}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-60 bg-gray-800 dark:bg-gray-850 flex flex-col h-screen border-l border-gray-700 dark:border-gray-750">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 dark:border-gray-750">
        <h2 className="font-semibold text-white text-sm">Members</h2>
        <p className="text-gray-400 text-xs">{members.length} member{members.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-700 dark:border-gray-750">
        <Input
          type="text"
          placeholder="Search members..."
          icon={Search}
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        />
      </div>

      {/* Member List */}
      <div className="flex-1 overflow-y-auto py-4">
        <MemberSection
          title="Online"
          members={onlineMembers}
          count={onlineMembers.length}
        />
        
        <MemberSection
          title="Idle"
          members={idleMembers}
          count={idleMembers.length}
        />
        
        <MemberSection
          title="Away"
          members={awayMembers}
          count={awayMembers.length}
        />
        
        <MemberSection
          title="Offline"
          members={offlineMembers}
          count={offlineMembers.length}
        />

        {/* Empty State */}
        {members.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <User className="h-12 w-12 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm">No members in this channel</p>
          </div>
        )}
      </div>

      {/* Footer - Optional invite link or actions */}
      <div className="px-4 py-3 border-t border-gray-700 dark:border-gray-750">
        <button className="w-full text-left text-xs text-gray-400 hover:text-white transition-colors">
          Invite members to this server
        </button>
      </div>
    </div>
  );
};

export default MemberSidebar;