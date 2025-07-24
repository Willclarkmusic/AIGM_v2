import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, UserX, Users, Loader2, RefreshCw } from 'lucide-react';
import { FriendService, type FriendshipResponse } from '../../services/friends';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

interface FriendRequestListProps {
  onClose?: () => void;
}

export const FriendRequestList: React.FC<FriendRequestListProps> = ({ onClose }) => {
  const [receivedRequests, setReceivedRequests] = useState<FriendshipResponse[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendshipResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  const loadFriendRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { received, sent } = await FriendService.getPendingRequests();
      setReceivedRequests(received);
      setSentRequests(sent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friend requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFriendRequests();
  }, [loadFriendRequests]);

  const handleAcceptRequest = useCallback(async (friendship: FriendshipResponse) => {
    setProcessingRequests(prev => new Set(prev).add(friendship.id));

    try {
      await FriendService.acceptFriendRequest(friendship.id);
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== friendship.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendship.id);
        return newSet;
      });
    }
  }, []);

  const handleDeclineRequest = useCallback(async (friendship: FriendshipResponse) => {
    setProcessingRequests(prev => new Set(prev).add(friendship.id));

    try {
      await FriendService.blockFriendRequest(friendship.id);
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== friendship.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendship.id);
        return newSet;
      });
    }
  }, []);

  const handleCancelRequest = useCallback(async (friendship: FriendshipResponse) => {
    setProcessingRequests(prev => new Set(prev).add(friendship.id));

    try {
      await FriendService.deleteFriendship(friendship.id);
      
      // Remove from sent requests
      setSentRequests(prev => prev.filter(req => req.id !== friendship.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel friend request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(friendship.id);
        return newSet;
      });
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const renderReceivedRequest = (friendship: FriendshipResponse) => {
    const requester = friendship.requester;
    const isProcessing = processingRequests.has(friendship.id);

    return (
      <div key={friendship.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-3">
          <Avatar
            src={requester?.avatar_url}
            alt={requester?.display_name || requester?.username}
            size="md"
            status={requester?.status}
          />
          <div>
            <div className="font-medium text-white">
              {requester?.display_name || requester?.username}
            </div>
            {requester?.display_name && (
              <div className="text-sm text-gray-400">@{requester?.username}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(friendship.created_at.toString())}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAcceptRequest(friendship)}
            disabled={isProcessing}
            className="flex items-center space-x-1"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            <span>Accept</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDeclineRequest(friendship)}
            disabled={isProcessing}
            className="flex items-center space-x-1"
          >
            <UserX className="w-4 h-4" />
            <span>Decline</span>
          </Button>
        </div>
      </div>
    );
  };

  const renderSentRequest = (friendship: FriendshipResponse) => {
    const addressee = friendship.addressee;
    const isProcessing = processingRequests.has(friendship.id);

    return (
      <div key={friendship.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-3">
          <Avatar
            src={addressee?.avatar_url}
            alt={addressee?.display_name || addressee?.username}
            size="md"
            status={addressee?.status}
          />
          <div>
            <div className="font-medium text-white">
              {addressee?.display_name || addressee?.username}
            </div>
            {addressee?.display_name && (
              <div className="text-sm text-gray-400">@{addressee?.username}</div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Sent {formatDate(friendship.created_at.toString())}
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => handleCancelRequest(friendship)}
          disabled={isProcessing}
          className="flex items-center space-x-1"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <UserX className="w-4 h-4" />
          )}
          <span>Cancel</span>
        </Button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Friend Requests</h2>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadFriendRequests}
              disabled={loading}
              className="flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-600'
            }`}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="p-4">
            <div className="bg-red-900/50 border border-red-700 rounded-md p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Loading friend requests...</span>
          </div>
        ) : (
          <div className="p-4">
            {activeTab === 'received' && (
              <div className="space-y-3">
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No pending friend requests.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      When someone sends you a friend request, it will appear here.
                    </p>
                  </div>
                ) : (
                  receivedRequests.map(renderReceivedRequest)
                )}
              </div>
            )}

            {activeTab === 'sent' && (
              <div className="space-y-3">
                {sentRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No sent friend requests.</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Friend requests you send will appear here while they're pending.
                    </p>
                  </div>
                ) : (
                  sentRequests.map(renderSentRequest)
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};