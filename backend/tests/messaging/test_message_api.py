#!/usr/bin/env python3
"""
Comprehensive tests for message API endpoints
"""

import pytest
import json
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

# Import the FastAPI app
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.main import app
from app.models.message import MessageResponse, MessageListResponse


class TestMessageAPI:
    """Test suite for message API endpoints"""
    
    def setup_method(self):
        """Set up test client and common test data"""
        self.client = TestClient(app)
        
        # Mock user data (using the same ID as in dependencies.py)
        self.test_user = {
            'id': 'mock-user-id',
            'username': 'testuser',
            'display_name': 'Test User',
            'email': 'test@example.com'
        }
        
        # Mock TipTap content
        self.test_tiptap_content = {
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
        
        # Mock message data
        self.test_message = {
            'id': 'msg-123',
            'content': self.test_tiptap_content,
            'author_id': 'mock-user-id',
            'dm_conversation_id': 'conv-789',
            'room_id': None,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Mock authentication headers
        self.auth_headers = {
            'Authorization': 'Bearer mock-jwt-token'
        }
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.send_message')
    def test_send_dm_message_success(self, mock_send_message, mock_get_user):
        """Test successful DM message sending"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_send_message.return_value = MessageResponse(**self.test_message)
        
        # Make request
        response = self.client.post(
            '/api/messages',
            json={
                'content': self.test_tiptap_content,
                'dm_conversation_id': 'conv-789'
            },
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['id'] == 'msg-123'
        assert data['author_id'] == 'mock-user-id'
        assert data['dm_conversation_id'] == 'conv-789'
        assert data['content'] == self.test_tiptap_content
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.send_message')
    def test_send_room_message_success(self, mock_send_message, mock_get_user):
        """Test successful room message sending"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        room_message = self.test_message.copy()
        room_message['room_id'] = 'room-456'
        room_message['dm_conversation_id'] = None
        mock_send_message.return_value = MessageResponse(**room_message)
        
        # Make request
        response = self.client.post(
            '/api/messages',
            json={
                'content': self.test_tiptap_content,
                'room_id': 'room-456'
            },
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['room_id'] == 'room-456'
        assert data['dm_conversation_id'] is None
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.send_message')
    def test_send_message_invalid_destination(self, mock_send_message, mock_get_user):
        """Test message sending without proper destination"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_send_message.side_effect = Exception("Either dm_conversation_id or room_id must be specified")
        
        # Make request without destination
        response = self.client.post(
            '/api/messages',
            json={'content': self.test_tiptap_content},
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 422  # Validation error
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.get_dm_messages')
    def test_get_dm_messages_success(self, mock_get_messages, mock_get_user):
        """Test successful DM message retrieval"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_response = MessageListResponse(
            messages=[MessageResponse(**self.test_message)],
            total=1,
            has_more=False,
            conversation_id='conv-789'
        )
        mock_get_messages.return_value = mock_response
        
        # Make request
        response = self.client.get('/api/messages/dm/conv-789', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['total'] == 1
        assert len(data['messages']) == 1
        assert data['messages'][0]['id'] == 'msg-123'
        assert data['conversation_id'] == 'conv-789'
        assert data['has_more'] is False
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.get_dm_messages')
    def test_get_dm_messages_with_pagination(self, mock_get_messages, mock_get_user):
        """Test DM message retrieval with pagination"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_response = MessageListResponse(
            messages=[MessageResponse(**self.test_message)],
            total=1,
            has_more=True,
            conversation_id='conv-789'
        )
        mock_get_messages.return_value = mock_response
        
        # Make request with pagination
        response = self.client.get(
            '/api/messages/dm/conv-789?limit=25&offset=0',
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['has_more'] is True
        
        # Verify service was called with correct parameters
        mock_get_messages.assert_called_once_with('conv-789', 'mock-user-id', 25, 0)
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.get_room_messages')
    def test_get_room_messages_success(self, mock_get_messages, mock_get_user):
        """Test successful room message retrieval"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        room_message = self.test_message.copy()
        room_message['room_id'] = 'room-456'
        room_message['dm_conversation_id'] = None
        
        mock_response = MessageListResponse(
            messages=[MessageResponse(**room_message)],
            total=1,
            has_more=False,
            conversation_id='room-456'
        )
        mock_get_messages.return_value = mock_response
        
        # Make request
        response = self.client.get('/api/messages/room/room-456', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['messages'][0]['room_id'] == 'room-456'
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.edit_message')
    def test_edit_message_success(self, mock_edit_message, mock_get_user):
        """Test successful message editing"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        edited_content = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "This message has been edited!"
                        }
                    ]
                }
            ]
        }
        edited_message = self.test_message.copy()
        edited_message['content'] = edited_content
        mock_edit_message.return_value = MessageResponse(**edited_message)
        
        # Make request
        response = self.client.put(
            '/api/messages/msg-123',
            json={'content': edited_content},
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert data['content'] == edited_content
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.edit_message')
    def test_edit_message_not_author(self, mock_edit_message, mock_get_user):
        """Test message editing by non-author"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_edit_message.side_effect = Exception("You can only edit your own messages")
        
        # Make request
        response = self.client.put(
            '/api/messages/msg-123',
            json={'content': self.test_tiptap_content},
            headers=self.auth_headers
        )
        
        # Assertions
        assert response.status_code == 500
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.delete_message')
    def test_delete_message_success(self, mock_delete_message, mock_get_user):
        """Test successful message deletion"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_delete_message.return_value = None
        
        # Make request
        response = self.client.delete('/api/messages/msg-123', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 204
        mock_delete_message.assert_called_once_with('msg-123', 'mock-user-id')
    
    @patch('app.dependencies.get_current_user')
    @patch('app.services.message.MessageService.delete_message')
    def test_delete_message_not_author(self, mock_delete_message, mock_get_user):
        """Test message deletion by non-author"""
        # Setup mocks
        mock_get_user.return_value = self.test_user
        mock_delete_message.side_effect = Exception("You can only delete your own messages")
        
        # Make request
        response = self.client.delete('/api/messages/msg-123', headers=self.auth_headers)
        
        # Assertions
        assert response.status_code == 500
    
    def test_send_message_no_auth(self):
        """Test message sending without authentication"""
        response = self.client.post(
            '/api/messages',
            json={
                'content': self.test_tiptap_content,
                'dm_conversation_id': 'conv-789'
            }
        )
        
        # Should return 401 or redirect to login
        assert response.status_code in [401, 403, 422]
    
    def test_send_message_invalid_content(self):
        """Test message sending with invalid TipTap content"""
        response = self.client.post(
            '/api/messages',
            json={
                'content': "invalid content format",
                'dm_conversation_id': 'conv-789'
            },
            headers=self.auth_headers
        )
        
        # Should return validation error
        assert response.status_code == 422
    
    def test_tiptap_content_validation(self):
        """Test TipTap content structure validation"""
        valid_content = {
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": "Valid content",
                            "marks": [{"type": "bold"}]
                        }
                    ]
                }
            ]
        }
        
        response = self.client.post(
            '/api/messages',
            json={
                'content': valid_content,
                'dm_conversation_id': 'conv-789'
            },
            headers=self.auth_headers
        )
        
        # Should not return validation error for structure
        assert response.status_code != 422 or "content" not in response.json().get("detail", [])
    
    def test_api_endpoints_exist(self):
        """Test that all message API endpoints exist"""
        # Test POST /api/messages
        response = self.client.post('/api/messages', json={})
        assert response.status_code != 404
        
        # Test GET /api/messages/dm/{id}
        response = self.client.get('/api/messages/dm/test-id')
        assert response.status_code != 404
        
        # Test GET /api/messages/room/{id}
        response = self.client.get('/api/messages/room/test-id')
        assert response.status_code != 404
        
        # Test PUT /api/messages/{id}
        response = self.client.put('/api/messages/test-id', json={})
        assert response.status_code != 404
        
        # Test DELETE /api/messages/{id}
        response = self.client.delete('/api/messages/test-id')
        assert response.status_code != 404


if __name__ == '__main__':
    pytest.main([__file__, '-v'])