#!/usr/bin/env python3
"""Test authentication dependency"""

import os
import sys
import asyncio

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

async def test_auth_dependency():
    try:
        print("Testing authentication dependency...")
        
        from app.dependencies import get_current_user
        from fastapi.security import HTTPBearer
        
        # Test with different token formats
        test_tokens = [
            "test-token",
            "Bearer test-token", 
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test"  # JWT-like format
        ]
        
        for token in test_tokens:
            try:
                print(f"\nTesting token: {token[:20]}...")
                user = await get_current_user(token)
                print(f"SUCCESS: {user.username} ({user.id})")
            except Exception as e:
                print(f"FAILED: {e}")
        
        # Test the HTTPBearer security
        print("\nTesting HTTPBearer...")
        security = HTTPBearer()
        
        # This should work fine
        print("HTTPBearer created successfully")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_auth_dependency())