import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FriendRequestList } from '../FriendRequestList';
import { FriendService } from '../../../services/friends';

// Mock the services
vi.mock('../../../services/friends');

const mockFriendService = FriendService as any;

const mockPendingRequests = [
  {
    id: 'friendship-1',
    requester_id: 'user-1',
    addressee_id: 'current-user-id',
    status: 'pending',
    action_user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    requester: {
      id: 'user-1',
      username: 'alice',
      display_name: 'Alice Johnson',
      avatar_url: null,
      status: 'online',
      status_text: 'Working on AIGM',
    },
    addressee: {
      id: 'current-user-id',
      username: 'current_user',
      display_name: 'Current User',
      avatar_url: null,
      status: 'online',
    },
  },
  {
    id: 'friendship-2',
    requester_id: 'user-2',
    addressee_id: 'current-user-id',
    status: 'pending',
    action_user_id: 'user-2',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    requester: {
      id: 'user-2',
      username: 'bob',
      display_name: 'Bob Wilson',
      avatar_url: 'https://example.com/bob.jpg',
      status: 'idle',
      status_text: 'Away for lunch',
    },
    addressee: {
      id: 'current-user-id',
      username: 'current_user',
      display_name: 'Current User',
      avatar_url: null,
      status: 'online',
    },
  },
];

const mockSentRequests = [
  {
    id: 'friendship-3',
    requester_id: 'current-user-id',
    addressee_id: 'user-3',
    status: 'pending',
    action_user_id: 'current-user-id',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    requester: {
      id: 'current-user-id',
      username: 'current_user',
      display_name: 'Current User',
      avatar_url: null,
      status: 'online',
    },
    addressee: {
      id: 'user-3',
      username: 'charlie',
      display_name: 'Charlie Brown',
      avatar_url: null,
      status: 'offline',
      status_text: '',
    },
  },
];

