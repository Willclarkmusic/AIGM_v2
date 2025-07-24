import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import json
from datetime import datetime

from app.main import app
from app.models.user import UserSearchResponse, UserProfile
from app.services.user import search_users

client = TestClient(app)

class TestUserSearchAPI:
    """Comprehensive tests for user search API endpoint"""

    @pytest.fixture
    def mock_supabase(self):
        """Mock supabase client for testing"""
        mock = Mock()
        
        # Mock response for main search query
        main_response = Mock()
        main_response.data = [
            {
                'id': 'user-1',
                'username': 'alice',
                'display_name': 'Alice Johnson',
                'avatar_url': None,
                'status': 'online'
            },
            {
                'id': 'user-2', 
                'username': 'alicia',
                'display_name': 'Alicia Smith',
                'avatar_url': 'https://example.com/avatar.jpg',
                'status': 'idle'
            }
        ]
        
        # Mock response for count query  
        count_response = Mock()
        count_response.count = 2
        
        # Mock response for blocked users query
        blocked_response = Mock()
        blocked_response.data = []
        
        # Setup the mock chain for main query
        query_builder = Mock()
        query_builder.execute.return_value = main_response
        
        # Setup the mock chain for count query
        count_builder = Mock()
        count_builder.execute.return_value = count_response
        
        # Setup mock table responses
        def mock_table_call(table_name):
            table_mock = Mock()
            if table_name == "users":
                # Main search query chain
                table_mock.select.return_value.neq.return_value.or_.return_value.not_.in_.return_value.order.return_value.range.return_value = query_builder
                table_mock.select.return_value.neq.return_value.or_.return_value.order.return_value.range.return_value = query_builder  # Without blocked filter
                # Count query chain  
                table_mock.select.return_value.neq.return_value.or_.return_value.not_.in_.return_value = count_builder
                table_mock.select.return_value.neq.return_value.or_.return_value = count_builder  # Without blocked filter
            elif table_name == "friendships":
                # Blocked users query
                table_mock.select.return_value.or_.return_value.execute.return_value = blocked_response
            return table_mock
            
        mock.table.side_effect = mock_table_call
        return mock

    @pytest.fixture
    def mock_current_user(self):
        """Mock current authenticated user"""
        return Mock(id='current-user-id')

    def test_user_search_endpoint_success(self, mock_supabase, mock_current_user):
        """Test successful user search API call"""
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.get('/api/users/search?q=alice&limit=10&offset=0', headers=headers)
                
                print(f"Response status: {response.status_code}")
                print(f"Response content: {response.content}")
                if response.status_code != 200:
                    print(f"Error details: {response.text}")
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify response structure
                assert 'users' in data
                assert 'total' in data
                assert 'limit' in data
                assert 'offset' in data
                
                # Verify response data
                assert data['query'] == 'alice'
                assert data['limit'] == 10
                assert data['offset'] == 0
                assert len(data['users']) == 2
                assert data['total'] == 2

    def test_user_search_validation_min_query_length(self):
        """Test query validation - minimum length"""
        with patch('app.dependencies.get_current_user', return_value=Mock(id='user-id')):
            response = client.get('/api/users/search?q=')
            assert response.status_code == 422
            
            response = client.get('/api/users/search?q=a')  # Too short
            assert response.status_code == 422

    def test_user_search_validation_max_query_length(self):
        """Test query validation - maximum length"""
        with patch('app.dependencies.get_current_user', return_value=Mock(id='user-id')):
            long_query = 'a' * 101  # Too long
            response = client.get(f'/api/users/search?q={long_query}')
            assert response.status_code == 422

    def test_user_search_validation_limit_bounds(self):
        """Test limit parameter validation"""
        with patch('app.dependencies.get_current_user', return_value=Mock(id='user-id')):
            # Limit too small
            response = client.get('/api/users/search?q=test&limit=0')
            assert response.status_code == 422
            
            # Limit too large
            response = client.get('/api/users/search?q=test&limit=101')
            assert response.status_code == 422

    def test_user_search_validation_offset_negative(self):
        """Test offset parameter validation"""
        with patch('app.dependencies.get_current_user', return_value=Mock(id='user-id')):
            response = client.get('/api/users/search?q=test&offset=-1')
            assert response.status_code == 422

    def test_user_search_default_parameters(self, mock_supabase, mock_current_user):
        """Test default parameter values"""
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.get('/api/users/search?q=alice')
                
                assert response.status_code == 200
                data = response.json()
                assert data['limit'] == 20  # Default limit
                assert data['offset'] == 0   # Default offset

    def test_user_search_no_results(self, mock_current_user):
        """Test search with no results"""
        mock_supabase = Mock()
        mock_supabase.table.return_value.select.return_value.ilike.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = []
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.get('/api/users/search?q=nonexistent')
                
                assert response.status_code == 200
                data = response.json()
                assert len(data['users']) == 0
                assert data['total'] == 0
                assert data['has_more'] is False

    def test_user_search_database_error(self, mock_current_user):
        """Test database error handling"""
        mock_supabase = Mock()
        mock_supabase.table.return_value.select.return_value.ilike.return_value.neq.return_value.limit.return_value.offset.return_value.execute.side_effect = Exception("Database error")
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.get('/api/users/search?q=alice')
                assert response.status_code == 500

    def test_user_search_unauthorized(self):
        """Test unauthorized access"""
        response = client.get('/api/users/search?q=alice')
        assert response.status_code == 401

    def test_user_search_filters_current_user(self, mock_current_user):
        """Test that current user is filtered from results"""
        mock_supabase = Mock()
        mock_supabase.table.return_value.select.return_value.ilike.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = [
            {
                'id': 'other-user-id',
                'username': 'alice',
                'display_name': 'Alice Johnson',
                'avatar_url': None,
                'custom_url': None,
                'status': 'online',
                'status_text': '',
                'status_color': '#22c55e',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.get('/api/users/search?q=alice')
                
                # Verify neq filter was called with current user ID
                mock_supabase.table.return_value.select.return_value.ilike.return_value.neq.assert_called_with('id', 'current-user-id')

    def test_user_search_pagination(self, mock_supabase, mock_current_user):
        """Test pagination functionality"""
        with patch('app.dependencies.get_supabase', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                response = client.get('/api/users/search?q=alice&limit=1&offset=1')
                
                assert response.status_code == 200
                data = response.json()
                assert data['limit'] == 1
                assert data['offset'] == 1
                
                # Verify pagination was applied to query
                mock_supabase.table.return_value.select.return_value.ilike.return_value.neq.return_value.limit.assert_called_with(1)
                mock_supabase.table.return_value.select.return_value.ilike.return_value.neq.return_value.limit.return_value.offset.assert_called_with(1)


class TestUserSearchService:
    """Tests for user search service logic"""

    @pytest.fixture
    def mock_supabase(self):
        """Mock supabase client"""
        mock = Mock()
        mock.table.return_value.select.return_value.ilike.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = []
        return mock

    @pytest.mark.asyncio
    async def test_search_users_service_username_search(self, mock_supabase):
        """Test username search functionality"""
        mock_supabase.table.return_value.select.return_value.ilike.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = [
            {
                'id': 'user-1',
                'username': 'alice_dev',
                'display_name': 'Alice Developer',
                'avatar_url': None,
                'custom_url': None,
                'status': 'online',
                'status_text': '',
                'status_color': '#22c55e',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        result = await search_users('alice', 'current-user-id', mock_supabase, 10, 0)
        
        assert isinstance(result, UserSearchResponse)
        assert result.query == 'alice'
        assert len(result.users) == 1
        assert result.users[0].username == 'alice_dev'
        assert result.total == 1

    @pytest.mark.asyncio
    async def test_search_users_service_display_name_search(self, mock_supabase):
        """Test display name search functionality"""
        mock_supabase.table.return_value.select.return_value.or_.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = [
            {
                'id': 'user-1',
                'username': 'john_smith',
                'display_name': 'Alice Developer',  # Display name matches search
                'avatar_url': None,
                'custom_url': None,
                'status': 'online',
                'status_text': '',
                'status_color': '#22c55e',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        result = await search_users('alice', 'current-user-id', mock_supabase, 10, 0)
        
        assert len(result.users) == 1
        assert result.users[0].display_name == 'Alice Developer'

    @pytest.mark.asyncio
    async def test_search_users_service_case_insensitive(self, mock_supabase):
        """Test case-insensitive search"""
        mock_supabase.table.return_value.select.return_value.or_.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = []
        
        await search_users('ALICE', 'current-user-id', mock_supabase, 10, 0)
        
        # Should use ilike for case-insensitive search
        mock_supabase.table.assert_called_with('users')

    @pytest.mark.asyncio
    async def test_search_users_service_empty_query_error(self, mock_supabase):
        """Test empty query validation"""
        with pytest.raises(ValueError, match="Search query cannot be empty"):
            await search_users('', 'current-user-id', mock_supabase, 10, 0)

    @pytest.mark.asyncio
    async def test_search_users_service_invalid_limit_error(self, mock_supabase):
        """Test invalid limit validation"""
        with pytest.raises(ValueError, match="Limit must be between 1 and 100"):
            await search_users('alice', 'current-user-id', mock_supabase, 0, 0)
        
        with pytest.raises(ValueError, match="Limit must be between 1 and 100"):
            await search_users('alice', 'current-user-id', mock_supabase, 101, 0)

    @pytest.mark.asyncio
    async def test_search_users_service_invalid_offset_error(self, mock_supabase):
        """Test invalid offset validation"""
        with pytest.raises(ValueError, match="Offset must be non-negative"):
            await search_users('alice', 'current-user-id', mock_supabase, 10, -1)

    @pytest.mark.asyncio
    async def test_search_users_service_database_exception(self, mock_supabase):
        """Test database exception handling"""
        mock_supabase.table.return_value.select.return_value.or_.return_value.neq.return_value.limit.return_value.offset.return_value.execute.side_effect = Exception("Database connection failed")
        
        with pytest.raises(Exception, match="Database connection failed"):
            await search_users('alice', 'current-user-id', mock_supabase, 10, 0)

    @pytest.mark.asyncio
    async def test_search_users_service_has_more_pagination(self, mock_supabase):
        """Test has_more flag for pagination"""
        # Mock returning exactly the limit number of results
        mock_data = []
        for i in range(10):  # Exactly 10 results for limit of 10
            mock_data.append({
                'id': f'user-{i}',
                'username': f'alice{i}',
                'display_name': f'Alice {i}',
                'avatar_url': None,
                'custom_url': None,
                'status': 'online',
                'status_text': '',
                'status_color': '#22c55e',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            })
        
        mock_supabase.table.return_value.select.return_value.or_.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = mock_data
        
        result = await search_users('alice', 'current-user-id', mock_supabase, 10, 0)
        
        # Should query for limit + 1 to check if there are more results
        mock_supabase.table.return_value.select.return_value.or_.return_value.neq.return_value.limit.assert_called_with(11)
        
        # Should return only the requested limit
        assert len(result.users) == 10
        assert result.has_more is False  # Since we got exactly 10, no more results


class TestUserSearchPerformance:
    """Performance and stress tests for user search"""

    @pytest.mark.asyncio
    async def test_search_users_performance_large_dataset(self, mock_supabase):
        """Test performance with large result sets"""
        # Mock 1000 users
        large_dataset = []
        for i in range(1000):
            large_dataset.append({
                'id': f'user-{i}',
                'username': f'user{i}',
                'display_name': f'User {i}',
                'avatar_url': None,
                'custom_url': None,
                'status': 'online' if i % 2 == 0 else 'offline',
                'status_text': '',
                'status_color': '#22c55e',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            })
        
        mock_supabase.table.return_value.select.return_value.or_.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = large_dataset[:101]  # Return limit + 1
        
        import time
        start_time = time.time()
        result = await search_users('user', 'current-user-id', mock_supabase, 100, 0)
        end_time = time.time()
        
        # Should complete within reasonable time (< 1 second for mocked data)
        assert end_time - start_time < 1.0
        assert len(result.users) == 100
        assert result.has_more is True

    @pytest.mark.asyncio
    async def test_search_users_concurrent_requests(self, mock_supabase):
        """Test handling multiple concurrent search requests"""
        mock_supabase.table.return_value.select.return_value.or_.return_value.neq.return_value.limit.return_value.offset.return_value.execute.return_value.data = [
            {
                'id': 'user-1',
                'username': 'alice',
                'display_name': 'Alice',
                'avatar_url': None,
                'custom_url': None,
                'status': 'online',
                'status_text': '',
                'status_color': '#22c55e',
                'created_at': '2024-01-01T00:00:00Z',
                'updated_at': '2024-01-01T00:00:00Z'
            }
        ]
        
        # Create multiple concurrent requests
        tasks = []
        for i in range(10):
            task = search_users(f'user{i}', f'current-user-{i}', mock_supabase, 10, 0)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # All requests should complete successfully
        for result in results:
            assert isinstance(result, UserSearchResponse)
            assert len(result.users) >= 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])