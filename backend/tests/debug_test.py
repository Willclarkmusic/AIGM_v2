#!/usr/bin/env python3
"""
Debug script to test the API setup
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent))

# Set test environment variables
os.environ["ENVIRONMENT"] = "testing"
os.environ["DEBUG"] = "true"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "test-service-key"
os.environ["SUPABASE_JWT_SECRET"] = "test-jwt-secret"

try:
    from fastapi.testclient import TestClient
    from app.main import app
    
    client = TestClient(app)
    
    print("Testing root endpoint...")
    response = client.get("/")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    print("\nTesting health endpoint...")
    response = client.get("/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    print("\nTesting user search endpoint...")
    response = client.get("/api/users/search?q=test")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()