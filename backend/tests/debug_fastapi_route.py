#!/usr/bin/env python3
"""Debug FastAPI route directly"""

import os
import sys
import asyncio

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def debug_fastapi_route():
    try:
        print("Testing FastAPI route components...")
        
        # Import everything the route uses
        from app.dependencies import get_current_user
        from app.services.conversation import ConversationService
        from app.models.conversation import ConversationListResponse
        
        print("SUCCESS: All imports loaded")
        
        # Simulate the exact route call
        print("\nSimulating route call...")
        
        # Get current user (like the route does)
        current_user = await get_current_user("test-token")
        print(f"Current user: {current_user.username}")
        
        # Create conversation service (like the route does)
        conversation_service = ConversationService()
        print("Conversation service created")
        
        # Call get_user_conversations (like the route does)
        result = await conversation_service.get_user_conversations(current_user.id)
        print(f"Service call successful: {type(result)}")
        print(f"Result type check - is ConversationListResponse: {isinstance(result, ConversationListResponse)}")
        
        # Try to serialize to dict (FastAPI does this)
        result_dict = result.model_dump()
        print(f"Serialization successful: {len(result_dict)} keys")
        print(f"Keys: {list(result_dict.keys())}")
        
        # Check each conversation
        for i, conv in enumerate(result.conversations):
            print(f"\nConversation {i}:")
            print(f"  ID: {conv.id}")
            print(f"  Type: {type(conv)}")
            print(f"  Participants: {len(conv.participants)}")
            
            # Try to serialize this conversation
            try:
                conv_dict = conv.model_dump()
                print(f"  Serialization: SUCCESS ({len(conv_dict)} keys)")
            except Exception as conv_error:
                print(f"  Serialization: FAILED - {conv_error}")
                
                # Check each field
                for field_name in ['id', 'created_at', 'updated_at', 'participants', 'last_message', 'last_message_at', 'unread_count']:
                    try:
                        field_value = getattr(conv, field_name)
                        print(f"    {field_name}: {type(field_value)} = {field_value}")
                    except Exception as field_error:
                        print(f"    {field_name}: ERROR - {field_error}")
        
        print("\nRoute simulation completed successfully!")
        
    except Exception as e:
        print(f"\nERROR in route simulation: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_fastapi_route())