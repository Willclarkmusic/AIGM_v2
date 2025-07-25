#!/usr/bin/env python3
"""Debug conversation service error"""

import os
import sys
import asyncio

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def debug_conversation_error():
    try:
        print("Testing conversation service imports...")
        
        # Test imports
        from app.services.conversation import ConversationService
        print("SUCCESS: ConversationService imported")
        
        from app.dependencies import get_current_user
        print("SUCCESS: get_current_user imported")
        
        # Test getting current user
        print("\nTesting get_current_user...")
        mock_user = await get_current_user("test-token")
        print(f"SUCCESS: Mock user: {mock_user.username} ({mock_user.id})")
        
        # Test conversation service
        print("\nTesting ConversationService initialization...")
        conv_service = ConversationService()
        print("SUCCESS: ConversationService initialized")
        
        # Test getting conversations - this is where it likely fails
        print(f"\nTesting get_user_conversations for user {mock_user.id}...")
        conversations = await conv_service.get_user_conversations(mock_user.id)
        print(f"SUCCESS: Found {conversations.total} conversations")
        
        for conv in conversations.conversations:
            print(f"  - Conversation {conv.id}")
            
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_conversation_error())