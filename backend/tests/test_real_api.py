#!/usr/bin/env python3
"""
Test the real API endpoints with actual database
This tests the production code, not mocks
"""

import os
import requests
import json
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
load_dotenv()

# API base URL
API_BASE = "http://127.0.0.1:8000"

# Test credentials from create_test_users_fixed.py
TEST_USERS = [
    {"email": "alice@test.com", "password": "12345", "username": "alice"},
    {"email": "bob@test.com", "password": "12345", "username": "bob"},
    {"email": "charlie@test.com", "password": "12345", "username": "charlie"},
]

def get_auth_token():
    """Get a real auth token from Supabase"""
    url = os.getenv("SUPABASE_URL")
    anon_key = os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not anon_key:
        print("ERROR: Missing Supabase credentials")
        return None
    
    supabase = create_client(url, anon_key)
    
    # Try to sign in as Alice
    try:
        auth_response = supabase.auth.sign_in_with_password({
            "email": "alice@test.com",
            "password": "12345"
        })
        
        if auth_response.session:
            print(f"SUCCESS: Authenticated as Alice")
            return auth_response.session.access_token
        else:
            print("ERROR: Failed to authenticate")
            return None
            
    except Exception as e:
        print(f"ERROR: Auth error: {e}")
        return None

def test_user_search(token):
    """Test the user search endpoint"""
    print("\nTesting User Search API...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test search for "bob"
    response = requests.get(f"{API_BASE}/api/users/search?q=bob&limit=10&offset=0", headers=headers)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"SUCCESS: Search successful!")
        print(f"   Query: {data.get('query')}")
        print(f"   Total: {data.get('total')}")
        print(f"   Users found: {len(data.get('users', []))}")
        
        for user in data.get('users', []):
            print(f"   - {user.get('username')}: {user.get('display_name')}")
            
        return True
    else:
        print(f"ERROR: Search failed: {response.text}")
        return False

def test_friend_request(token):
    """Test friend request functionality"""
    print("\n Testing Friend Request API...")
    
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    # Test sending friend request to Bob
    friend_request_data = {"addressee_username": "bob"}
    
    response = requests.post(f"{API_BASE}/api/friends/request", 
                           json=friend_request_data, 
                           headers=headers)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"SUCCESS: Friend request sent!")
        print(f"   Request ID: {data.get('id')}")
        print(f"   Status: {data.get('status')}")
        print(f"   To: {data.get('addressee', {}).get('username')}")
        return data.get('id')
    else:
        print(f"ERROR: Friend request failed: {response.text}")
        return None

def test_get_friendships(token):
    """Test getting friendships"""
    print("\n Testing Get Friendships API...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/api/friends/", headers=headers)
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"SUCCESS: Friendships retrieved!")
        print(f"   Total: {data.get('total')}")
        print(f"   Friendships: {len(data.get('friendships', []))}")
        
        for friendship in data.get('friendships', []):
            print(f"   - ID: {friendship.get('id')}, Status: {friendship.get('status')}")
            
        return True
    else:
        print(f"ERROR: Get friendships failed: {response.text}")
        return False

def test_database_content():
    """Test database content directly"""
    print("\n Testing Database Content...")
    
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        print("ERROR: Missing Supabase credentials")
        return False
    
    supabase = create_client(url, service_key)
    
    try:
        # Check user_profiles table
        profiles_response = supabase.table("user_profiles").select("username, display_name, status").execute()
        
        if profiles_response.data:
            print(f"SUCCESS: Found {len(profiles_response.data)} user profiles:")
            for profile in profiles_response.data:
                print(f"   - @{profile['username']}: {profile['display_name']} ({profile['status']})")
        else:
            print("ERROR: No user profiles found")
            return False
        
        # Check friendships table
        friendships_response = supabase.table("friendships").select("*").execute()
        print(f"SUCCESS: Found {len(friendships_response.data or [])} friendships in database")
        
        return True
        
    except Exception as e:
        print(f"ERROR: Database error: {e}")
        return False

def main():
    """Main test function"""
    print(" AIGM Real API Test")
    print("=" * 50)
    
    # Test database content first
    db_ok = test_database_content()
    if not db_ok:
        print("\nERROR: Database test failed - aborting API tests")
        return False
    
    # Get auth token
    token = get_auth_token()
    if not token:
        print("\nERROR: Authentication failed - aborting API tests")
        return False
    
    # Test API endpoints
    search_ok = test_user_search(token)
    friend_request_id = test_friend_request(token)
    friendships_ok = test_get_friendships(token)
    
    # Summary
    print("\n" + "=" * 50)
    print(" Test Results:")
    print(f"  Database Content: {'SUCCESS: OK' if db_ok else 'ERROR: Failed'}")
    print(f"  Authentication: {'SUCCESS: OK' if token else 'ERROR: Failed'}")
    print(f"  User Search: {'SUCCESS: OK' if search_ok else 'ERROR: Failed'}")
    print(f"  Friend Request: {'SUCCESS: OK' if friend_request_id else 'ERROR: Failed'}")
    print(f"  Get Friendships: {'SUCCESS: OK' if friendships_ok else 'ERROR: Failed'}")
    
    all_passed = all([db_ok, token, search_ok, friend_request_id, friendships_ok])
    
    if all_passed:
        print("\n All tests passed! The API is working with real data.")
    else:
        print("\nWARNING:  Some tests failed. Check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)