"""
Pytest configuration and fixtures for AIGM tests
"""

import pytest
import os
import sys
from pathlib import Path
from unittest.mock import Mock
from fastapi.testclient import TestClient

# Add the parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment variables
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEBUG"] = "true"

# Mock Supabase credentials for testing
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-key"
os.environ["SUPABASE_JWT_SECRET"] = "test-jwt-secret"


# Test data
TEST_USERS = [
    {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "username": "alice",
        "display_name": "Alice Johnson",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=alice",
        "status": "online"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "username": "bob",
        "display_name": "Bob Smith",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=bob",
        "status": "online"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "username": "charlie",
        "display_name": "Charlie Brown",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=charlie",
        "status": "online"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "username": "diana",
        "display_name": "Diana Prince",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=diana",
        "status": "online"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440005",
        "username": "eve",
        "display_name": "Eve Williams",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=eve",
        "status": "online"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440006",
        "username": "alexander",
        "display_name": "Alexander the Great",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=alexander",
        "status": "online"
    },
    {
        "id": "550e8400-e29b-41d4-a716-446655440007",
        "username": "alexandra",
        "display_name": "Alexandra Smith",
        "avatar_url": "https://api.dicebear.com/7.x/avataaars/svg?seed=alexandra",
        "status": "online"
    }
]


@pytest.fixture
def mock_supabase_client():
    """Create a mock Supabase client"""
    mock_client = Mock()
    
    # Track calls to determine which type of query this is
    table_calls = []
    
    def create_user_profiles_mock(is_count_query=False):
        """Create a fresh mock for user_profiles table operations"""
        mock_table = Mock()
        mock_select = Mock()
        mock_neq = Mock()
        mock_or = Mock()
        mock_not = Mock()
        mock_in = Mock()
        mock_order = Mock()
        mock_range = Mock()
        
        # Set up the chain
        mock_table.select.return_value = mock_select
        mock_select.neq.return_value = mock_neq
        mock_neq.or_.return_value = mock_or
        mock_or.not_ = mock_not
        mock_not.in_.return_value = mock_in
        mock_or.order.return_value = mock_order
        mock_in.order.return_value = mock_order
        mock_order.range.return_value = mock_range
        
        if is_count_query:
            # Count query response
            mock_response = Mock()
            mock_response.count = 6  # Total users excluding alice
            mock_response.data = []
            mock_or.execute.return_value = mock_response
            mock_in.execute.return_value = mock_response
        else:
            # Main search query response with pagination support
            all_users = [user for user in TEST_USERS if user["id"] != TEST_USERS[0]["id"]]  # Exclude Alice
            
            def mock_range_func(start, end):
                """Mock range function that actually applies pagination"""
                # Calculate the slice based on start and end indices
                paginated_users = all_users[start:end+1] if start < len(all_users) else []
                
                mock_range_response = Mock()
                mock_range_response.data = paginated_users
                mock_range_response.count = len(paginated_users)
                
                def mock_execute():
                    return mock_range_response
                
                result_mock = Mock()
                result_mock.execute = mock_execute
                return result_mock
            
            mock_order.range = mock_range_func
            
            # Fallback for direct execute calls (shouldn't happen in normal flow)
            mock_response = Mock()
            mock_response.data = all_users
            mock_response.count = len(all_users)
        
        return mock_table
    
    # Mock the friendships table (blocked users query)
    mock_friendships_table = Mock()
    mock_friendships_select = Mock()
    mock_friendships_or = Mock()
    mock_friendships_response = Mock()
    mock_friendships_response.data = []  # No blocked users
    mock_friendships_response.count = 0
    mock_friendships_or.execute.return_value = mock_friendships_response
    mock_friendships_select.or_.return_value = mock_friendships_or
    mock_friendships_table.select.return_value = mock_friendships_select
    
    # Configure table routing
    def get_table(table_name):
        if table_name == "friendships":
            return mock_friendships_table
        elif table_name == "user_profiles":
            table_calls.append(table_name)
            # First call is main query, second is count query
            is_count_query = len(table_calls) % 2 == 0
            return create_user_profiles_mock(is_count_query)
        return create_user_profiles_mock()
    
    mock_client.table.side_effect = get_table
    
    return mock_client


@pytest.fixture
def test_client(mock_supabase_client):
    """Create test client with dependency overrides"""
    from app.main import app
    from app.dependencies import get_supabase, get_current_user
    from app.models.user import UserProfile
    from datetime import datetime
    
    # Create test client
    test_client = TestClient(app)
    
    # Override dependencies
    def override_get_supabase():
        return mock_supabase_client
    
    def override_get_current_user():
        return UserProfile(
            id=TEST_USERS[0]["id"],  # Alice
            username=TEST_USERS[0]["username"],
            display_name=TEST_USERS[0]["display_name"],
            avatar_url=TEST_USERS[0]["avatar_url"],
            custom_url=None,
            status=TEST_USERS[0]["status"],
            status_text=None,
            status_color="#22c55e",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    app.dependency_overrides[get_supabase] = override_get_supabase
    app.dependency_overrides[get_current_user] = override_get_current_user
    
    yield test_client
    
    # Clean up
    app.dependency_overrides.clear()


@pytest.fixture
def client(test_client):
    """Alias for test_client to maintain compatibility"""
    return test_client


@pytest.fixture
def unauthenticated_client():
    """Create test client without authentication override"""
    from app.main import app
    from fastapi.testclient import TestClient
    
    # Create test client without dependency overrides
    return TestClient(app)


@pytest.fixture
def auth_headers():
    """Mock authentication headers"""
    return {"Authorization": "Bearer fake-jwt-token"}