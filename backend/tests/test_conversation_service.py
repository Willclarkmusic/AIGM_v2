#!/usr/bin/env python3
"""Test conversation service directly"""

import os
import sys
import asyncio

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def test_conversation_service():
    try:
        from app.services.conversation import ConversationService
        from app.dependencies import get_current_user
        
        # Get mock user
        mock_user = await get_current_user("test-token")
        print(f"Mock user: {mock_user.username} ({mock_user.id})")
        
        # Test conversation service
        conv_service = ConversationService()
        
        print("Testing get_user_conversations...")
        conversations = await conv_service.get_user_conversations(mock_user.id)
        print(f"SUCCESS: Found {conversations.total} conversations")
        
        for conv in conversations.conversations:
            print(f"  - Conversation {conv.id} with {len(conv.participants)} participants")
            
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_conversation_service())