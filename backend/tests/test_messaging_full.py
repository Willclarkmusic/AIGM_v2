#!/usr/bin/env python3
"""Test complete messaging system"""

import os
import sys
import json

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_complete_messaging_flow():
    try:
        print("Testing complete messaging flow...")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test with comprehensive rich text message
        rich_message = {
            "content": {
                "type": "doc",
                "content": [
                    {
                        "type": "heading",
                        "attrs": {"level": 1},
                        "content": [
                            {"type": "text", "text": "Enhanced Messaging Test"}
                        ]
                    },
                    {
                        "type": "paragraph",
                        "content": [
                            {"type": "text", "text": "Hello "},
                            {"type": "text", "text": "Bob", "marks": [{"type": "bold"}]},
                            {"type": "text", "text": "! This message includes:"}
                        ]
                    },
                    {
                        "type": "bulletList",
                        "content": [
                            {
                                "type": "listItem",
                                "content": [
                                    {
                                        "type": "paragraph",
                                        "content": [
                                            {"type": "text", "text": "Bold", "marks": [{"type": "bold"}]},
                                            {"type": "text", "text": " and "},
                                            {"type": "text", "text": "italic", "marks": [{"type": "italic"}]},
                                            {"type": "text", "text": " text"}
                                        ]
                                    }
                                ]
                            },
                            {
                                "type": "listItem",
                                "content": [
                                    {
                                        "type": "paragraph",
                                        "content": [
                                            {"type": "text", "text": "Some "},
                                            {"type": "text", "text": "code", "marks": [{"type": "code"}]},
                                            {"type": "text", "text": " formatting"}
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        "type": "blockquote",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {"type": "text", "text": "This is a quote block!"}
                                ]
                            }
                        ]
                    }
                ]
            }
        }
        
        # Alice-Bob conversation ID
        conversation_id = "16fe6ad7-2755-4997-b219-e4f20b35f7ac"
        
        print(f"1. Sending rich text message to conversation {conversation_id}...")
        response = client.post(
            f"/api/messages/conversations/{conversation_id}",
            json=rich_message,
            headers={"Authorization": "Bearer test-token"}
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            json_data = response.json()
            print(f"   SUCCESS: Message sent!")
            print(f"   Message ID: {json_data.get('id', 'N/A')}")
            message_id = json_data.get('id')
            
            # Test message retrieval
            print(f"\n2. Retrieving messages from conversation...")
            get_response = client.get(
                f"/api/messages/dm/{conversation_id}",
                headers={"Authorization": "Bearer test-token"}
            )
            
            if get_response.status_code == 200:
                messages_data = get_response.json()
                print(f"   SUCCESS: Retrieved {len(messages_data.get('messages', []))} messages")
                
                # Find our new message
                found = False
                for msg in messages_data.get('messages', []):
                    if msg.get('id') == message_id:
                        print(f"   Found our message in the list!")
                        print(f"   Content type: {msg.get('content', {}).get('type', 'N/A')}")
                        print(f"   Has rich content: {len(msg.get('content', {}).get('content', [])) > 0}")
                        found = True
                        break
                
                if not found:
                    print(f"   ERROR: Our message was not found in the list")
                else:
                    print(f"\n3. All tests passed! Enhanced messaging system is working.")
            else:
                print(f"   ERROR retrieving messages: {get_response.status_code}")
                
        else:
            print(f"   ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error details: {error_data}")
            except:
                print("   Could not parse error response")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_complete_messaging_flow()