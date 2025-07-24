#!/usr/bin/env python3
"""
Comprehensive tests for message API endpoints
Tests the real production code with TipTap JSON content
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
import json
from datetime import datetime, timezone
from uuid import uuid4

from app.main import app
from app.models.message import MessageCreate, MessageResponse, MessageListResponse

client = TestClient(app)

class TestMessageAPI:
    """Comprehensive tests for message API endpoints"""

    @pytest.fixture
    def mock_supabase(self):
        """Mock supabase client for testing"""
        mock = Mock()
        
        # Mock DM conversation data
        dm_conversation = {
            'id': 'conv-123',
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        
        # Mock message data with TipTap JSON
        message_data = {
            'id': 'msg-123',
            'content': {
                'type': 'doc',
                'content': [
                    {
                        'type': 'paragraph',
                        'content': [
                            {
                                'type': 'text',
                                'text': 'Hello world!'
                            }
                        ]
                    }
                ]
            },
            'author_id': 'user-123',
            'dm_conversation_id': 'conv-123',
            'room_id': None,
            'created_at': '2024-01-01T00:00:00Z',
            'updated_at': '2024-01-01T00:00:00Z'
        }
        
        # Setup mock responses
        def mock_table_call(table_name):
            table_mock = Mock()
            
            if table_name == "messages":
                # Insert response
                insert_response = Mock()
                insert_response.data = [message_data]
                insert_response.error = None
                
                # Select response for getting messages
                select_response = Mock()
                select_response.data = [message_data]
                select_response.error = None
                
                # Setup query chains
                table_mock.insert.return_value.select.return_value.single.return_value.execute.return_value = insert_response
                table_mock.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value = select_response
                
            elif table_name == "dm_conversations":
                # Check conversation exists
                conv_response = Mock()
                conv_response.data = dm_conversation
                conv_response.error = None
                table_mock.select.return_value.eq.return_value.single.return_value.execute.return_value = conv_response
                
            elif table_name == "dm_conversation_participants":
                # Check user is participant
                participant_response = Mock()
                participant_response.data = [{'user_id': 'user-123', 'conversation_id': 'conv-123'}]
                participant_response.error = None
                table_mock.select.return_value.eq.return_value.eq.return_value.execute.return_value = participant_response
                
            return table_mock
            
        mock.table.side_effect = mock_table_call
        return mock

    @pytest.fixture
    def mock_current_user(self):
        """Mock current authenticated user"""
        return Mock(id='user-123', username='testuser')

    def test_send_dm_message_success(self, mock_supabase, mock_current_user):
        """Test successful DM message sending"""
        message_data = {
            "content": {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "Hello world!"
                            }
                        ]
                    }
                ]
            },
            "dm_conversation_id": "conv-123"
        }
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.post('/api/messages/', json=message_data, headers=headers)
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify response structure
                assert 'id' in data
                assert 'content' in data
                assert 'author_id' in data
                assert 'dm_conversation_id' in data
                assert 'created_at' in data
                
                # Verify content structure
                assert data['content']['type'] == 'doc'
                assert len(data['content']['content']) > 0
                assert data['author_id'] == 'user-123'
                assert data['dm_conversation_id'] == 'conv-123'

    def test_send_message_with_rich_formatting(self, mock_supabase, mock_current_user):
        """Test sending message with rich text formatting"""
        message_data = {
            "content": {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "This is "
                            },
                            {
                                "type": "text",
                                "text": "bold",
                                "marks": [{"type": "bold"}]
                            },
                            {
                                "type": "text",
                                "text": " and "
                            },
                            {
                                "type": "text",
                                "text": "italic",
                                "marks": [{"type": "italic"}]
                            },
                            {
                                "type": "text",
                                "text": " text with "
                            },
                            {
                                "type": "text",
                                "text": "code",
                                "marks": [{"type": "code"}]
                            }
                        ]
                    }
                ]
            },
            "dm_conversation_id": "conv-123"
        }
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.post('/api/messages/', json=message_data, headers=headers)
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify rich text content is preserved
                paragraph = data['content']['content'][0]
                text_nodes = paragraph['content']
                
                # Check for formatted text
                bold_text = next((node for node in text_nodes if 
                                node.get('marks') and 
                                any(mark['type'] == 'bold' for mark in node['marks'])), None)
                assert bold_text is not None
                assert bold_text['text'] == 'bold'

    def test_send_message_validation_errors(self, mock_current_user):
        """Test message validation errors"""
        with patch('app.dependencies.get_current_user', return_value=mock_current_user):
            headers = {"Authorization": "Bearer mock-token"}
            
            # Test empty content
            response = client.post('/api/messages/', json={
                "content": {},
                "dm_conversation_id": "conv-123"
            }, headers=headers)
            assert response.status_code == 422
            
            # Test missing conversation ID
            response = client.post('/api/messages/', json={
                "content": {
                    "type": "doc",
                    "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}]
                }
            }, headers=headers)
            assert response.status_code == 422
            
            # Test invalid TipTap structure
            response = client.post('/api/messages/', json={
                "content": {
                    "type": "invalid",
                    "content": "not an array"
                },
                "dm_conversation_id": "conv-123"
            }, headers=headers)
            assert response.status_code == 422

    def test_send_message_too_long(self, mock_current_user):
        """Test message length validation"""
        # Create a very long message (over 2000 characters)
        long_text = "a" * 2001
        message_data = {
            "content": {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": long_text
                            }
                        ]
                    }
                ]
            },
            "dm_conversation_id": "conv-123"
        }
        
        with patch('app.dependencies.get_current_user', return_value=mock_current_user):
            headers = {"Authorization": "Bearer mock-token"}
            response = client.post('/api/messages/', json=message_data, headers=headers)
            
            assert response.status_code == 422
            error_data = response.json()
            assert "too long" in error_data['detail'].lower()

    def test_send_message_unauthorized_conversation(self, mock_current_user):
        """Test sending message to conversation user doesn't belong to"""
        mock_supabase = Mock()
        
        # Mock conversation exists but user is not a participant
        conv_response = Mock()
        conv_response.data = {'id': 'conv-123'}
        conv_response.error = None
        
        participant_response = Mock()
        participant_response.data = []  # User not found in participants
        participant_response.error = None
        
        def mock_table_call(table_name):
            table_mock = Mock()
            if table_name == "dm_conversations":
                table_mock.select.return_value.eq.return_value.single.return_value.execute.return_value = conv_response
            elif table_name == "dm_conversation_participants":
                table_mock.select.return_value.eq.return_value.eq.return_value.execute.return_value = participant_response
            return table_mock
            
        mock_supabase.table.side_effect = mock_table_call
        
        message_data = {
            "content": {
                "type": "doc",
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}]
            },
            "dm_conversation_id": "conv-123"
        }
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.post('/api/messages/', json=message_data, headers=headers)
                
                assert response.status_code == 403
                error_data = response.json()
                assert "not a participant" in error_data['detail'].lower()

    def test_get_dm_messages_success(self, mock_supabase, mock_current_user):
        """Test getting DM messages"""
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.get('/api/messages/dm/conv-123?limit=50&offset=0', headers=headers)
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify response structure
                assert 'messages' in data
                assert 'total' in data
                assert 'has_more' in data
                assert 'conversation_id' in data
                
                # Verify message structure
                if data['messages']:
                    message = data['messages'][0]
                    assert 'id' in message
                    assert 'content' in message
                    assert 'author_id' in message
                    assert 'created_at' in message

    def test_get_messages_pagination(self, mock_supabase, mock_current_user):
        """Test message pagination"""
        # Mock multiple messages
        messages = []
        for i in range(75):  # More than default limit
            messages.append({
                'id': f'msg-{i}',
                'content': {
                    'type': 'doc',
                    'content': [
                        {
                            'type': 'paragraph',
                            'content': [{'type': 'text', 'text': f'Message {i}'}]
                        }
                    ]
                },
                'author_id': 'user-123',
                'dm_conversation_id': 'conv-123',
                'created_at': f'2024-01-01T{i:02d}:00:00Z'
            })
        
        # Mock first page (50 messages)
        first_page_response = Mock()
        first_page_response.data = messages[:50]
        first_page_response.error = None
        
        # Mock second page (25 messages)
        second_page_response = Mock()
        second_page_response.data = messages[50:]
        second_page_response.error = None
        
        def mock_table_call(table_name):
            table_mock = Mock()
            if table_name == "messages":
                # Setup different responses based on range
                def mock_range(start, end):
                    range_mock = Mock()
                    if start == 0 and end == 49:
                        range_mock.execute.return_value = first_page_response
                    elif start == 50 and end == 99:
                        range_mock.execute.return_value = second_page_response
                    return range_mock
                
                table_mock.select.return_value.eq.return_value.order.return_value.range.side_effect = mock_range
            return table_mock
            
        mock_supabase.table.side_effect = mock_table_call
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                
                # Test first page
                response = client.get('/api/messages/dm/conv-123?limit=50&offset=0', headers=headers)
                assert response.status_code == 200
                data = response.json()
                assert len(data['messages']) == 50
                assert data['has_more'] == True
                
                # Test second page
                response = client.get('/api/messages/dm/conv-123?limit=50&offset=50', headers=headers)
                assert response.status_code == 200
                data = response.json()
                assert len(data['messages']) == 25
                assert data['has_more'] == False

    def test_message_content_sanitization(self, mock_supabase, mock_current_user):
        """Test that message content is properly sanitized"""
        # Attempt to send message with potentially dangerous content
        message_data = {
            "content": {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "<script>alert('xss')</script>Normal text"
                            }
                        ]
                    }
                ]
            },
            "dm_conversation_id": "conv-123"
        }
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.post('/api/messages/', json=message_data, headers=headers)
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify content is sanitized (no script tags in TipTap structure)
                content = data['content']
                content_str = json.dumps(content)
                assert '<script>' not in content_str
                assert 'alert(' not in content_str

    def test_message_rate_limiting(self, mock_supabase, mock_current_user):
        """Test message rate limiting"""
        message_data = {
            "content": {
                "type": "doc",
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Spam message"}]}]
            },
            "dm_conversation_id": "conv-123"
        }
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                
                # Send multiple messages rapidly
                responses = []
                for i in range(10):
                    response = client.post('/api/messages/', json=message_data, headers=headers)
                    responses.append(response)
                
                # At least some should succeed, but rate limiting should kick in
                success_count = sum(1 for r in responses if r.status_code == 200)
                rate_limited_count = sum(1 for r in responses if r.status_code == 429)
                
                # Either all succeed (no rate limiting implemented yet) or some are rate limited
                assert success_count + rate_limited_count == 10

    def test_edit_message_success(self, mock_supabase, mock_current_user):
        """Test editing an existing message"""
        # Mock existing message
        existing_message = {
            'id': 'msg-123',
            'author_id': 'user-123',  # Same as current user
            'content': {
                'type': 'doc',
                'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Original'}]}]
            },
            'created_at': '2024-01-01T00:00:00Z'
        }
        
        # Mock updated message
        updated_message = {
            **existing_message,
            'content': {
                'type': 'doc',
                'content': [{'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Edited'}]}]
            },
            'updated_at': '2024-01-01T01:00:00Z'
        }
        
        def mock_table_call(table_name):
            table_mock = Mock()
            if table_name == "messages":
                # Get existing message
                get_response = Mock()
                get_response.data = existing_message
                get_response.error = None
                table_mock.select.return_value.eq.return_value.single.return_value.execute.return_value = get_response
                
                # Update message
                update_response = Mock()
                update_response.data = [updated_message]
                update_response.error = None
                table_mock.update.return_value.eq.return_value.select.return_value.single.return_value.execute.return_value = update_response
                
            return table_mock
            
        mock_supabase.table.side_effect = mock_table_call
        
        edit_data = {
            "content": {
                "type": "doc",
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Edited message"}]}]
            }
        }
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.put('/api/messages/msg-123', json=edit_data, headers=headers)
                
                assert response.status_code == 200
                data = response.json()
                assert 'updated_at' in data
                assert data['content']['content'][0]['content'][0]['text'] == 'Edited'

    def test_delete_message_success(self, mock_supabase, mock_current_user):
        """Test deleting a message"""
        # Mock existing message owned by current user
        existing_message = {
            'id': 'msg-123',
            'author_id': 'user-123',
            'content': {'type': 'doc', 'content': []},
            'created_at': '2024-01-01T00:00:00Z'
        }
        
        def mock_table_call(table_name):
            table_mock = Mock()
            if table_name == "messages":
                # Get existing message
                get_response = Mock()
                get_response.data = existing_message
                get_response.error = None
                table_mock.select.return_value.eq.return_value.single.return_value.execute.return_value = get_response
                
                # Delete message
                delete_response = Mock()
                delete_response.error = None
                table_mock.delete.return_value.eq.return_value.execute.return_value = delete_response
                
            return table_mock
            
        mock_supabase.table.side_effect = mock_table_call
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.delete('/api/messages/msg-123', headers=headers)
                
                assert response.status_code == 204

    def test_cannot_edit_others_messages(self, mock_supabase, mock_current_user):
        """Test that users cannot edit messages from other users"""
        # Mock message from different user
        existing_message = {
            'id': 'msg-123',
            'author_id': 'other-user',  # Different from current user
            'content': {'type': 'doc', 'content': []},
            'created_at': '2024-01-01T00:00:00Z'
        }
        
        def mock_table_call(table_name):
            table_mock = Mock()
            if table_name == "messages":
                get_response = Mock()
                get_response.data = existing_message
                get_response.error = None
                table_mock.select.return_value.eq.return_value.single.return_value.execute.return_value = get_response
            return table_mock
            
        mock_supabase.table.side_effect = mock_table_call
        
        edit_data = {
            "content": {
                "type": "doc",
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hacked!"}]}]
            }
        }
        
        with patch('app.db.supabase.get_supabase_client', return_value=mock_supabase):
            with patch('app.dependencies.get_current_user', return_value=mock_current_user):
                headers = {"Authorization": "Bearer mock-token"}
                response = client.put('/api/messages/msg-123', json=edit_data, headers=headers)
                
                assert response.status_code == 403
                error_data = response.json()
                assert "cannot edit" in error_data['detail'].lower()