#!/usr/bin/env python3
"""Test friends list for Alice"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_friends():
    try:
        print("Testing friends API endpoint...")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        print("Testing GET /api/friends...")
        response = client.get("/api/friends", 
                            headers={"Authorization": "Bearer test-token"})
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                print(f"Friends count: {len(json_data.get('friends', []))}")
                
                # Show each friend
                for i, friend in enumerate(json_data.get('friends', [])):
                    print(f"\nFriend {i + 1}:")
                    print(f"  Name: {friend.get('display_name', 'N/A')} ({friend.get('username', 'N/A')})")
                    print(f"  Status: {friend.get('status', 'N/A')}")
                    print(f"  Status Text: {friend.get('status_text', 'N/A')}")
                
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
    test_friends()