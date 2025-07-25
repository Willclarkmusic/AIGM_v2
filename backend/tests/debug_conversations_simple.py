#!/usr/bin/env python3
"""Simple test to check conversations returned for Alice"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_conversations_simple():
    try:
        print("Testing conversations API endpoint...")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        print("Testing GET /api/conversations...")
        response = client.get("/api/conversations", 
                            headers={"Authorization": "Bearer test-token"})
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                print(f"Conversations count: {len(json_data.get('conversations', []))}")
                
                # Show each conversation
                for i, conv in enumerate(json_data.get('conversations', [])):
                    print(f"\nConversation {i + 1}:")
                    print(f"  ID: {conv.get('id', 'N/A')}")
                    print(f"  Participants: {len(conv.get('participants', []))}")
                    for p in conv.get('participants', []):
                        print(f"    - {p.get('display_name', 'N/A')} ({p.get('username', 'N/A')})")
                    print(f"  Last message: {conv.get('last_message', {}).get('content', 'None') if conv.get('last_message') else 'None'}")
                
            except Exception as json_error:
                print(f"JSON parse error: {json_error}")
                print(f"Response text: {response.text[:500]}...")
        else:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_conversations_simple()