import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserSearch } from '../UserSearch';
import { UserService } from '../../../services/users';
import { FriendService } from '../../../services/friends';

// Mock the services
vi.mock('../../../services/users');
vi.mock('../../../services/friends');

const mockUserService = UserService as any;
const mockFriendService = FriendService as any;

const mockUsers = [
  {
    id: 'user-1',
    username: 'alice',
    display_name: 'Alice Johnson',
    avatar_url: null,
    status: 'online',
    status_text: 'Working on AIGM',
    status_color: '#22c55e',
  },
  {
    id: 'user-2',
    username: 'alicia',
    display_name: 'Alicia Smith',
    avatar_url: 'https://example.com/avatar.jpg',
    status: 'idle',
    status_text: 'Away for lunch',
    status_color: '#f59e0b',
  },
  {
    id: 'user-3',
    username: 'bob',
    display_name: 'Bob Wilson',
    avatar_url: null,
    status: 'offline',
    status_text: '',
    status_color: '#6b7280',
  },
];

describe('UserSearch Component', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserService.searchUsers.mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
      has_more: false,
      query: 'alice',
      limit: 20,
      offset: 0,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render search input and search button', () => {
    render(<UserSearch />);

    expect(screen.getByPlaceholderText(/search for friends/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('should display empty state initially', () => {
    render(<UserSearch />);

    expect(screen.getByText(/search for friends to connect/i)).toBeInTheDocument();
    expect(screen.getByText(/start typing to find people/i)).toBeInTheDocument();
  });

  it('should perform search when user types and clicks search', async () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'alice');
    await user.click(searchButton);

    await waitFor(() => {
      expect(mockUserService.searchUsers).toHaveBeenCalledWith('alice', 20, 0);
    });

    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('Alicia Smith')).toBeInTheDocument();
  });

  it('should perform search on Enter key press', async () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);

    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockUserService.searchUsers).toHaveBeenCalledWith('alice', 20, 0);
    });
  });

  it('should display loading state during search', async () => {
    // Mock a delayed response
    mockUserService.searchUsers.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({
        users: mockUsers,
        total: mockUsers.length,
        has_more: false,
        query: 'alice',
        limit: 20,
        offset: 0,
      }), 100))
    );

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    await user.type(searchInput, 'alice');
    await user.click(searchButton);

    expect(screen.getByText(/searching/i)).toBeInTheDocument();
    expect(searchButton).toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });
  });

  it('should display no results message when search returns empty', async () => {
    mockUserService.searchUsers.mockResolvedValue({
      users: [],
      total: 0,
      has_more: false,
      query: 'nonexistent',
      limit: 20,
      offset: 0,
    });

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'nonexistent');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });

  it('should display error message when search fails', async () => {
    mockUserService.searchUsers.mockRejectedValue(new Error('Search failed'));

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument();
    });
  });

  it('should display user information correctly', async () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      const alice = mockUsers[0];
      expect(screen.getByText(alice.display_name!)).toBeInTheDocument();
      expect(screen.getByText(`@${alice.username}`)).toBeInTheDocument();
      expect(screen.getByText(alice.status_text!)).toBeInTheDocument();
    });
  });

  it('should show status indicators correctly', async () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      // Check for online status (green dot)
      const onlineUser = screen.getByText('Alice Johnson').closest('.user-item');
      expect(onlineUser).toBeInTheDocument();
      
      // Check for idle status
      const idleUser = screen.getByText('Alicia Smith').closest('.user-item');
      expect(idleUser).toBeInTheDocument();
    });
  });

  it('should send friend request when add friend button is clicked', async () => {
    mockFriendService.sendFriendRequest.mockResolvedValue({
      id: 'friendship-1',
      requester_id: 'current-user-id',
      addressee_id: 'user-1',
      status: 'pending',
    });

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const addFriendButton = screen.getAllByText(/add friend/i)[0];
    await user.click(addFriendButton);

    await waitFor(() => {
      expect(mockFriendService.sendFriendRequest).toHaveBeenCalledWith('user-1');
    });

    // Should show success message or change button state
    expect(screen.getByText(/request sent/i) || screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('should handle friend request failure', async () => {
    mockFriendService.sendFriendRequest.mockRejectedValue(
      new Error('Friend request already exists')
    );

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const addFriendButton = screen.getAllByText(/add friend/i)[0];
    await user.click(addFriendButton);

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('should disable search for empty or very short queries', async () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    const searchButton = screen.getByRole('button', { name: /search/i });

    // Empty query
    await user.click(searchButton);
    expect(mockUserService.searchUsers).not.toHaveBeenCalled();

    // Short query (1 character)
    await user.type(searchInput, 'a');
    await user.click(searchButton);
    expect(mockUserService.searchUsers).not.toHaveBeenCalled();

    // Valid query (2+ characters)
    await user.type(searchInput, 'l'); // now 'al'
    await user.click(searchButton);
    
    await waitFor(() => {
      expect(mockUserService.searchUsers).toHaveBeenCalledWith('al', 20, 0);
    });
  });

  it('should load more results when load more button is clicked', async () => {
    // First search returns results with has_more: true
    mockUserService.searchUsers
      .mockResolvedValueOnce({
        users: mockUsers.slice(0, 2),
        total: 2,
        has_more: true,
        query: 'alice',
        limit: 2,
        offset: 0,
      })
      .mockResolvedValueOnce({
        users: [mockUsers[2]],
        total: 1,
        has_more: false,
        query: 'alice',
        limit: 2,
        offset: 2,
      });

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Alicia Smith')).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByText(/load more/i);
    await user.click(loadMoreButton);

    await waitFor(() => {
      expect(mockUserService.searchUsers).toHaveBeenCalledWith('alice', 2, 2);
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    // Load more button should disappear when has_more is false
    expect(screen.queryByText(/load more/i)).not.toBeInTheDocument();
  });

  it('should debounce search input', async () => {
    vi.useFakeTimers();

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);

    // Type quickly
    await user.type(searchInput, 'a');
    await user.type(searchInput, 'l');
    await user.type(searchInput, 'i');
    await user.type(searchInput, 'c');
    await user.type(searchInput, 'e');

    // Fast forward timers
    vi.advanceTimersByTime(500);

    await waitFor(() => {
      expect(mockUserService.searchUsers).toHaveBeenCalledWith('alice', 20, 0);
      expect(mockUserService.searchUsers).toHaveBeenCalledTimes(1);
    });

    vi.useRealTimers();
  });

  it('should clear search results when input is cleared', async () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    
    // Perform search
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Clear input
    await user.clear(searchInput);

    // Should show empty state again
    expect(screen.getByText(/search for friends to connect/i)).toBeInTheDocument();
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    // Test Tab navigation to buttons
    await user.keyboard('{Tab}');
    const firstAddButton = screen.getAllByText(/add friend/i)[0];
    expect(firstAddButton).toHaveFocus();
  });

  it('should display correct user count and pagination info', async () => {
    mockUserService.searchUsers.mockResolvedValue({
      users: mockUsers,
      total: mockUsers.length,
      has_more: false,
      query: 'alice',
      limit: 20,
      offset: 0,
    });

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText(/found 3 users/i)).toBeInTheDocument();
    });
  });

  it('should prevent duplicate friend requests', async () => {
    mockFriendService.sendFriendRequest
      .mockResolvedValueOnce({
        id: 'friendship-1',
        status: 'pending',
      })
      .mockRejectedValueOnce(new Error('Friendship already exists'));

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    const addFriendButton = screen.getAllByText(/add friend/i)[0];
    
    // First click - successful
    await user.click(addFriendButton);
    
    await waitFor(() => {
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });

    // Button should be disabled or show different state
    expect(addFriendButton).toBeDisabled();
  });

  it('should filter out users that are already friends', async () => {
    // Mock the search to return users with friendship status
    mockUserService.searchUsers.mockResolvedValue({
      users: mockUsers.map(user => ({
        ...user,
        friendship_status: user.id === 'user-1' ? 'accepted' : null,
      })),
      total: mockUsers.length,
      has_more: false,
      query: 'alice',
      limit: 20,
      offset: 0,
    });

    render(<UserSearch />);

    const searchInput = screen.getByPlaceholderText(/search for friends/i);
    await user.type(searchInput, 'alice');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      // Alice should show as "Friends" instead of "Add Friend"
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      
      const aliceItem = screen.getByText('Alice Johnson').closest('.user-item');
      expect(aliceItem).toContainHTML(/friends/i);
    });
  });
});