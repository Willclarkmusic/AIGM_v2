#!/usr/bin/env python3
"""
Test script to verify the backend structure is correct
"""

import sys
import os

def test_imports():
    """Test that all our modules can be imported"""
    sys.path.insert(0, os.path.dirname(__file__))
    
    try:
        # Test basic imports
        from app import config
        from app.models import user
        from app.api.routes import users, auth, messages, servers, rooms, friends, files
        from app.db import supabase
        from app import dependencies
        
        print("✓ All modules import successfully")
        print("✓ FastAPI structure is correct")
        print("✓ Backend project structure is ready")
        
        return True
    except ImportError as e:
        print(f"✗ Import error: {e}")
        return False
    except Exception as e:
        print(f"✗ Other error: {e}")
        return False

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)