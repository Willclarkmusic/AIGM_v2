#!/usr/bin/env python3
"""Test messages API endpoint"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_messages_api():
    try:
        print("Testing messages API endpoint...")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test with Alice-Bob conversation ID (from previous tests)
        conversation_id = "16fe6ad7-2755-4997-b219-e4f20b35f7ac"
        
        print(f"Testing GET /api/messages/dm/{conversation_id}...")
        response = client.get(f"/api/messages/dm/{conversation_id}", 
                            headers={"Authorization": "Bearer test-token"})
        
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                print("SUCCESS: Messages API working!")
                print(f"Messages count: {len(json_data.get('messages', []))}")
                print(f"Has more: {json_data.get('has_more', False)}")
                print(f"Total: {json_data.get('total', 0)}")
                
                # Show first message if exists
                if json_data.get('messages'):
                    first_msg = json_data['messages'][0]
                    print(f"First message: {first_msg.get('id', 'N/A')}")
                    print(f"Author: {first_msg.get('author_id', 'N/A')}")
                    if 'content' in first_msg:
                        content = first_msg['content']
                        if isinstance(content, dict) and 'content' in content:
                            for node in content['content']:
                                if node.get('type') == 'paragraph' and 'content' in node:
                                    for text_node in node['content']:
                                        if text_node.get('type') == 'text':
                                            print(f"Text: {text_node.get('text', '')[:50]}...")
                                            break
                
            except Exception as json_error:
                print(f"JSON parse error: {json_error}")
                print(f"Response text: {response.text[:200]}...")
        else:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_messages_api()