describe('FriendRequestList Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFriendService.getFriendships.mockImplementation((status) => {
      if (status === 'pending') {
        return Promise.resolve({
          friendships: [...mockPendingRequests, ...mockSentRequests],
          total: mockPendingRequests.length + mockSentRequests.length,
        });
      }
      return Promise.resolve({ friendships: [], total: 0 });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render friend request tabs', () => {
    render(<FriendRequestList />);

    expect(screen.getByRole('tab', { name: /received/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /sent/i })).toBeInTheDocument();
  });

  it('should load and display pending friend requests on mount', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      expect(mockFriendService.getFriendships).toHaveBeenCalledWith('pending');
    });

    // Should display received requests by default
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    
    // Should not display sent requests initially
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });

  it('should switch between received and sent tabs', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const sentTab = screen.getByRole('tab', { name: /sent/i });
    await user.click(sentTab);

    // Should show sent requests
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    
    // Should hide received requests
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    expect(screen.queryByText('Bob Wilson')).not.toBeInTheDocument();

    // Switch back to received
    const receivedTab = screen.getByRole('tab', { name: /received/i });
    await user.click(receivedTab);

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });

  it('should display loading state initially', () => {
    mockFriendService.getFriendships.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<FriendRequestList />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should display empty state for no pending requests', async () => {
    mockFriendService.getFriendships.mockResolvedValue({
      friendships: [],
      total: 0,
    });

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText(/no pending requests/i)).toBeInTheDocument();
    });
  });

  it('should accept friend request when accept button is clicked', async () => {
    mockFriendService.acceptFriendRequest.mockResolvedValue({
      ...mockPendingRequests[0],
      status: 'accepted',
      action_user_id: 'current-user-id',
    });

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const acceptButton = screen.getAllByText(/accept/i)[0];
    await user.click(acceptButton);

    await waitFor(() => {
      expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith('friendship-1');
    });

    // Should show success message or remove the request
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
  });

  it('should block friend request when decline/block button is clicked', async () => {
    mockFriendService.blockFriendRequest.mockResolvedValue({
      ...mockPendingRequests[0],
      status: 'blocked',
      action_user_id: 'current-user-id',
    });

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const blockButton = screen.getAllByText(/decline|block/i)[0];
    await user.click(blockButton);

    await waitFor(() => {
      expect(mockFriendService.blockFriendRequest).toHaveBeenCalledWith('friendship-1');
    });

    // Should remove the request from the list
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
  });

  it('should cancel sent friend request when cancel button is clicked', async () => {
    mockFriendService.deleteFriendship.mockResolvedValue(undefined);

    render(<FriendRequestList />);

    // Switch to sent tab
    const sentTab = screen.getByRole('tab', { name: /sent/i });
    await user.click(sentTab);

    await waitFor(() => {
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancel/i);
    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockFriendService.deleteFriendship).toHaveBeenCalledWith('friendship-3');
    });

    // Should remove the request from the list
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
  });

  it('should handle accept request failure', async () => {
    mockFriendService.acceptFriendRequest.mockRejectedValue(
      new Error('Failed to accept request')
    );

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const acceptButton = screen.getAllByText(/accept/i)[0];
    await user.click(acceptButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to accept/i)).toBeInTheDocument();
    });

    // Request should still be visible
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('should handle block request failure', async () => {
    mockFriendService.blockFriendRequest.mockRejectedValue(
      new Error('Failed to block request')
    );

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const blockButton = screen.getAllByText(/decline|block/i)[0];
    await user.click(blockButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to block/i)).toBeInTheDocument();
    });

    // Request should still be visible
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  it('should display user information correctly', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      const aliceRequest = mockPendingRequests[0];
      expect(screen.getByText(aliceRequest.requester.display_name!)).toBeInTheDocument();
      expect(screen.getByText(`@${aliceRequest.requester.username}`)).toBeInTheDocument();
      expect(screen.getByText(aliceRequest.requester.status_text!)).toBeInTheDocument();
    });
  });

  it('should show user avatars when available', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      // Bob has an avatar URL
      const bobAvatar = screen.getByAltText(/bob wilson/i);
      expect(bobAvatar).toBeInTheDocument();
      expect(bobAvatar).toHaveAttribute('src', 'https://example.com/bob.jpg');
    });
  });

  it('should display request timestamps', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      // Should show relative time (e.g., "2 days ago")
      expect(screen.getByText(/ago|yesterday|today/)).toBeInTheDocument();
    });
  });

  it('should show correct request counts in tab labels', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText(`Received (${mockPendingRequests.length})`)).toBeInTheDocument();
      expect(screen.getByText(`Sent (${mockSentRequests.length})`)).toBeInTheDocument();
    });
  });

  it('should refresh requests after successful actions', async () => {
    mockFriendService.acceptFriendRequest.mockResolvedValue({
      ...mockPendingRequests[0],
      status: 'accepted',
    });

    // Mock updated list after accepting
    mockFriendService.getFriendships
      .mockResolvedValueOnce({
        friendships: [...mockPendingRequests, ...mockSentRequests],
        total: 3,
      })
      .mockResolvedValueOnce({
        friendships: [mockPendingRequests[1], ...mockSentRequests], // Alice removed
        total: 2,
      });

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const acceptButton = screen.getAllByText(/accept/i)[0];
    await user.click(acceptButton);

    await waitFor(() => {
      expect(mockFriendService.getFriendships).toHaveBeenCalledTimes(2); // Initial load + refresh
    });
  });

  it('should handle loading states for individual actions', async () => {
    // Mock delayed response
    mockFriendService.acceptFriendRequest.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const acceptButton = screen.getAllByText(/accept/i)[0];
    await user.click(acceptButton);

    // Should show loading state on the button
    expect(acceptButton).toBeDisabled();
    expect(screen.getByText(/accepting/i)).toBeInTheDocument();
  });

  it('should prevent multiple simultaneous actions on the same request', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const acceptButton = screen.getAllByText(/accept/i)[0];
    const blockButton = screen.getAllByText(/decline|block/i)[0];

    // Click accept button
    await user.click(acceptButton);

    // Both buttons should be disabled during action
    expect(acceptButton).toBeDisabled();
    expect(blockButton).toBeDisabled();
  });

  it('should handle network errors gracefully', async () => {
    mockFriendService.getFriendships.mockRejectedValue(
      new Error('Network error')
    );

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
    });

    // Should show retry button
    const retryButton = screen.getByText(/retry/i);
    expect(retryButton).toBeInTheDocument();

    // Retry should work
    mockFriendService.getFriendships.mockResolvedValue({
      friendships: mockPendingRequests,
      total: mockPendingRequests.length,
    });

    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  it('should support keyboard navigation', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Tab through elements
    await user.keyboard('{Tab}');
    const firstAcceptButton = screen.getAllByText(/accept/i)[0];
    expect(firstAcceptButton).toHaveFocus();

    await user.keyboard('{Tab}');
    const firstBlockButton = screen.getAllByText(/decline|block/i)[0];
    expect(firstBlockButton).toHaveFocus();
  });

  it('should show confirmation dialog for irreversible actions', async () => {
    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const blockButton = screen.getAllByText(/decline|block/i)[0];
    await user.click(blockButton);

    // Should show confirmation dialog
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    expect(screen.getByText(/confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/cancel/i)).toBeInTheDocument();

    // Cancel should close dialog
    await user.click(screen.getByText(/cancel/i));
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();

    // Confirm should proceed with action
    await user.click(blockButton);
    await user.click(screen.getByText(/confirm/i));

    await waitFor(() => {
      expect(mockFriendService.blockFriendRequest).toHaveBeenCalledWith('friendship-1');
    });
  });

  it('should handle empty state with helpful message', async () => {
    mockFriendService.getFriendships.mockResolvedValue({
      friendships: [],
      total: 0,
    });

    render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText(/no friend requests/i)).toBeInTheDocument();
      expect(screen.getByText(/search for people to connect/i)).toBeInTheDocument();
    });
  });

  it('should update tab badges when requests change', async () => {
    const { rerender } = render(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText(`Received (${mockPendingRequests.length})`)).toBeInTheDocument();
    });

    // Mock accepting a request
    mockFriendService.getFriendships.mockResolvedValue({
      friendships: [mockPendingRequests[1], ...mockSentRequests], // One less received
      total: 2,
    });

    // Simulate prop change or manual refresh
    rerender(<FriendRequestList />);

    await waitFor(() => {
      expect(screen.getByText(`Received (${mockPendingRequests.length - 1})`)).toBeInTheDocument();
    });
  });
});