#!/usr/bin/env python3
"""
Conversation service for managing DM conversations
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.db.supabase import get_supabase_client
from app.models.conversation import ConversationCreate, ConversationResponse, ConversationListResponse
from app.models.user import User
from app.utils.exceptions import ValidationError, NotFoundError, PermissionError
from app.services.friend import FriendService


class ConversationService:
    """Service for managing DM conversations"""

    def __init__(self):
        self.supabase = get_supabase_client()

    async def create_or_find_conversation(self, current_user_id: str, participant_username: str) -> ConversationResponse:
        """Create a new conversation or find existing one between current user and another user"""
        
        # Find the participant by username
        participant_response = (
            self.supabase.table("user_profiles")
            .select("*")
            .eq("username", participant_username.lower())
            .single()
            .execute()
        )

        if participant_response.error or not participant_response.data:
            raise NotFoundError(f"User '{participant_username}' not found")

        participant = User(**participant_response.data)
        
        # Check if users are friends
        if not await self._are_users_friends(current_user_id, participant.id):
            raise PermissionError("You can only start conversations with friends")

        # Use the database function to create or find conversation
        conversation_response = (
            self.supabase.rpc("create_dm_conversation", {
                "user1_id": current_user_id,
                "user2_id": participant.id
            })
            .execute()
        )

        if conversation_response.error:
            raise Exception(f"Failed to create conversation: {conversation_response.error}")

        conversation_id = conversation_response.data

        # Get the full conversation data
        return await self.get_conversation(current_user_id, conversation_id)

    async def get_conversation(self, user_id: str, conversation_id: str) -> ConversationResponse:
        """Get a specific conversation with metadata"""
        
        # Validate access
        await self._validate_conversation_access(conversation_id, user_id)

        # Get conversation data
        conv_response = (
            self.supabase.table("dm_conversations")
            .select("*")
            .eq("id", conversation_id)
            .single()
            .execute()
        )

        if conv_response.error or not conv_response.data:
            raise NotFoundError("Conversation not found")

        # Get participants
        participants_response = (
            self.supabase.table("dm_conversation_participants")
            .select("user_profiles(*)")
            .eq("conversation_id", conversation_id)
            .execute()
        )

        if participants_response.error:
            raise Exception(f"Failed to get participants: {participants_response.error}")

        participants = [User(**p["user_profiles"]) for p in participants_response.data]

        # Get last message
        last_message_response = (
            self.supabase.table("messages")
            .select("*")
            .eq("dm_conversation_id", conversation_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        last_message = None
        last_message_at = None
        if last_message_response.data and len(last_message_response.data) > 0:
            last_message = last_message_response.data[0]
            last_message_at = datetime.fromisoformat(last_message["created_at"])

        # TODO: Calculate unread count (would need to track read status)
        unread_count = 0

        return ConversationResponse(
            id=conv_response.data["id"],
            created_at=datetime.fromisoformat(conv_response.data["created_at"]),
            updated_at=datetime.fromisoformat(conv_response.data["updated_at"]) if conv_response.data.get("updated_at") else None,
            participants=participants,
            last_message=last_message,
            last_message_at=last_message_at,
            unread_count=unread_count
        )

    async def get_user_conversations(self, user_id: str) -> ConversationListResponse:
        """Get all conversations for a user"""
        
        # Get user's conversations
        conversations_response = (
            self.supabase.table("dm_conversation_participants")
            .select("conversation_id")
            .eq("user_id", user_id)
            .execute()
        )

        if conversations_response.error:
            raise Exception(f"Failed to get conversations: {conversations_response.error}")

        conversation_ids = [c["conversation_id"] for c in conversations_response.data]

        if not conversation_ids:
            return ConversationListResponse(conversations=[], total=0)

        # Get full conversation data for each
        conversations = []
        for conv_id in conversation_ids:
            try:
                conversation = await self.get_conversation(user_id, conv_id)
                conversations.append(conversation)
            except Exception as e:
                # Skip conversations that error (might be deleted or inaccessible)
                print(f"Warning: Could not load conversation {conv_id}: {e}")
                continue

        # Sort by last message time, most recent first
        conversations.sort(key=lambda c: c.last_message_at or c.created_at, reverse=True)

        return ConversationListResponse(
            conversations=conversations,
            total=len(conversations)
        )

    async def delete_conversation(self, conversation_id: str, user_id: str) -> None:
        """Delete a conversation (only if user is a participant)"""
        
        # Validate access
        await self._validate_conversation_access(conversation_id, user_id)

        # Delete conversation (cascade will handle participants and messages)
        delete_response = (
            self.supabase.table("dm_conversations")
            .delete()
            .eq("id", conversation_id)
            .execute()
        )

        if delete_response.error:
            raise Exception(f"Failed to delete conversation: {delete_response.error}")

    async def _validate_conversation_access(self, conversation_id: str, user_id: str) -> None:
        """Validate that user has access to the conversation"""
        
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

    async def _are_users_friends(self, user1_id: str, user2_id: str) -> bool:
        """Check if two users are friends"""
        try:
            return await FriendService.are_friends(user1_id, user2_id, self.supabase)
        except Exception:
            return False