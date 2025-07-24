import pytest
import asyncio
from unittest.mock import Mock, patch
from app.services.user import search_users

class TestUserSearchService:
    """Simple test for user search service function directly"""

    @pytest.fixture
    def mock_supabase(self):
        """Mock supabase client for testing"""
        mock_supabase = Mock()
        
        # Mock responses
        users_data = [
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
        
        # Mock main search response
        main_response = Mock()
        main_response.data = users_data
        
        # Mock count response  
        count_response = Mock()
        count_response.count = 2
        
        # Mock blocked users response (empty)
        blocked_response = Mock()
        blocked_response.data = []
        
        # Create mock query builders 
        main_query_builder = Mock()
        main_query_builder.execute.return_value = main_response
        
        count_query_builder = Mock()
        count_query_builder.execute.return_value = count_response
        
        # Mock table method to return different builders for different tables and query types
        def mock_table(table_name):
            table_mock = Mock()
            
            if table_name == "users":
                # For the main search query: table().select().neq().or_().order().range().execute()
                select_mock = Mock()
                neq_mock = Mock()
                or_mock = Mock()
                order_mock = Mock()
                range_mock = Mock()
                
                # Chain: select -> neq -> or_ -> order -> range -> execute (main query)
                range_mock.execute.return_value = main_response
                order_mock.range.return_value = range_mock
                or_mock.order.return_value = order_mock
                neq_mock.or_.return_value = or_mock
                select_mock.neq.return_value = neq_mock
                table_mock.select.return_value = select_mock
                
                # For count query (different chain): table().select().neq().or_().execute()  
                count_select_mock = Mock()
                count_neq_mock = Mock() 
                count_or_mock = Mock()
                count_or_mock.execute.return_value = count_response
                count_neq_mock.or_.return_value = count_or_mock
                count_select_mock.neq.return_value = count_neq_mock
                
                # Handle the count="exact" call
                def select_with_count(fields, count=None):
                    if count == "exact":
                        return count_select_mock
                    return select_mock
                    
                table_mock.select.side_effect = select_with_count
                
            elif table_name == "friendships":
                # For blocked users query: table().select().or_().execute()
                blocked_select_mock = Mock()
                blocked_or_mock = Mock()
                blocked_or_mock.execute.return_value = blocked_response
                blocked_select_mock.or_.return_value = blocked_or_mock
                table_mock.select.return_value = blocked_select_mock
                
            return table_mock
            
        mock_supabase.table.side_effect = mock_table
        return mock_supabase

    @pytest.mark.asyncio
    async def test_search_users_service_success(self, mock_supabase):
        """Test successful user search service call"""
        result = await search_users("alice", "current-user-id", mock_supabase, 10, 0)
        
        assert result is not None
        assert result.users is not None
        assert len(result.users) == 2
        assert result.total == 2
        assert result.limit == 10
        assert result.offset == 0
        
        # Check first user
        first_user = result.users[0]
        assert first_user.username == 'alice'
        assert first_user.display_name == 'Alice Johnson'
        
    @pytest.mark.asyncio
    async def test_search_users_service_empty_query_error(self, mock_supabase):
        """Test user search service with empty query"""
        with pytest.raises(ValueError, match="Search query must be at least 1 character"):
            await search_users("", "current-user-id", mock_supabase, 10, 0)
            
    @pytest.mark.asyncio 
    async def test_search_users_service_long_query_error(self, mock_supabase):
        """Test user search service with overly long query"""
        long_query = "a" * 101
        with pytest.raises(ValueError, match="Search query cannot exceed 100 characters"):
            await search_users(long_query, "current-user-id", mock_supabase, 10, 0)