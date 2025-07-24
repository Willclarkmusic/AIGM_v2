#!/usr/bin/env python3
"""
Pytest configuration and fixtures for messaging tests
"""

import pytest
import os
import sys
import json
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from pathlib import Path

# Add the parent directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

# Mock environment variables for testing
@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Set up test environment variables"""
    test_env = {
        'ENVIRONMENT': 'testing',
        'DEBUG': 'True',
        'SUPABASE_URL': 'https://test.supabase.co',
        'SUPABASE_ANON_KEY': 'test-anon-key',
        'SUPABASE_SERVICE_ROLE_KEY': 'test-service-key',
        'SUPABASE_JWT_SECRET': 'test-jwt-secret',
        'SECRET_KEY': 'test-secret-key',
        'REDIS_URL': 'redis://localhost:6379/0'
    }
    
    for key, value in test_env.items():
        os.environ.setdefault(key, value)


@pytest.fixture
def mock_user():
    """Mock user data"""
    return {
        'id': 'user-123',
        'username': 'testuser',
        'display_name': 'Test User',
        'email': 'test@example.com',
        'avatar_url': None,
        'status': 'online',
        'status_color': '#22c55e',
        'created_at': '2024-01-01T00:00:00Z'
    }


@pytest.fixture
def mock_friend():
    """Mock friend user data"""
    return {
        'id': 'friend-456',
        'username': 'frienduser',
        'display_name': 'Friend User',
        'email': 'friend@example.com',
        'avatar_url': None,
        'status': 'online',
        'status_color': '#22c55e',
        'created_at': '2024-01-01T00:00:00Z'
    }


@pytest.fixture
def mock_conversation(mock_user, mock_friend):
    """Mock conversation data"""
    return {
        'id': 'conv-789',
        'created_at': '2024-01-01T00:00:00Z',
        'updated_at': '2024-01-01T00:00:00Z',
        'participants': [mock_user, mock_friend],
        'last_message': None,
        'last_message_at': None,
        'unread_count': 0
    }


@pytest.fixture
def mock_tiptap_content():
    """Mock TipTap content structure"""
    return {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": "Hello, this is a test message!"
                    }
                ]
            }
        ]
    }


@pytest.fixture
def mock_message(mock_user, mock_tiptap_content):
    """Mock message data"""
    return {
        'id': 'msg-123',
        'content': mock_tiptap_content,
        'author_id': mock_user['id'],
        'dm_conversation_id': 'conv-789',
        'room_id': None,
        'created_at': '2024-01-01T00:00:00Z',
        'updated_at': '2024-01-01T00:00:00Z'
    }


@pytest.fixture
def mock_auth_headers():
    """Mock authentication headers"""
    return {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
    }


@pytest.fixture
def mock_supabase_client():
    """Mock Supabase client"""
    client = MagicMock()
    
    # Mock table operations
    table_mock = MagicMock()
    client.table.return_value = table_mock
    
    # Mock auth operations
    auth_mock = MagicMock()
    client.auth = auth_mock
    
    # Mock RPC calls
    client.rpc.return_value.execute.return_value.data = 'conv-789'
    
    return client


@pytest.fixture
def mock_friend_service():
    """Mock FriendService"""
    with patch('app.services.friend.FriendService') as mock:
        mock.are_friends.return_value = True
        yield mock


@pytest.fixture
def mock_message_service():
    """Mock MessageService"""
    with patch('app.services.message.MessageService') as mock:
        yield mock


@pytest.fixture
def mock_conversation_service():
    """Mock ConversationService"""
    with patch('app.services.conversation.ConversationService') as mock:
        yield mock


@pytest.fixture
def sample_tiptap_contents():
    """Sample TipTap content for various formatting scenarios"""
    return {
        'simple_text': {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Simple text message"}]
                }
            ]
        },
        'bold_text': {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "This is bold text",
                            "marks": [{"type": "bold"}]
                        }
                    ]
                }
            ]
        },
        'italic_text': {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "This is italic text",
                            "marks": [{"type": "italic"}]
                        }
                    ]
                }
            ]
        },
        'code_text': {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "console.log('hello')",
                            "marks": [{"type": "code"}]
                        }
                    ]
                }
            ]
        },
        'mixed_formatting': {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Normal "},
                        {
                            "type": "text", 
                            "text": "bold", 
                            "marks": [{"type": "bold"}]
                        },
                        {"type": "text", "text": " and "},
                        {
                            "type": "text", 
                            "text": "italic", 
                            "marks": [{"type": "italic"}]
                        },
                        {"type": "text", "text": " text."}
                    ]
                }
            ]
        },
        'multiple_paragraphs': {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "First paragraph"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Second paragraph"}]
                }
            ]
        }
    }


@pytest.fixture
def api_error_responses():
    """Sample API error responses"""
    return {
        'user_not_found': {
            'status_code': 404,
            'detail': "User 'nonexistent' not found"
        },
        'not_friends': {
            'status_code': 403,
            'detail': 'You can only start conversations with friends'
        },
        'conversation_not_found': {
            'status_code': 404,
            'detail': 'Conversation not found'
        },
        'permission_denied': {
            'status_code': 403,
            'detail': 'You are not a participant in this conversation'
        },
        'not_authenticated': {
            'status_code': 401,
            'detail': 'Not authenticated'
        },
        'validation_error': {
            'status_code': 422,
            'detail': 'Validation error'
        },
        'internal_error': {
            'status_code': 500,
            'detail': 'Internal server error'
        }
    }


# Async test utilities
@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# Test markers
def pytest_configure(config):
    """Configure custom pytest markers"""
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "api: marks tests as API tests"
    )
    config.addinivalue_line(
        "markers", "frontend: marks tests as frontend tests"
    )
    config.addinivalue_line(
        "markers", "ui: marks tests as UI tests"
    )


# Test collection
def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on file names"""
    for item in items:
        # Add markers based on file names
        if "test_conversation_api" in item.fspath.basename:
            item.add_marker(pytest.mark.api)
            item.add_marker(pytest.mark.unit)
        elif "test_message_api" in item.fspath.basename:
            item.add_marker(pytest.mark.api)
            item.add_marker(pytest.mark.unit)
        elif "test_frontend_services" in item.fspath.basename:
            item.add_marker(pytest.mark.integration)
            item.add_marker(pytest.mark.frontend)
        elif "test_ui_components" in item.fspath.basename:
            item.add_marker(pytest.mark.ui)
            item.add_marker(pytest.mark.frontend)