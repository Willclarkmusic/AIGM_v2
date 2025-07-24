#!/usr/bin/env python3
"""
Conversation models for DM conversations
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.models.user import User


class ConversationParticipant(BaseModel):
    """Conversation participant model"""
    id: str
    conversation_id: str
    user_id: str
    joined_at: datetime


class ConversationCreate(BaseModel):
    """Request model for creating a new conversation"""
    participant_username: str = Field(..., description="Username of the other participant")


class ConversationResponse(BaseModel):
    """Response model for conversation data"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    participants: List[User]
    last_message: Optional[dict] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0


class ConversationListResponse(BaseModel):
    """Response model for conversation list"""
    conversations: List[ConversationResponse]
    total: int


class ConversationMetadata(BaseModel):
    """Metadata about a conversation"""
    id: str
    participant_count: int
    created_at: datetime
    last_activity: Optional[datetime] = None