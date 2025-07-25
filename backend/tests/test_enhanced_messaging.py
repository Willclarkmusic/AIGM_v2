#!/usr/bin/env python3
"""Test enhanced messaging system with rich text"""

import os
import sys
import json

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_dm_message_sending():
    try:
        print("Testing DM message sending...")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test rich text message with formatting
        rich_message = {
            "content": {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {"type": "text", "text": "Hello "},
                            {"type": "text", "text": "Bob", "marks": [{"type": "bold"}]},
                            {"type": "text", "text": "! This is a "},
                            {"type": "text", "text": "rich text", "marks": [{"type": "italic"}]},
                            {"type": "text", "text": " message with "},
                            {"type": "text", "text": "code", "marks": [{"type": "code"}]},
                            {"type": "text", "text": " formatting! 🎉"}
                        ]
                    }
                ]
            }
        }
        
        # Alice-Bob conversation ID from previous tests
        conversation_id = "16fe6ad7-2755-4997-b219-e4f20b35f7ac"
        
        print(f"Sending message to conversation {conversation_id}...")
        response = client.post(
            f"/api/messages/conversations/{conversation_id}",
            json=rich_message,
            headers={"Authorization": "Bearer test-token"}
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            json_data = response.json()
            print("SUCCESS: Message sent!")
            print(f"Message ID: {json_data.get('id', 'N/A')}")
            print(f"Author: {json_data.get('author_id', 'N/A')}")
            print(f"Content preview: {str(json_data.get('content', {}))[:100]}...")
            
            # Now test retrieving messages
            print("\nTesting message retrieval...")
            get_response = client.get(
                f"/api/messages/dm/{conversation_id}",
                headers={"Authorization": "Bearer test-token"}
            )
            
            if get_response.status_code == 200:
                messages_data = get_response.json()
                print(f"Retrieved {len(messages_data.get('messages', []))} messages")
                
                # Find our new message
                for msg in messages_data.get('messages', []):
                    if msg.get('id') == json_data.get('id'):
                        print("✅ Found our new message in the list!")
                        break
                else:
                    print("❌ Our message was not found in the list")
            else:
                print(f"Error retrieving messages: {get_response.status_code}")
                print(get_response.text)
                
        else:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


def test_invalid_messages():
    try:
        print("\nTesting invalid message validation...")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        conversation_id = "16fe6ad7-2755-4997-b219-e4f20b35f7ac"
        
        # Test empty message
        empty_message = {
            "content": {
                "type": "doc",
                "content": []
            }
        }
        
        print("Testing empty message...")
        response = client.post(
            f"/api/messages/conversations/{conversation_id}",
            json=empty_message,
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 422:
            print("✅ Empty message correctly rejected")
        else:
            print(f"❌ Empty message should be rejected (got {response.status_code})")
        
        # Test invalid content structure
        invalid_message = {
            "content": "just a string"
        }
        
        print("Testing invalid content structure...")
        response = client.post(
            f"/api/messages/conversations/{conversation_id}",
            json=invalid_message,
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 422:
            print("✅ Invalid content structure correctly rejected")
        else:
            print(f"❌ Invalid content should be rejected (got {response.status_code})")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_dm_message_sending()
    test_invalid_messages()