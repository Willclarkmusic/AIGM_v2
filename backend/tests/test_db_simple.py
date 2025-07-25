#!/usr/bin/env python3
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

print('Testing Database Content...')
url = os.getenv('SUPABASE_URL')
service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not url or not service_key:
    print('ERROR: Missing Supabase credentials')
    exit(1)

supabase = create_client(url, service_key)

try:
    # Check user_profiles table
    profiles_response = supabase.table('user_profiles').select('username, display_name, status').execute()
    
    if profiles_response.data:
        print(f'SUCCESS: Found {len(profiles_response.data)} user profiles:')
        for profile in profiles_response.data:
            print(f'   - @{profile["username"]}: {profile["display_name"]} ({profile["status"]})')
    else:
        print('ERROR: No user profiles found')
        exit(1)
    
    # Test auth
    anon_key = os.getenv('SUPABASE_ANON_KEY')
    supabase_anon = create_client(url, anon_key)
    
    print('\nTesting Authentication...')
    auth_response = supabase_anon.auth.sign_in_with_password({
        'email': 'alice@test.com',
        'password': '12345'
    })
    
    if auth_response.session:
        print('SUCCESS: Authentication successful as Alice')
        token = auth_response.session.access_token
        user_id = auth_response.user.id
        print(f'   User ID: {user_id}')
        print(f'   Token: {token[:20]}...')
        
        print('SUCCESS: Authentication and database working!')
            
    else:
        print('ERROR: Authentication failed')
        exit(1)
        
    print('\nSUCCESS: All tests passed!')
    
except Exception as e:
    print(f'ERROR: {e}')
    exit(1)