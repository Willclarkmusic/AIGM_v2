#!/usr/bin/env python3
"""
Message service for handling TipTap rich text messages
"""

import json
from typing import Optional, List, Dict, Any
from uuid import UUID, uuid4
from datetime import datetime, timezone

from app.db.supabase import get_supabase_client
from app.models.message import MessageCreate, MessageResponse, MessageListResponse, MessageEdit
from app.utils.exceptions import ValidationError, NotFoundError, PermissionError


class MessageService:
    """Service for managing messages with TipTap rich text content"""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def send_message(self, message_data: MessageCreate, author_id: str) -> MessageResponse:
        """Send a new message to a DM conversation or room"""
        
        # Validate destination and user permissions
        if message_data.dm_conversation_id:
            await self._validate_dm_conversation_access(message_data.dm_conversation_id, author_id)
        elif message_data.room_id:
            await self._validate_room_access(message_data.room_id, author_id)
        else:
            raise ValidationError("Either dm_conversation_id or room_id must be specified")

        # Sanitize content to prevent XSS
        sanitized_content = self._sanitize_content(message_data.content)

        # Insert message into database
        message_record = {
            'id': str(uuid4()),
            'content': sanitized_content,
            'author_id': author_id,
            'dm_conversation_id': message_data.dm_conversation_id,
            'room_id': message_data.room_id,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'updated_at': datetime.now(timezone.utc).isoformat()
        }

        response = (
            self.supabase.table("messages")
            .insert(message_record)
            .select("*")
            .single()
            .execute()
        )

        if response.error:
            raise Exception(f"Failed to send message: {response.error}")

        return MessageResponse(**response.data)

    async def get_dm_messages(
        self, 
        conversation_id: str, 
        user_id: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> MessageListResponse:
        """Get messages from a DM conversation with pagination"""
        
        # Validate user has access to this conversation
        await self._validate_dm_conversation_access(conversation_id, user_id)

        # Get messages with pagination
        response = (
            self.supabase.table("messages")
            .select("*")
            .eq("dm_conversation_id", conversation_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        if response.error:
            raise Exception(f"Failed to retrieve messages: {response.error}")

        messages = [MessageResponse(**msg) for msg in response.data]
        
        # Check if there are more messages
        has_more = len(messages) == limit
        
        return MessageListResponse(
            messages=messages,
            total=len(messages),  # Note: This is just current page count
            has_more=has_more,
            conversation_id=conversation_id
        )

    async def get_room_messages(
        self, 
        room_id: str, 
        user_id: str, 
        limit: int = 50, 
        offset: int = 0
    ) -> MessageListResponse:
        """Get messages from a room with pagination"""
        
        # Validate user has access to this room
        await self._validate_room_access(room_id, user_id)

        # Get messages with pagination
        response = (
            self.supabase.table("messages")
            .select("*")
            .eq("room_id", room_id)
            .order("created_at", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        if response.error:
            raise Exception(f"Failed to retrieve messages: {response.error}")

        messages = [MessageResponse(**msg) for msg in response.data]
        
        # Check if there are more messages
        has_more = len(messages) == limit
        
        return MessageListResponse(
            messages=messages,
            total=len(messages),  # Note: This is just current page count
            has_more=has_more,
            conversation_id=room_id
        )

    async def edit_message(self, message_id: str, edit_data: MessageEdit, user_id: str) -> MessageResponse:
        """Edit an existing message (only by author)"""
        
        # Get existing message
        existing_response = (
            self.supabase.table("messages")
            .select("*")
            .eq("id", message_id)
            .single()
            .execute()
        )

        if existing_response.error or not existing_response.data:
            raise NotFoundError("Message not found")

        existing_message = existing_response.data

        # Check if user is the author
        if existing_message['author_id'] != user_id:
            raise PermissionError("You can only edit your own messages")

        # Sanitize new content
        sanitized_content = self._sanitize_content(edit_data.content)

        # Update message
        update_response = (
            self.supabase.table("messages")
            .update({
                'content': sanitized_content,
                'updated_at': datetime.now(timezone.utc).isoformat()
            })
            .eq("id", message_id)
            .select("*")
            .single()
            .execute()
        )

        if update_response.error:
            raise Exception(f"Failed to edit message: {update_response.error}")

        return MessageResponse(**update_response.data)

    async def delete_message(self, message_id: str, user_id: str) -> None:
        """Delete a message (only by author)"""
        
        # Get existing message
        existing_response = (
            self.supabase.table("messages")
            .select("*")
            .eq("id", message_id)
            .single()
            .execute()
        )

        if existing_response.error or not existing_response.data:
            raise NotFoundError("Message not found")

        existing_message = existing_response.data

        # Check if user is the author
        if existing_message['author_id'] != user_id:
            raise PermissionError("You can only delete your own messages")

        # Delete message
        delete_response = (
            self.supabase.table("messages")
            .delete()
            .eq("id", message_id)
            .execute()
        )

        if delete_response.error:
            raise Exception(f"Failed to delete message: {delete_response.error}")

    async def _validate_dm_conversation_access(self, conversation_id: str, user_id: str) -> None:
        """Validate that user has access to the DM conversation"""
        
        # Check if conversation exists
        conv_response = (
            self.supabase.table("dm_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )

        if conv_response.error or not conv_response.data:
            raise NotFoundError("Conversation not found")

        # Check if user is a participant
        participant_response = (
            self.supabase.table("dm_conversation_participants")
            .select("*")
            .eq("conversation_id", conversation_id)
            .eq("user_id", user_id)
            .execute()
        )

        if participant_response.error or not participant_response.data:
            raise PermissionError("You are not a participant in this conversation")

    async def _validate_room_access(self, room_id: str, user_id: str) -> None:
        """Validate that user has access to the room"""
        
        # Check if user is a member of the server that owns this room
        room_response = (
            self.supabase.table("rooms")
            .select("server_id")
            .eq("id", room_id)
            .single()
            .execute()
        )

        if room_response.error or not room_response.data:
            raise NotFoundError("Room not found")

        server_id = room_response.data['server_id']

        # Check server membership
        member_response = (
            self.supabase.table("server_members")
            .select("*")
            .eq("server_id", server_id)
            .eq("user_id", user_id)
            .single()
            .execute()
        )

        if member_response.error or not member_response.data:
            raise PermissionError("You are not a member of this server")

    def _sanitize_content(self, content: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize TipTap content to prevent XSS attacks"""
        
        def sanitize_node(node: Dict[str, Any]) -> Dict[str, Any]:
            sanitized = {}
            
            # Only allow safe node types
            if 'type' in node:
                allowed_types = ['doc', 'paragraph', 'text', 'heading', 'bold', 'italic', 'code']
                if node['type'] in allowed_types:
                    sanitized['type'] = node['type']
            
            # Sanitize text content
            if 'text' in node and isinstance(node['text'], str):
                # Remove any HTML tags and dangerous content
                text = node['text']
                text = text.replace('<script>', '').replace('</script>', '')
                text = text.replace('<iframe>', '').replace('</iframe>', '')
                text = text.replace('javascript:', '')
                sanitized['text'] = text
            
            # Sanitize marks (formatting)
            if 'marks' in node and isinstance(node['marks'], list):
                sanitized_marks = []
                for mark in node['marks']:
                    if isinstance(mark, dict) and 'type' in mark:
                        allowed_marks = ['bold', 'italic', 'code']
                        if mark['type'] in allowed_marks:
                            sanitized_marks.append({'type': mark['type']})
                if sanitized_marks:
                    sanitized['marks'] = sanitized_marks
            
            # Recursively sanitize child content
            if 'content' in node and isinstance(node['content'], list):
                sanitized['content'] = [sanitize_node(child) for child in node['content']]
            
            return sanitized
        
        return sanitize_node(content)