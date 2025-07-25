#!/usr/bin/env python3
"""Test JSON response and save to file"""

import os
import sys
import json

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_json_response():
    try:
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        print("Testing conversation endpoint...")
        response = client.get("/api/conversations", headers={"Authorization": "Bearer test-token"})
        
        print(f"Status: {response.status_code}")
        print(f"Content-Length: {response.headers.get('content-length')}")
        print(f"Content-Type: {response.headers.get('content-type')}")
        
        # Save raw response to file
        with open('response_raw.txt', 'w', encoding='utf-8') as f:
            f.write(response.text)
        
        print("Raw response saved to response_raw.txt")
        
        if response.status_code == 200:
            try:
                json_data = response.json()
                print("JSON parsing: SUCCESS")
                print(f"Conversations count: {len(json_data.get('conversations', []))}")
                print(f"Total: {json_data.get('total', 0)}")
                
                # Save formatted JSON
                with open('response_formatted.json', 'w', encoding='utf-8') as f:
                    json.dump(json_data, f, indent=2, ensure_ascii=False, default=str)
                
                print("Formatted JSON saved to response_formatted.json")
                
            except Exception as json_error:
                print(f"JSON parsing failed: {json_error}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_json_response()