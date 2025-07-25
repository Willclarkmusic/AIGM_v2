#!/usr/bin/env python3
"""Simple test for enhanced messaging system"""

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
        
        # Test simple rich text message
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
                            {"type": "text", "text": " formatting!"}
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
            
        else:
            print(f"ERROR: {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error details: {error_data}")
            except:
                print("Could not parse error response")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    test_dm_message_sending()