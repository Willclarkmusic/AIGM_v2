#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Debug script to test if the backend can connect to Supabase and handle requests
"""

import os
import sys
import asyncio
import httpx
from supabase import create_client

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.config import settings

async def test_supabase_connection():
    """Test if we can connect to Supabase"""
    print("Testing Supabase connection...")
    
    try:
        # Create Supabase client
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        
        # Test a simple query
        response = supabase.table('user_profiles').select('id', count='exact').limit(1).execute()
        
        print(f"SUCCESS: Supabase connection successful!")
        print(f"INFO: Found {response.count} user profiles in database")
        
        # Test JWT secret
        if settings.SUPABASE_JWT_SECRET:
            print("SUCCESS: JWT secret is configured")
        else:
            print("ERROR: JWT secret is missing")
            
        return True
        
    except Exception as e:
        print(f"ERROR: Supabase connection failed: {e}")
        return False

async def test_mock_auth():
    """Test the mock authentication"""
    print("\n🧪 Testing mock authentication...")
    
    try:
        from app.dependencies import get_current_user
        
        # Mock token
        mock_token = "test-token"
        
        user = await get_current_user(mock_token)
        print(f"SUCCESS: Mock authentication successful!")
        print(f"INFO: Mock user: {user.username} ({user.display_name})")
        
        return True
        
    except Exception as e:
        print(f"❌ Mock authentication failed: {e}")
        return False

async def test_conversations_endpoint():
    """Test the conversations endpoint directly"""
    print("\n🧪 Testing conversations endpoint...")
    
    try:
        # Import the FastAPI app
        from app.main import app
        from fastapi.testclient import TestClient
        
        client = TestClient(app)
        
        # Test health endpoint first
        health_response = client.get("/health")
        print(f"Health endpoint status: {health_response.status_code}")
        
        if health_response.status_code == 200:
            print("✅ Health endpoint working")
        else:
            print("❌ Health endpoint failed")
            return False
        
        # Test conversations endpoint with mock auth
        headers = {"Authorization": "Bearer test-token"}
        conv_response = client.get("/api/conversations", headers=headers)
        
        print(f"Conversations endpoint status: {conv_response.status_code}")
        
        if conv_response.status_code == 200:
            data = conv_response.json()
            print(f"✅ Conversations endpoint working!")
            print(f"📊 Response: {data}")
            return True
        else:
            print(f"❌ Conversations endpoint failed: {conv_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Conversations endpoint test failed: {e}")
        return False

async def main():
    """Run all tests"""
    print("Starting backend debug tests...\n")
    
    # Test configuration
    print("📋 Configuration:")
    print(f"   Environment: {settings.ENVIRONMENT}")
    print(f"   Debug mode: {settings.DEBUG}")
    print(f"   Supabase URL: {settings.SUPABASE_URL[:50]}...")
    print(f"   JWT Secret configured: {'Yes' if settings.SUPABASE_JWT_SECRET else 'No'}")
    print()
    
    results = []
    
    # Run tests
    results.append(await test_supabase_connection())
    results.append(await test_mock_auth())
    results.append(await test_conversations_endpoint())
    
    # Summary
    print("\n" + "="*50)
    print("📊 Test Results Summary:")
    
    tests = ["Supabase Connection", "Mock Authentication", "Conversations Endpoint"]
    for i, (test_name, result) in enumerate(zip(tests, results)):
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {test_name}: {status}")
    
    success_count = sum(results)
    print(f"\n🎯 Overall: {success_count}/{len(results)} tests passed")
    
    if success_count == len(results):
        print("🎉 All tests passed! Backend should be working.")
    else:
        print("⚠️  Some tests failed. Check the errors above.")

if __name__ == "__main__":
    asyncio.run(main())