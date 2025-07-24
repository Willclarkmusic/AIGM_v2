#!/usr/bin/env python3
"""
Comprehensive tests for conversation API endpoints
"""

import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock

# Import the FastAPI app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.main import app
from app.models.conversation import ConversationResponse, ConversationListResponse
from app.models.user import UserProfile
from datetime import datetime


class TestConversationAPI:
    """Test suite for conversation API endpoints"""
    
    def setup_method(self):
        """Set up test client and common test data"""
        self.client = TestClient(app)
        
        # Mock user data (using the same ID as in dependencies.py)
        self.test_user = UserProfile(
            id='mock-user-id',
            username='testuser',
            display_name='Test User',
            status='online',
            status_color='#22c55e',
            created_at=datetime.fromisoformat('2024-01-01T00:00:00+00:00'),
            updated_at=datetime.fromisoformat('2024-01-01T00:00:00+00:00')
        )
        
        self.test_friend = UserProfile(
            id='friend-456',
            username='frienduser',
            display_name='Friend User',
            status='online',
            status_color='#22c55e',
            created_at=datetime.fromisoformat('2024-01-01T00:00:00+00:00'),
            updated_at=datetime.fromisoformat('2024-01-01T00:00:00+00:00')
        )
        
        # Mock conversation data
        self.test_conversation = {
            'id': 'conv-789',
            'created_at': datetime.fromisoformat('2024-01-01T00:00:00+00:00'),
            'updated_at': datetime.fromisoformat('2024-01-01T00:00:00+00:00'),
            'participants': [self.test_user, self.test_friend],
            'last_message': None,
            'last_message_at': None,
            'unread_count': 0
        }
        
        # Mock authentication headers
        self.auth_headers = {
            'Authorization': 'Bearer mock-jwt-token'
        }
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.create_or_find_conversation')
    def test_create_conversation_success(self, mock_create_conversation, mock_get_user):
        """Test successful conversation creation"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_create_conversation.return_value = ConversationResponse(**self.test_conversation)
        
        # Make request
        response = self.client.post(
            '/api/conversations',
            json={'participant_username': 'frienduser'},
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 'conv-789'
        assert len(data['participants']) == 2
        assert data['unread_count'] == 0
        
        # Verify service was called correctly
        mock_create_conversation.assert_called_once_with('mock-user-id', 'frienduser')
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.create_or_find_conversation')
    def test_create_conversation_user_not_found(self, mock_create_conversation, mock_get_user):
        """Test conversation creation with non-existent user"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_create_conversation.side_effect = Exception("User 'nonexistent' not found")
        
        # Make request
        response = self.client.post(
            '/api/conversations',
            json={'participant_username': 'nonexistent'},
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 500
        assert 'Internal server error' in response.json()['detail']
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.create_or_find_conversation')
    def test_create_conversation_not_friends(self, mock_create_conversation, mock_get_user):
        """Test conversation creation with non-friend"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_create_conversation.side_effect = Exception("You can only start conversations with friends")
        
        # Make request
        response = self.client.post(
            '/api/conversations',
            json={'participant_username': 'stranger'},
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 500
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.get_user_conversations')
    def test_get_conversations_success(self, mock_get_conversations, mock_get_user):
        """Test successful conversation listing"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_response = ConversationListResponse(
            conversations=[ConversationResponse(**self.test_conversation)],
            total=1
        )
        mock_get_conversations.return_value = mock_response
        
        # Make request
        response = self.client.get('/api/conversations', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 1
        assert len(data['conversations']) == 1
        assert data['conversations'][0]['id'] == 'conv-789'
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.get_user_conversations')
    def test_get_conversations_empty(self, mock_get_conversations, mock_get_user):
        """Test conversation listing when user has no conversations"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_response = ConversationListResponse(conversations=[], total=0)
        mock_get_conversations.return_value = mock_response
        
        # Make request
        response = self.client.get('/api/conversations', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 0
        assert len(data['conversations']) == 0
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.get_conversation')
    def test_get_specific_conversation_success(self, mock_get_conversation, mock_get_user):
        """Test successful specific conversation retrieval"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_get_conversation.return_value = ConversationResponse(**self.test_conversation)
        
        # Make request
        response = self.client.get('/api/conversations/conv-789', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 'conv-789'
        assert len(data['participants']) == 2
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.get_conversation')
    def test_get_specific_conversation_not_found(self, mock_get_conversation, mock_get_user):
        """Test conversation retrieval with non-existent conversation"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_get_conversation.side_effect = Exception("Conversation not found")
        
        # Make request
        response = self.client.get('/api/conversations/nonexistent', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 500
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.conversation.ConversationService.delete_conversation')
    def test_delete_conversation_success(self, mock_delete_conversation, mock_get_user):
        """Test successful conversation deletion"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_delete_conversation.return_value = None
        
        # Make request
        response = self.client.delete('/api/conversations/conv-789', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 204
        mock_delete_conversation.assert_called_once_with('conv-789', 'mock-user-id')
    
    def test_create_conversation_no_auth(self):
        """Test conversation creation without authentication"""
        response = self.client.post(
            '/api/conversations',
            json={'participant_username': 'frienduser'}
        )
        
        # Should return 401 or redirect to login
        assert response.status_code in [401, 403, 422]
    
    def test_create_conversation_invalid_data(self):
        """Test conversation creation with invalid request data"""
        response = self.client.post(
            '/api/conversations',
            json={'invalid_field': 'value'},
            headers=self.auth_headers
        )
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_api_endpoints_exist(self):
        """Test that all conversation API endpoints exist"""
        # Test POST /api/conversations
        response = self.client.post('/api/conversations', json={})
        assert response.status_code != 404
        
        # Test GET /api/conversations
        response = self.client.get('/api/conversations')
        assert response.status_code != 404
        
        # Test GET /api/conversations/{id}
        response = self.client.get('/api/conversations/test-id')
        assert response.status_code != 404
        
        # Test DELETE /api/conversations/{id}
        response = self.client.delete('/api/conversations/test-id')
        assert response.status_code != 404


if __name__ == '__main__':
    pytest.main([__file__, '-v'])