#!/usr/bin/env python3
"""Debug using FastAPI TestClient"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def debug_testclient():
    try:
        print("Testing with FastAPI TestClient...")
        
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test the exact endpoint
        print("\nTesting GET /api/conversations...")
        response = client.get("/api/conversations", headers={"Authorization": "Bearer test-token"})
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response Text: '{response.text}'")
        print(f"Response Length: {len(response.text)}")
        
        if response.status_code != 200:
            print("ERROR: Non-200 status code")
            return
            
        if not response.text.strip():
            print("ERROR: Empty response")
            return
            
        try:
            json_data = response.json()
            print(f"JSON Parse: SUCCESS")
            print(f"JSON Keys: {list(json_data.keys()) if isinstance(json_data, dict) else 'Not a dict'}")
            print(f"JSON Data: {json_data}")
        except Exception as json_error:
            print(f"JSON Parse: FAILED - {json_error}")
            
        # Test POST endpoint too
        print("\nTesting POST /api/conversations...")
        post_response = client.post("/api/conversations", 
                                   headers={"Authorization": "Bearer test-token"},
                                   json={"participant_username": "bob"})
        
        print(f"POST Status Code: {post_response.status_code}")
        print(f"POST Response Text: '{post_response.text}'")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_testclient()