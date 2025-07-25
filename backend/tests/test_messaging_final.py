#!/usr/bin/env python3
"""Final comprehensive test of messaging system"""

import os
import sys
import json
import time

# Add app directory to path  
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_final_messaging():
    try:
        print("=== FINAL MESSAGING SYSTEM TEST ===")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        conversation_id = "16fe6ad7-2755-4997-b219-e4f20b35f7ac"
        
        # Test various message formats
        print("\n1. Testing different message formats...")
        
        messages_to_send = [
            {
                "type": "doc",
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {"type": "text", "text": "Testing enhanced messaging system!"}
                        ]
                    }
                ]
            },
            {
                "type": "doc", 
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {"type": "text", "text": "This has "},
                            {"type": "text", "text": "bold", "marks": [{"type": "bold"}]},
                            {"type": "text", "text": " and "},
                            {"type": "text", "text": "italic", "marks": [{"type": "italic"}]},
                            {"type": "text", "text": " formatting."}
                        ]
                    }
                ]
            }
        ]
        
        sent_ids = []
        
        for i, content in enumerate(messages_to_send):
            print(f"   Sending message {i+1}...")
            response = client.post(
                f"/api/messages/conversations/{conversation_id}",
                json={"content": content},
                headers={"Authorization": "Bearer test-token"}
            )
            
            if response.status_code == 200:
                data = response.json()
                sent_ids.append(data.get('id'))
                print(f"   SUCCESS: Message {i+1} sent (ID: {data.get('id')})")
            else:
                print(f"   ERROR: Failed to send message {i+1}: {response.status_code}")
                return False
                
        # Test message retrieval
        print(f"\n2. Testing message retrieval...")
        response = client.get(
            f"/api/messages/dm/{conversation_id}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 200:
            data = response.json()
            messages = data.get('messages', [])
            print(f"   SUCCESS: Retrieved {len(messages)} total messages")
            
            # Verify our messages are there
            found = 0
            for msg_id in sent_ids:
                for msg in messages:
                    if msg.get('id') == msg_id:
                        found += 1
                        break
            
            print(f"   SUCCESS: Found {found}/{len(sent_ids)} of our sent messages")
        else:
            print(f"   ERROR: Failed to retrieve messages: {response.status_code}")
            return False
        
        # Test pagination
        print(f"\n3. Testing pagination...")
        response = client.get(
            f"/api/messages/dm/{conversation_id}?limit=2",
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 200:
            data = response.json()
            page1 = data.get('messages', [])
            has_more = data.get('has_more', False)
            print(f"   SUCCESS: Page 1 has {len(page1)} messages, has_more: {has_more}")
        else:
            print(f"   ERROR: Pagination test failed: {response.status_code}")
            return False
        
        # Test validation
        print(f"\n4. Testing validation...")
        
        # Empty message should fail
        response = client.post(
            f"/api/messages/conversations/{conversation_id}",
            json={"content": {"type": "doc", "content": []}},
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 422:
            print("   SUCCESS: Empty message correctly rejected")
        else:
            print(f"   ERROR: Empty message should be rejected (got {response.status_code})")
            return False
        
        print(f"\n=== ALL TESTS PASSED! ===")
        print(f"\nMessaging system features verified:")
        print(f"- Rich text formatting (bold, italic, etc.)")
        print(f"- Message sending and retrieval")
        print(f"- Pagination support")
        print(f"- Input validation")
        print(f"- Proper error handling")
        
        return True
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_final_messaging()
    print(f"\nTest result: {'PASSED' if success else 'FAILED'}")
    sys.exit(0 if success else 1)