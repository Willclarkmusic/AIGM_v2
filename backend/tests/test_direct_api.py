#!/usr/bin/env python3
"""Test API directly with real HTTP requests"""

import os
import sys
import requests
import json

# Add app directory to path  
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_direct_api():
    """Test the API with direct HTTP requests to see what's actually returned"""
    
    base_url = "http://127.0.0.1:8000"
    headers = {"Authorization": "Bearer test-token"}
    
    print("Testing direct API access...")
    
    try:
        # Test health endpoint
        print("\n1. Testing health endpoint...")
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        # Test conversations endpoint
        print("\n2. Testing conversations endpoint...")
        response = requests.get(f"{base_url}/api/conversations", headers=headers, timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response Text: '{response.text}'")
        print(f"Response Length: {len(response.text)}")
        
        if response.text:
            try:
                json_data = response.json()
                print(f"Parsed JSON: {json_data}")
            except json.JSONDecodeError as e:
                print(f"JSON Parse Error: {e}")
        
        # Test conversation creation
        print("\n3. Testing conversation creation...")
        create_data = {"participant_username": "bob"}
        response = requests.post(f"{base_url}/api/conversations", 
                               headers={**headers, "Content-Type": "application/json"},
                               json=create_data,
                               timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response Text: '{response.text}'")
        print(f"Response Length: {len(response.text)}")
        
        if response.text:
            try:
                json_data = response.json()
                print(f"Parsed JSON: {json_data}")
            except json.JSONDecodeError as e:
                print(f"JSON Parse Error: {e}")
                
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to backend server")
        print("Make sure the backend is running on http://127.0.0.1:8000")
    except requests.exceptions.Timeout:
        print("ERROR: Request timed out")
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_direct_api()