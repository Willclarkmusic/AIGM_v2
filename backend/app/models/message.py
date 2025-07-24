#!/usr/bin/env python3
"""
Message models for TipTap rich text messaging
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID

class TipTapContent(BaseModel):
    """TipTap document structure validation"""
    type: str = Field(..., description="Node type (e.g., 'doc', 'paragraph', 'text')")
    content: Optional[List[Dict[str, Any]]] = Field(None, description="Child nodes")
    text: Optional[str] = Field(None, description="Text content for text nodes")
    marks: Optional[List[Dict[str, str]]] = Field(None, description="Text formatting marks")
    attrs: Optional[Dict[str, Any]] = Field(None, description="Node attributes")

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        allowed_types = ['doc', 'paragraph', 'text', 'heading', 'bold', 'italic', 'code']
        if v not in allowed_types:
            raise ValueError(f'Invalid node type: {v}')
        return v

class MessageCreate(BaseModel):
    """Model for creating a new message"""
    content: Dict[str, Any] = Field(..., description="TipTap JSON content")
    dm_conversation_id: Optional[str] = Field(None, description="DM conversation ID")
    room_id: Optional[str] = Field(None, description="Room ID for server messages")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Content must be a JSON object')
        
        if v.get('type') != 'doc':
            raise ValueError('Content must be a TipTap document with type "doc"')
        
        if not isinstance(v.get('content'), list):
            raise ValueError('Document content must be an array')
        
        # Validate message length by extracting text
        text_length = cls._extract_text_length(v)
        if text_length > 2000:
            raise ValueError('Message too long (max 2000 characters)')
        
        if text_length == 0:
            raise ValueError('Message cannot be empty')
        
        return v
    
    @classmethod
    def _extract_text_length(cls, content: Dict[str, Any]) -> int:
        """Extract total text length from TipTap content"""
        def extract_text_recursive(node: Dict[str, Any]) -> str:
            text = ""
            if node.get('type') == 'text':
                text += node.get('text', '')
            elif 'content' in node and isinstance(node['content'], list):
                for child in node['content']:
                    text += extract_text_recursive(child)
            return text
        
        return len(extract_text_recursive(content))

    @field_validator('dm_conversation_id', 'room_id')
    @classmethod
    def validate_destination(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Destination ID cannot be empty')
        return v

    def model_post_init(self, __context):
        """Ensure exactly one destination is specified"""
        if not self.dm_conversation_id and not self.room_id:
            raise ValueError('Either dm_conversation_id or room_id must be specified')
        if self.dm_conversation_id and self.room_id:
            raise ValueError('Cannot specify both dm_conversation_id and room_id')

class MessageEdit(BaseModel):
    """Model for editing an existing message"""
    content: Dict[str, Any] = Field(..., description="Updated TipTap JSON content")

    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not isinstance(v, dict):
            raise ValueError('Content must be a JSON object')
        
        if v.get('type') != 'doc':
            raise ValueError('Content must be a TipTap document with type "doc"')
        
        if not isinstance(v.get('content'), list):
            raise ValueError('Document content must be an array')
        
        # Validate message length
        text_length = MessageCreate._extract_text_length(v)
        if text_length > 2000:
            raise ValueError('Message too long (max 2000 characters)')
        
        if text_length == 0:
            raise ValueError('Message cannot be empty')
        
        return v

class MessageResponse(BaseModel):
    """Model for message API responses"""
    id: str = Field(..., description="Message ID")
    content: Dict[str, Any] = Field(..., description="TipTap JSON content")
    author_id: str = Field(..., description="Author user ID")
    dm_conversation_id: Optional[str] = Field(None, description="DM conversation ID")
    room_id: Optional[str] = Field(None, description="Room ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")

    class Config:
        from_attributes = True

class MessageListResponse(BaseModel):
    """Model for paginated message list responses"""
    messages: List[MessageResponse] = Field(..., description="List of messages")
    total: int = Field(..., description="Total message count")
    has_more: bool = Field(..., description="Whether more messages are available")
    conversation_id: str = Field(..., description="Conversation or room ID")

    class Config:
        from_attributes = True