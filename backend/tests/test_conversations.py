#!/usr/bin/env python3
"""Test conversations endpoint"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.main import app
    from fastapi.testclient import TestClient
    
    # Enable detailed error reporting
    import logging
    logging.basicConfig(level=logging.DEBUG)
    
    client = TestClient(app)
    
    # Test conversations endpoint with mock auth
    headers = {"Authorization": "Bearer test-token"}
    response = client.get("/api/conversations", headers=headers)
    
    print(f"Conversations endpoint status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print("SUCCESS: Conversations endpoint working!")
        print(f"Response data: {data}")
        print(f"Number of conversations: {len(data.get('conversations', []))}")
    else:
        print("ERROR: Conversations endpoint failed")
        print(f"Response: {response.text}")
        
    # Test conversation creation
    print("\nTesting conversation creation...")
    create_response = client.post("/api/conversations", 
                                 headers=headers,
                                 json={"participant_username": "bob"})
    
    print(f"Create conversation status: {create_response.status_code}")
    
    if create_response.status_code in [200, 201]:
        data = create_response.json()
        print("SUCCESS: Conversation creation working!")
        print(f"Created conversation: {data}")
    else:
        print("ERROR: Conversation creation failed")
        print(f"Response: {create_response.text}")
        
except Exception as e:
    print(f"ERROR: Test failed: {e}")
    import traceback
    traceback.print_exc()