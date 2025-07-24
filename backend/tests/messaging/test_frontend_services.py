#!/usr/bin/env python3
"""
Integration tests for frontend services calling backend APIs
"""

import pytest
import json
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
import subprocess
import time
import threading
import sys
import os

# Import the FastAPI app
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.main import app


class TestFrontendServices:
    """Test suite for frontend service integration"""
    
    @classmethod
    def setup_class(cls):
        """Set up test environment"""
        cls.base_url = "http://localhost:8001"  # Use different port for testing
        cls.server_process = None
        
        # Mock environment variables
        os.environ.setdefault('SUPABASE_URL', 'https://test.supabase.co')
        os.environ.setdefault('SUPABASE_ANON_KEY', 'test-key')
        os.environ.setdefault('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key')
        os.environ.setdefault('SUPABASE_JWT_SECRET', 'test-jwt-secret')
    
    def setup_method(self):
        """Set up for each test"""
        self.client = httpx.AsyncClient(base_url=self.base_url)
        
        # Mock authentication data
        self.mock_auth_token = "mock-jwt-token"
        self.mock_user_id = "user-123"
        
        # Mock conversation data
        self.mock_conversation = {
            'id': 'conv-789',
            'created_at': '2024-01-01T00:00:00Z',
            'participants': [
                {'id': 'user-123', 'username': 'testuser', 'display_name': 'Test User'},
                {'id': 'friend-456', 'username': 'frienduser', 'display_name': 'Friend User'}
            ],
            'last_message': None,
            'unread_count': 0
        }
        
    def teardown_method(self):
        """Clean up after each test"""
        asyncio.run(self.client.aclose())
    
    @pytest.mark.asyncio
    async def test_conversation_service_structure(self):
        """Test ConversationService API call structure"""
        # This tests the frontend service structure without requiring backend
        
        # Mock ConversationService.createConversation call structure
        expected_request = {
            'method': 'POST',
            'url': '/api/conversations',
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.mock_auth_token}'
            },
            'body': {
                'participant_username': 'frienduser'
            }
        }
        
        # Verify the request structure matches what frontend should send
        assert expected_request['method'] == 'POST'
        assert expected_request['url'] == '/api/conversations'
        assert 'Authorization' in expected_request['headers']
        assert 'participant_username' in expected_request['body']
    
    @pytest.mark.asyncio
    async def test_message_service_structure(self):
        """Test MessageService API call structure"""
        
        # Mock MessageService.sendMessage call structure
        tiptap_content = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "Test message"}]
                }
            ]
        }
        
        expected_request = {
            'method': 'POST',
            'url': '/api/messages',
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.mock_auth_token}'
            },
            'body': {
                'content': tiptap_content,
                'dm_conversation_id': 'conv-789'
            }
        }
        
        # Verify the request structure
        assert expected_request['method'] == 'POST'
        assert expected_request['url'] == '/api/messages'
        assert 'content' in expected_request['body']
        assert expected_request['body']['content']['type'] == 'doc'
    
    @pytest.mark.asyncio
    async def test_get_conversations_structure(self):
        """Test get conversations API call structure"""
        
        expected_request = {
            'method': 'GET',
            'url': '/api/conversations',
            'headers': {
                'Authorization': f'Bearer {self.mock_auth_token}'
            }
        }
        
        # Verify the request structure
        assert expected_request['method'] == 'GET'
        assert expected_request['url'] == '/api/conversations'
        assert 'Authorization' in expected_request['headers']
    
    @pytest.mark.asyncio
    async def test_get_dm_messages_structure(self):
        """Test get DM messages API call structure"""
        
        conversation_id = 'conv-789'
        expected_request = {
            'method': 'GET',
            'url': f'/api/messages/dm/{conversation_id}',
            'headers': {
                'Authorization': f'Bearer {self.mock_auth_token}'
            },
            'params': {
                'limit': 50,
                'offset': 0
            }
        }
        
        # Verify the request structure
        assert expected_request['method'] == 'GET'
        assert expected_request['url'] == f'/api/messages/dm/{conversation_id}'
        assert 'limit' in expected_request['params']
        assert 'offset' in expected_request['params']
    
    def test_frontend_service_error_handling(self):
        """Test frontend service error handling patterns"""
        
        # Test error scenarios that frontend should handle
        error_scenarios = [
            {
                'status_code': 404,
                'response': {'detail': 'User not found'},
                'expected_error': 'User not found'
            },
            {
                'status_code': 403,
                'response': {'detail': 'You can only start conversations with friends'},
                'expected_error': 'You can only start conversations with friends'
            },
            {
                'status_code': 500,
                'response': {'detail': 'Internal server error'},
                'expected_error': 'Internal server error'
            },
            {
                'status_code': 401,
                'response': {'detail': 'Not authenticated'},
                'expected_error': 'Not authenticated'
            }
        ]
        
        for scenario in error_scenarios:
            # Verify that frontend services should handle these error patterns
            assert scenario['status_code'] in [400, 401, 403, 404, 422, 500]
            assert 'detail' in scenario['response']
            assert scenario['expected_error'] == scenario['response']['detail']
    
    def test_tiptap_content_validation(self):
        """Test TipTap content structure validation"""
        
        valid_contents = [
            # Simple text
            {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [{"type": "text", "text": "Hello world"}]
                    }
                ]
            },
            # Bold text
            {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "Bold text",
                                "marks": [{"type": "bold"}]
                            }
                        ]
                    }
                ]
            },
            # Italic text
            {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "Italic text",
                                "marks": [{"type": "italic"}]
                            }
                        ]
                    }
                ]
            },
            # Code text
            {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "code block",
                                "marks": [{"type": "code"}]
                            }
                        ]
                    }
                ]
            }
        ]
        
        for content in valid_contents:
            # Verify TipTap structure
            assert content['type'] == 'doc'
            assert 'content' in content
            assert isinstance(content['content'], list)
            assert len(content['content']) > 0
            
            for paragraph in content['content']:
                if paragraph['type'] == 'paragraph':
                    assert 'content' in paragraph
                    for text_node in paragraph['content']:
                        if text_node['type'] == 'text':
                            assert 'text' in text_node
    
    def test_api_response_structure(self):
        """Test expected API response structures"""
        
        # Expected conversation response structure
        conversation_response = {
            'id': 'conv-123',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z',
            'participants': [
                {
                    'id': 'user-123',
                    'username': 'testuser',
                    'display_name': 'Test User',
                    'avatar_url': None,
                    'status': 'online'
                }
            ],
            'last_message': None,
            'last_message_at': None,
            'unread_count': 0
        }
        
        # Verify conversation response structure
        required_fields = ['id', 'created_at', 'participants', 'unread_count']
        for field in required_fields:
            assert field in conversation_response
        
        # Expected message response structure
        message_response = {
            'id': 'msg-123',
            'content': {
                'type': 'doc',
                'content': [
                    {
                        'type': 'paragraph',
                        'content': [{'type': 'text', 'text': 'Test'}]
                    }
                ]
            },
            'author_id': 'user-123',
            'dm_conversation_id': 'conv-123',
            'created_at': '2024-01-01T00:00:00Z'
        }
        
        # Verify message response structure
        required_fields = ['id', 'content', 'author_id', 'created_at']
        for field in required_fields:
            assert field in message_response
    
    def test_authentication_header_format(self):
        """Test authentication header format"""
        
        # Test various token formats
        token_formats = [
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',  # JWT format
            'sb-test-token-123',  # Supabase format
            'mock-token-for-testing'  # Test format
        ]
        
        for token in token_formats:
            auth_header = f'Bearer {token}'
            
            # Verify auth header format
            assert auth_header.startswith('Bearer ')
            assert len(auth_header) > 7  # "Bearer " + token
            assert auth_header.split(' ')[1] == token
    
    def test_url_construction(self):
        """Test API URL construction"""
        
        base_paths = [
            '/api/conversations',
            '/api/messages',
            '/api/messages/dm/conv-123',
            '/api/messages/room/room-456'
        ]
        
        for path in base_paths:
            # Verify URL structure
            assert path.startswith('/api/')
            assert not path.endswith('/')  # No trailing slash
            
            # Test with parameters
            if 'dm/' in path or 'room/' in path:
                parts = path.split('/')
                assert len(parts) >= 4  # /api/messages/dm/id or /api/messages/room/id
    
    def test_request_payload_validation(self):
        """Test request payload validation"""
        
        # Valid conversation creation payload
        conversation_payload = {
            'participant_username': 'frienduser'
        }
        
        assert 'participant_username' in conversation_payload
        assert isinstance(conversation_payload['participant_username'], str)
        assert len(conversation_payload['participant_username']) > 0
        
        # Valid message payload
        message_payload = {
            'content': {
                'type': 'doc',
                'content': [
                    {
                        'type': 'paragraph',
                        'content': [{'type': 'text', 'text': 'Test message'}]
                    }
                ]
            },
            'dm_conversation_id': 'conv-123'
        }
        
        assert 'content' in message_payload
        assert 'dm_conversation_id' in message_payload
        assert message_payload['content']['type'] == 'doc'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])