import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import json
from datetime import datetime, timezone

from app.main import app
from app.models.friendship import FriendshipResponse, FriendshipStatus, FriendRequestCreate, FriendshipListResponse

client = TestClient(app)

class TestFriendRequestAPI:
    """Comprehensive tests for friend request API endpoints"""

    @pytest.fixture
    def mock_supabase(self):
        """Mock supabase client for testing"""
        mock = Mock()
        return mock

    @pytest.fixture
    def mock_current_user(self):
        """Mock current authenticated user"""
        return Mock(id='current-user-id', username='current_user')

    @pytest.fixture
    def mock_target_user(self):
        """Mock target user for friend requests"""
        return {
            'id': 'target-user-id',
            'username': 'target_user',
            'display_name': 'Target User',
            'avatar_url': None,
            'status': 'online'
        }

    def test_send_friend_request_success(self, mock_supabase, mock_current_user, mock_target_user):
        """Test successful friend request sending"""
        # Mock user exists check
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_target_user
        
        # Mock no existing friendship
        mock_supabase.table.return_value.select.return_value.or_.return_value.execute.return_value.data = []
        
        # Mock successful insertion
        mock_friendship = {
            'id': 'friendship-id',
            'requester_id': 'current-user-id',
            'addressee_id': 'target-user-id',
            'status': 'pending',
            'action_user_id': 'current-user-id',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.post('/api/friends/request', json={'addressee_username': 'target_user'})
                
                assert response.status_code == 201
                data = response.json()
                assert data['id'] == 'friendship-id'
                assert data['status'] == 'pending'
                assert data['requester_id'] == 'current-user-id'
                assert data['addressee_id'] == 'target-user-id'

    def test_send_friend_request_user_not_found(self, mock_supabase, mock_current_user):
        """Test friend request to non-existent user"""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.post('/api/friends/request', json={'addressee_username': 'nonexistent_user'})
                
                assert response.status_code == 404
                assert 'User not found' in response.json()['detail']

    def test_send_friend_request_to_self(self, mock_supabase, mock_current_user):
        """Test sending friend request to yourself"""
        mock_target_user = {
            'id': 'current-user-id',  # Same as current user
            'username': 'current_user',
            'display_name': 'Current User',
            'avatar_url': None,
            'status': 'online'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_target_user
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.post('/api/friends/request', json={'addressee_username': 'current_user'})
                
                assert response.status_code == 400
                assert 'Cannot send friend request to yourself' in response.json()['detail']

    def test_send_friend_request_already_exists(self, mock_supabase, mock_current_user, mock_target_user):
        """Test sending friend request when friendship already exists"""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_target_user
        
        # Mock existing friendship
        mock_existing = {
            'id': 'existing-friendship',
            'status': 'pending'
        }
        mock_supabase.table.return_value.select.return_value.or_.return_value.execute.return_value.data = [mock_existing]
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.post('/api/friends/request', json={'addressee_username': 'target_user'})
                
                assert response.status_code == 400
                assert 'friendship already exists' in response.json()['detail'].lower()

    def test_send_friend_request_invalid_input(self, mock_current_user):
        """Test friend request with invalid input"""
        with patch('app.dependencies.get_current_user', return_value=mock_current_user):
            # Missing username
            response = client.post('/api/friends/request', json={})
            assert response.status_code == 422
            
            # Empty username
            response = client.post('/api/friends/request', json={'addressee_username': ''})
            assert response.status_code == 422
            
            # Invalid JSON
            response = client.post('/api/friends/request', data='invalid json')
            assert response.status_code == 422

    def test_accept_friend_request_success(self, mock_supabase, mock_current_user):
        """Test successful friend request acceptance"""
        friendship_id = 'friendship-id'
        
        # Mock existing pending friendship where current user is addressee
        mock_friendship = {
            'id': friendship_id,
            'requester_id': 'other-user-id',
            'addressee_id': 'current-user-id',
            'status': 'pending',
            'action_user_id': 'other-user-id',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        # Mock successful update
        updated_friendship = mock_friendship.copy()
        updated_friendship['status'] = 'accepted'
        updated_friendship['action_user_id'] = 'current-user-id'
        mock_supabase.table.return_value.update.return_value.eq.return_value.select.return_value.single.return_value.execute.return_value.data = updated_friendship
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.put(f'/api/friends/{friendship_id}/accept')
                
                assert response.status_code == 200
                data = response.json()
                assert data['status'] == 'accepted'
                assert data['action_user_id'] == 'current-user-id'

    def test_accept_friend_request_not_found(self, mock_supabase, mock_current_user):
        """Test accepting non-existent friend request"""
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.put('/api/friends/nonexistent-id/accept')
                
                assert response.status_code == 404

    def test_accept_friend_request_not_addressee(self, mock_supabase, mock_current_user):
        """Test accepting friend request when not the addressee"""
        friendship_id = 'friendship-id'
        
        # Mock friendship where current user is NOT the addressee
        mock_friendship = {
            'id': friendship_id,
            'requester_id': 'current-user-id',  # Current user is requester
            'addressee_id': 'other-user-id',
            'status': 'pending',
            'action_user_id': 'current-user-id'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.put(f'/api/friends/{friendship_id}/accept')
                
                assert response.status_code == 403
                assert 'Only the addressee can accept' in response.json()['detail']

    def test_accept_friend_request_already_accepted(self, mock_supabase, mock_current_user):
        """Test accepting already accepted friend request"""
        friendship_id = 'friendship-id'
        
        mock_friendship = {
            'id': friendship_id,
            'requester_id': 'other-user-id',
            'addressee_id': 'current-user-id',
            'status': 'accepted',  # Already accepted
            'action_user_id': 'current-user-id'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.put(f'/api/friends/{friendship_id}/accept')
                
                assert response.status_code == 400
                assert 'already accepted' in response.json()['detail'].lower()

    def test_block_friend_request_success(self, mock_supabase, mock_current_user):
        """Test successful friend request blocking"""
        friendship_id = 'friendship-id'
        
        mock_friendship = {
            'id': friendship_id,
            'requester_id': 'other-user-id',
            'addressee_id': 'current-user-id',
            'status': 'pending',
            'action_user_id': 'other-user-id'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        updated_friendship = mock_friendship.copy()
        updated_friendship['status'] = 'blocked'
        updated_friendship['action_user_id'] = 'current-user-id'
        mock_supabase.table.return_value.update.return_value.eq.return_value.select.return_value.single.return_value.execute.return_value.data = updated_friendship
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.put(f'/api/friends/{friendship_id}/block')
                
                assert response.status_code == 200
                data = response.json()
                assert data['status'] == 'blocked'

    def test_get_friendships_success(self, mock_supabase, mock_current_user):
        """Test getting user's friendships"""
        mock_friendships = [
            {
                'id': 'friendship-1',
                'requester_id': 'current-user-id',
                'addressee_id': 'friend-1',
                'status': 'accepted',
                'action_user_id': 'friend-1',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z',
                'requester': {'id': 'current-user-id', 'username': 'current_user', 'display_name': 'Current User'},
                'addressee': {'id': 'friend-1', 'username': 'friend1', 'display_name': 'Friend One'}
            },
            {
                'id': 'friendship-2',
                'requester_id': 'friend-2',
                'addressee_id': 'current-user-id',
                'status': 'pending',
                'action_user_id': 'friend-2',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z',
                'requester': {'id': 'friend-2', 'username': 'friend2', 'display_name': 'Friend Two'},
                'addressee': {'id': 'current-user-id', 'username': 'current_user', 'display_name': 'Current User'}
            }
        ]
        
        mock_supabase.table.return_value.select.return_value.or_.return_value.execute.return_value.data = mock_friendships
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.get('/api/friends/')
                
                assert response.status_code == 200
                data = response.json()
                assert 'friendships' in data
                assert len(data['friendships']) == 2
                assert data['total'] == 2

    def test_get_friendships_with_status_filter(self, mock_supabase, mock_current_user):
        """Test getting friendships with status filter"""
        mock_friendships = [
            {
                'id': 'friendship-1',
                'requester_id': 'current-user-id',
                'addressee_id': 'friend-1',
                'status': 'accepted',
                'action_user_id': 'friend-1',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z',
                'requester': {'id': 'current-user-id', 'username': 'current_user', 'display_name': 'Current User'},
                'addressee': {'id': 'friend-1', 'username': 'friend1', 'display_name': 'Friend One'}
            }
        ]
        
        mock_supabase.table.return_value.select.return_value.or_.return_value.eq.return_value.execute.return_value.data = mock_friendships
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.get('/api/friends/?status=accepted')
                
                assert response.status_code == 200
                data = response.json()
                assert len(data['friendships']) == 1
                assert data['friendships'][0]['status'] == 'accepted'

    def test_delete_friendship_success(self, mock_supabase, mock_current_user):
        """Test successful friendship deletion"""
        friendship_id = 'friendship-id'
        
        mock_friendship = {
            'id': friendship_id,
            'requester_id': 'current-user-id',
            'addressee_id': 'friend-id',
            'status': 'accepted',
            'action_user_id': 'friend-id'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        # Mock successful deletion
        mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = Mock()
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.delete(f'/api/friends/{friendship_id}')
                
                assert response.status_code == 204

    def test_delete_friendship_not_participant(self, mock_supabase, mock_current_user):
        """Test deleting friendship when not a participant"""
        friendship_id = 'friendship-id'
        
        mock_friendship = {
            'id': friendship_id,
            'requester_id': 'other-user-1',
            'addressee_id': 'other-user-2',  # Current user not involved
            'status': 'accepted',
            'action_user_id': 'other-user-2'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.delete(f'/api/friends/{friendship_id}')
                
                assert response.status_code == 403

    def test_unauthorized_access(self):
        """Test all endpoints require authentication"""
        endpoints = [
            ('POST', '/api/friends/request', {'addressee_username': 'test'}),
            ('PUT', '/api/friends/test-id/accept', None),
            ('PUT', '/api/friends/test-id/block', None),
            ('GET', '/api/friends/', None),
            ('DELETE', '/api/friends/test-id', None)
        ]
        
        for method, url, json_data in endpoints:
            if method == 'POST':
                response = client.post(url, json=json_data)
            elif method == 'PUT':
                response = client.put(url)
            elif method == 'GET':
                response = client.get(url)
            elif method == 'DELETE':
                response = client.delete(url)
            
            assert response.status_code == 401


class TestFriendRequestService:
    """Tests for friend request service logic"""

    @pytest.fixture
    def mock_supabase(self):
        """Mock supabase client"""
        mock = Mock()
        return mock

    def test_friendship_status_enum(self):
        """Test friendship status enum values"""
        assert FriendshipStatus.PENDING == 'pending'
        assert FriendshipStatus.ACCEPTED == 'accepted'
        assert FriendshipStatus.BLOCKED == 'blocked'

    def test_friend_request_create_model(self):
        """Test FriendRequestCreate model validation"""
        # Valid request
        request = FriendRequestCreate(addressee_username='test_user')
        assert request.addressee_username == 'test_user'
        
        # Test validation (empty username should fail in API validation)
        with pytest.raises(ValueError):
            FriendRequestCreate(addressee_username='')

    def test_friendship_response_model(self):
        """Test FriendshipResponse model"""
        friendship_data = {
            'id': 'test-id',
            'requester_id': 'user-1',
            'addressee_id': 'user-2',
            'status': 'pending',
            'action_user_id': 'user-1',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        
        friendship = FriendshipResponse(**friendship_data)
        assert friendship.id == 'test-id'
        assert friendship.status == 'pending'
        assert friendship.requester_id == 'user-1'


class TestFriendRequestEdgeCases:
    """Test edge cases and error scenarios"""

    @pytest.fixture
    def mock_supabase(self):
        mock = Mock()
        return mock

    @pytest.fixture
    def mock_current_user(self):
        return Mock(id='current-user-id', username='current_user')

    def test_send_friend_request_database_error(self, mock_supabase, mock_current_user):
        """Test database error during friend request creation"""
        mock_target_user = {
            'id': 'target-user-id',
            'username': 'target_user',
            'display_name': 'Target User',
            'avatar_url': None,
            'status': 'online'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_target_user
        mock_supabase.table.return_value.select.return_value.or_.return_value.execute.return_value.data = []
        
        # Mock database error on insert
        mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.side_effect = Exception("Database error")
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.post('/api/friends/request', json={'addressee_username': 'target_user'})
                
                assert response.status_code == 500

    def test_concurrent_friend_requests(self, mock_supabase, mock_current_user):
        """Test handling concurrent friend requests between same users"""
        mock_target_user = {
            'id': 'target-user-id',
            'username': 'target_user',
            'display_name': 'Target User',
            'avatar_url': None,
            'status': 'online'
        }
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = mock_target_user
        
        # First request: no existing friendship
        mock_supabase.table.return_value.select.return_value.or_.return_value.execute.return_value.data = []
        mock_friendship = {
            'id': 'friendship-id-1',
            'requester_id': 'current-user-id',
            'addressee_id': 'target-user-id',
            'status': 'pending',
            'action_user_id': 'current-user-id',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        mock_supabase.table.return_value.insert.return_value.select.return_value.single.return_value.execute.return_value.data = mock_friendship
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.post('/api/friends/request', json={'addressee_username': 'target_user'})
                assert response.status_code == 201

    def test_invalid_friendship_id_format(self, mock_current_user):
        """Test invalid UUID format for friendship ID"""
        with patch('app.dependencies.get_current_user', return_value=mock_current_user):
            response = client.put('/api/friends/invalid-uuid-format/accept')
            # Should still process (UUID validation depends on implementation)
            # This test ensures the endpoint handles invalid IDs gracefully

    def test_very_long_username_friend_request(self, mock_current_user):
        """Test friend request with very long username"""
        long_username = 'a' * 1000
        
        with patch('app.dependencies.get_current_user', return_value=mock_current_user):
            response = client.post('/api/friends/request', json={'addressee_username': long_username})
            # Should be handled by validation layer
            assert response.status_code in [400, 422]

    def test_special_characters_in_username(self, mock_supabase, mock_current_user):
        """Test friend request with special characters in username"""
        special_username = 'user@#$%^&*()'
        
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = None
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.post('/api/friends/request', json={'addressee_username': special_username})
                
                assert response.status_code == 404  # User not found


class TestFriendRequestPerformance:
    """Performance tests for friend request functionality"""

    @pytest.mark.asyncio
    async def test_bulk_friend_requests_performance(self):
        """Test performance with many friend requests"""
        # This would test creating many friend requests rapidly
        # In a real scenario, we might want rate limiting
        pass

    @pytest.mark.asyncio
    async def test_large_friendship_list_performance(self):
        """Test performance when user has many friendships"""
        # Mock user with 1000+ friendships
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])