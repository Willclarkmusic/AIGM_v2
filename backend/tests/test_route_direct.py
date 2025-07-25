#!/usr/bin/env python3
"""Test route directly with debugging"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_route_directly():
    try:
        print("Testing route imports and registration...")
        
        # Test if the route is properly imported
        from app.main import app
        
        # Get all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                routes.append(f"{route.methods} {route.path}")
        
        print("Registered routes:")
        for route in routes:
            print(f"  {route}")
        
        # Check if conversations route is registered
        conversations_routes = [r for r in routes if '/api/conversations' in r]
        print(f"\nConversations routes found: {len(conversations_routes)}")
        for route in conversations_routes:
            print(f"  {route}")
        
        # Test with TestClient but with detailed error catching
        from fastapi.testclient import TestClient
        
        print("\nTesting with TestClient and error catching...")
        
        # Monkey patch the route to catch errors
        from app.api.routes.conversations import get_conversations
        original_get_conversations = get_conversations
        
        async def debug_get_conversations(current_user):
            print(f"DEBUG: get_conversations called with user: {current_user.username}")
            try:
                result = await original_get_conversations.__wrapped__(current_user)
                print(f"DEBUG: get_conversations succeeded: {type(result)}")
                return result
            except Exception as e:
                print(f"DEBUG: get_conversations failed: {e}")
                import traceback
                traceback.print_exc()
                raise
        
        # Create test client
        client = TestClient(app)
        
        print("\nCalling GET /api/conversations...")
        response = client.get("/api/conversations", headers={"Authorization": "Bearer test-token"})
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        print(f"Response text: {response.text}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_route_directly()