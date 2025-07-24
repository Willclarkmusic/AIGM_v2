#!/usr/bin/env python3
"""
Simple script to create test users in Supabase
Run this AFTER setting up the database with supabase_setup.sql
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_test_users():
    """Create test users using Supabase Auth API"""
    
    # Get Supabase credentials
    url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not service_key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file")
        return False
    
    print(f"🔗 Connecting to Supabase: {url}")
    supabase = create_client(url, service_key)
    
    # Test users to create
    test_users = [
        {
            "email": "alice@example.com",
            "password": "password123",
            "username": "alice",
            "display_name": "Alice Johnson"
        },
        {
            "email": "bob@example.com",
            "password": "password123", 
            "username": "bob",
            "display_name": "Bob Smith"
        },
        {
            "email": "charlie@example.com",
            "password": "password123",
            "username": "charlie",
            "display_name": "Charlie Brown"
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        try:
            print(f"\n👤 Creating user: {user_data['email']}")
            
            # Create auth user using admin API
            auth_response = supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True,
                "user_metadata": {
                    "username": user_data["username"],
                    "display_name": user_data["display_name"]
                }
            })
            
            if auth_response.user:
                user_id = auth_response.user.id
                print(f"✅ Created auth user with ID: {user_id}")
                
                # Create user profile in our users table
                profile_data = {
                    "id": user_id,
                    "username": user_data["username"],
                    "display_name": user_data["display_name"],
                    "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data['username']}",
                    "status": "online",
                    "status_text": f"Test user {user_data['username']}"
                }
                
                profile_response = supabase.table("users").insert(profile_data).execute()
                
                if profile_response.data:
                    print(f"✅ Created profile for: {user_data['username']}")
                    created_users.append({
                        "id": user_id,
                        "username": user_data["username"],
                        "email": user_data["email"]
                    })
                else:
                    print(f"❌ Failed to create profile for {user_data['username']}")
                    print(f"Error: {profile_response}")
            else:
                print(f"❌ Failed to create auth user for {user_data['email']}")
                
        except Exception as e:
            if "User already registered" in str(e) or "already_registered" in str(e):
                print(f"ℹ️  User {user_data['email']} already exists")
                # Try to get the existing user ID and create/update profile
                try:
                    # Get user by email
                    existing_users = supabase.auth.admin.list_users()
                    for existing_user in existing_users:
                        if existing_user.email == user_data['email']:
                            user_id = existing_user.id
                            print(f"📝 Found existing user ID: {user_id}")
                            
                            # Upsert profile
                            profile_data = {
                                "id": user_id,
                                "username": user_data["username"],
                                "display_name": user_data["display_name"],
                                "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data['username']}",
                                "status": "online",
                                "status_text": f"Test user {user_data['username']}"
                            }
                            
                            # Use upsert to handle existing profiles
                            profile_response = supabase.table("users").upsert(profile_data).execute()
                            
                            if profile_response.data:
                                print(f"✅ Updated profile for: {user_data['username']}")
                                created_users.append({
                                    "id": user_id,
                                    "username": user_data["username"],
                                    "email": user_data["email"]
                                })
                            break
                except Exception as profile_error:
                    print(f"⚠️  Could not update profile: {profile_error}")
            else:
                print(f"❌ Error creating user {user_data['email']}: {e}")
    
    # Create a friendship between Alice and Bob if both exist
    if len(created_users) >= 2:
        try:
            alice = next(u for u in created_users if u["username"] == "alice")
            bob = next(u for u in created_users if u["username"] == "bob")
            
            print(f"\n🤝 Creating friendship between Alice and Bob...")
            
            friendship_data = {
                "requester_id": alice["id"],
                "addressee_id": bob["id"],
                "status": "accepted",
                "action_user_id": bob["id"]
            }
            
            friendship_response = supabase.table("friendships").upsert(friendship_data).execute()
            
            if friendship_response.data:
                print("✅ Created friendship between Alice and Bob")
            else:
                print("⚠️  Could not create friendship")
                
        except Exception as e:
            print(f"⚠️  Error creating friendship: {e}")
    
    print(f"\n🎉 Setup complete! Created/updated {len(created_users)} users.")
    print("\n📋 Test login credentials:")
    for user in created_users:
        print(f"  📧 {user['email']} / password123")
    
    return len(created_users) > 0

if __name__ == "__main__":
    print("🚀 AIGM Test User Creation")
    print("=" * 50)
    
    success = create_test_users()
    
    if success:
        print("\n✅ Ready to test the API!")
        print("Next steps:")
        print("1. Run: python validate_setup.py")
        print("2. Run: pytest tests/test_user_search.py -v")
        print("3. Start API: uvicorn app.main:app --reload")
    else:
        print("\n❌ User creation failed. Please check your environment variables.")
    
    sys.exit(0 if success else 1)