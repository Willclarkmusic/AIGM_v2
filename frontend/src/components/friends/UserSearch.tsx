import React, { useState, useCallback, useEffect } from 'react';
import { Search, UserPlus, Users, Loader2 } from 'lucide-react';
import { UserService, type UserSearchResponse } from '../../services/users';
import { FriendService } from '../../services/friends';
import type { User } from '../../types/database';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';

interface UserSearchProps {
  onClose?: () => void;
}

interface UserWithFriendshipStatus extends User {
  friendship_status?: string | null;
  is_friend_requester?: boolean;
}

export const UserSearch: React.FC<UserSearchProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingRequests, setSendingRequests] = useState<Set<string>>(new Set());

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        handleSearch();
      } else {
        setResults(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const searchResults = await UserService.searchUsersWithFriendshipStatus(query.trim(), 20, 0);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSendFriendRequest = useCallback(async (user: UserWithFriendshipStatus) => {
    setSendingRequests(prev => new Set(prev).add(user.id));
    
    try {
      await FriendService.sendFriendRequestById(user.id);
      
      // Update the user's friendship status in results
      setResults(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          users: prev.users.map(u => 
            u.id === user.id 
              ? { ...u, friendship_status: 'pending', is_friend_requester: true }
              : u
          )
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send friend request');
    } finally {
      setSendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(user.id);
        return newSet;
      });
    }
  }, []);

  const getFriendshipButtonContent = (user: UserWithFriendshipStatus) => {
    const isLoading = sendingRequests.has(user.id);

    if (isLoading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Sending...
        </>
      );
    }

    switch (user.friendship_status) {
      case 'accepted':
        return (
          <>
            <Users className="w-4 h-4" />
            Friends
          </>
        );
      case 'pending':
        if (user.is_friend_requester) {
          return (
            <>
              <UserPlus className="w-4 h-4" />
              Requested
            </>
          );
        } else {
          return (
            <>
              <UserPlus className="w-4 h-4" />
              Accept Request
            </>
          );
        }
      case 'blocked':
        return 'Blocked';
      default:
        return (
          <>
            <UserPlus className="w-4 h-4" />
            Add Friend
          </>
        );
    }
  };

  const getFriendshipButtonVariant = (user: UserWithFriendshipStatus) => {
    switch (user.friendship_status) {
      case 'accepted':
        return 'secondary' as const;
      case 'pending':
        return user.is_friend_requester ? 'secondary' : 'primary';
      case 'blocked':
        return 'secondary' as const;
      default:
        return 'primary' as const;
    }
  };

  const isFriendshipButtonDisabled = (user: UserWithFriendshipStatus) => {
    return sendingRequests.has(user.id) || 
           user.friendship_status === 'accepted' || 
           user.friendship_status === 'blocked' ||
           (user.friendship_status === 'pending' && user.is_friend_requester);
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Find Friends</h2>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
        
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search users by username or display name..."
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Searching...</span>
          </div>
        )}

        {results && !loading && (
          <div className="p-4">
            <div className="text-sm text-gray-400 mb-4">
              {results.total} result{results.total !== 1 ? 's' : ''} for "{results.query}"
            </div>

            {results.users.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No users found matching your search.</p>
                <p className="text-sm text-gray-500 mt-1">Try a different username or display name.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={user.avatar_url}
                        alt={user.display_name || user.username}
                        size="md"
                        status={user.status}
                      />
                      <div>
                        <div className="font-medium text-white">
                          {user.display_name || user.username}
                        </div>
                        {user.display_name && (
                          <div className="text-sm text-gray-400">@{user.username}</div>
                        )}
                        {user.status_text && (
                          <div className="text-xs text-gray-500 mt-1">{user.status_text}</div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant={getFriendshipButtonVariant(user)}
                      size="sm"
                      onClick={() => handleSendFriendRequest(user)}
                      disabled={isFriendshipButtonDisabled(user)}
                      className="flex items-center space-x-2"
                    >
                      {getFriendshipButtonContent(user)}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {results.has_more && (
              <div className="mt-4 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement load more functionality
                    console.log('Load more not implemented yet');
                  }}
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}

        {!query.trim() && !loading && !results && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Search className="w-16 h-16 text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">Search for Friends</h3>
            <p className="text-gray-500 max-w-sm">
              Enter a username or display name to find users and send friend requests.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};