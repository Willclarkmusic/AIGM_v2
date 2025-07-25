#!/usr/bin/env python3
"""Simple test script"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from app.config import settings
    print("SUCCESS: Config loaded")
    print(f"Environment: {settings.ENVIRONMENT}")
    print(f"Debug: {settings.DEBUG}")
    print(f"Supabase URL: {settings.SUPABASE_URL[:50]}...")
except Exception as e:
    print(f"ERROR: Config failed: {e}")
    sys.exit(1)

try:
    from supabase import create_client
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    print("SUCCESS: Supabase client created")
    
    # Test query
    response = supabase.table('user_profiles').select('id', count='exact').limit(1).execute()
    print(f"SUCCESS: Database query worked, found {response.count} profiles")
    
except Exception as e:
    print(f"ERROR: Supabase connection failed: {e}")

try:
    from app.main import app
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    health_response = client.get("/health")
    print(f"Health endpoint status: {health_response.status_code}")
    
    if health_response.status_code == 200:
        print("SUCCESS: Health endpoint working")
        data = health_response.json()
        print(f"Health data: {data}")
    else:
        print("ERROR: Health endpoint failed")
        
except Exception as e:
    print(f"ERROR: FastAPI test failed: {e}")

print("Test complete")