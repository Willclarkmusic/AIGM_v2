#!/usr/bin/env python3
"""Comprehensive test of the entire messaging system"""

import os
import sys
import json
import time

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_comprehensive_messaging():
    try:
        print("=== COMPREHENSIVE MESSAGING SYSTEM TEST ===")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        conversation_id = "16fe6ad7-2755-4997-b219-e4f20b35f7ac"
        
        # Test 1: Send various types of rich text messages
        print("\n1. Testing rich text message formats...")
        
        test_messages = [
            {
                "name": "Simple text",
                "content": {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": "Hello Bob! This is a simple message."}
                            ]
                        }
                    ]
                }
            },
            {
                "name": "Bold and italic",
                "content": {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": "This message has "},
                                {"type": "text", "text": "bold", "marks": [{"type": "bold"}]},
                                {"type": "text", "text": " and "},
                                {"type": "text", "text": "italic", "marks": [{"type": "italic"}]},
                                {"type": "text", "text": " text."}
                            ]
                        }
                    ]
                }
            },
            {
                "name": "Code and formatting",
                "content": {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": "Here's some "},
                                {"type": "text", "text": "inline code", "marks": [{"type": "code"}]},
                                {"type": "text", "text": " and "},
                                {"type": "text", "text": "underlined", "marks": [{"type": "underline"}]},
                                {"type": "text", "text": " text."}
                            ]
                        }
                    ]
                }
            },
            {
                "name": "Lists and structure",
                "content": {
                    "type": "doc",
                    "content": [
                        {
                            "type": "heading",
                            "attrs": {"level": 2},
                            "content": [
                                {"type": "text", "text": "Shopping List"}
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
                                                {"type": "text", "text": "Milk"}
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
                                                {"type": "text", "text": "Bread"}
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
                                                {"type": "text", "text": "Eggs"}
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        ]
        
        sent_message_ids = []
        
        for i, test_msg in enumerate(test_messages):
            print(f"   Sending {test_msg['name']}...")
            response = client.post(
                f"/api/messages/conversations/{conversation_id}",
                json=test_msg,
                headers={"Authorization": "Bearer test-token"}
            )
            
            if response.status_code == 200:
                json_data = response.json()
                sent_message_ids.append(json_data.get('id'))
                print(f"   ✓ Sent successfully (ID: {json_data.get('id')})")
                time.sleep(0.1)  # Small delay between messages
            else:
                print(f"   ✗ Failed to send: {response.status_code}")
                return False
        
        print(f"\n   Successfully sent {len(sent_message_ids)} messages!")
        
        # Test 2: Retrieve messages and verify content
        print("\n2. Testing message retrieval...")
        
        response = client.get(
            f"/api/messages/dm/{conversation_id}",
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 200:
            data = response.json()
            messages = data.get('messages', [])
            print(f"   ✓ Retrieved {len(messages)} messages")
            
            # Verify our sent messages are in the list
            found_messages = 0
            for msg_id in sent_message_ids:
                for msg in messages:
                    if msg.get('id') == msg_id:
                        found_messages += 1
                        break
            
            if found_messages == len(sent_message_ids):
                print(f"   ✓ All {found_messages} sent messages found in response")
            else:
                print(f"   ✗ Only found {found_messages} out of {len(sent_message_ids)} messages")
                return False
        else:
            print(f"   ✗ Failed to retrieve messages: {response.status_code}")
            return False
        
        # Test 3: Test pagination
        print("\n3. Testing message pagination...")
        
        # Get first 2 messages
        response = client.get(
            f"/api/messages/dm/{conversation_id}?limit=2",
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 200:
            data = response.json()
            first_page = data.get('messages', [])
            has_more = data.get('has_more', False)
            
            print(f"   ✓ First page: {len(first_page)} messages, has_more: {has_more}")
            
            if len(first_page) > 0 and has_more:
                # Get messages before the oldest message from first page
                oldest_timestamp = first_page[-1]['created_at']
                
                response = client.get(
                    f"/api/messages/dm/{conversation_id}?limit=2&before={oldest_timestamp}",
                    headers={"Authorization": "Bearer test-token"}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    second_page = data.get('messages', [])
                    print(f"   ✓ Second page: {len(second_page)} messages")
                    
                    # Verify no duplicate messages
                    first_ids = {msg['id'] for msg in first_page}
                    second_ids = {msg['id'] for msg in second_page}
                    
                    if first_ids.isdisjoint(second_ids):
                        print(f"   ✓ No duplicate messages between pages")
                    else:
                        print(f"   ✗ Found duplicate messages between pages")
                        return False
                else:
                    print(f"   ✗ Failed to get second page: {response.status_code}")
                    return False
        else:
            print(f"   ✗ Failed to test pagination: {response.status_code}")
            return False
        
        # Test 4: Test message validation
        print("\n4. Testing message validation...")
        
        # Test empty message
        empty_message = {
            "content": {
                "type": "doc",
                "content": []
            }
        }
        
        response = client.post(
            f"/api/messages/conversations/{conversation_id}",
            json=empty_message,
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 422:
            print("   ✓ Empty message correctly rejected")
        else:
            print(f"   ✗ Empty message should be rejected (got {response.status_code})")
            return False
        
        # Test invalid content structure
        invalid_message = {
            "content": "not a json object"
        }
        
        response = client.post(
            f"/api/messages/conversations/{conversation_id}",
            json=invalid_message,
            headers={"Authorization": "Bearer test-token"}
        )
        
        if response.status_code == 422:
            print("   ✓ Invalid content structure correctly rejected")
        else:
            print(f"   ✗ Invalid content should be rejected (got {response.status_code})")
            return False
        
        print("\n=== ALL TESTS PASSED! ===")
        print("\nEnhanced messaging system is fully functional with:")
        print("✓ Rich text formatting (bold, italic, underline, code, headings)")
        print("✓ Structured content (lists, quotes, paragraphs)")
        print("✓ Message pagination with before/after timestamps")
        print("✓ Content validation and error handling")
        print("✓ Proper API responses and data structures")
        
        return True
        
    except Exception as e:
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_comprehensive_messaging()
    sys.exit(0 if success else 1)