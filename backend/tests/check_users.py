#!/usr/bin/env python3
"""Check what users exist in the database"""

import os
import sys

# Add app directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

try:
    from supabase import create_client
    from app.config import settings
    
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    # Get all user profiles
    response = supabase.table('user_profiles').select('*').execute()
    
    print("Users in database:")
    for user in response.data:
        print(f"  ID: {user['id']}")
        print(f"  Username: {user['username']}")
        print(f"  Display Name: {user['display_name']}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print("  ---")
        
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()