#!/usr/bin/env python3
"""
Create test users for AIGM with proper user_profiles table
Run this AFTER running reset_database_schema.sql
"""

import os
import sys
import time
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_test_users():
    """Create test users with both auth and profile entries"""
    
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
            "email": "alice@test.com",
            "password": "12345",
            "username": "alice",
            "display_name": "Alice Johnson",
            "status": "online",
            "status_text": "Building AIGM!",
            "status_color": "#22c55e"
        },
        {
            "email": "bob@test.com",
            "password": "12345",
            "username": "bob",
            "display_name": "Bob Smith",
            "status": "online",
            "status_text": "Ready to chat",
            "status_color": "#3b82f6"
        },
        {
            "email": "charlie@test.com",
            "password": "12345",
            "username": "charlie",
            "display_name": "Charlie Brown",
            "status": "idle",
            "status_text": "In a meeting",
            "status_color": "#f59e0b"
        },
        {
            "email": "diana@test.com",
            "password": "12345",
            "username": "diana",
            "display_name": "Diana Prince",
            "status": "away",
            "status_text": "Working on code",
            "status_color": "#8b5cf6"
        },
        {
            "email": "eve@test.com",
            "password": "12345",
            "username": "eve",
            "display_name": "Eve Wilson",
            "status": "online",
            "status_text": "Testing features",
            "status_color": "#ef4444"
        }
    ]
    
    created_users = []
    
    print("\n👥 Creating test users...")
    
    for i, user_data in enumerate(test_users, 1):
        try:
            print(f"\n[{i}/5] Creating user: {user_data['email']}")
            
            # Step 1: Create auth user
            print("  📝 Creating auth user...")
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
                print(f"  ✅ Auth user created with ID: {user_id}")
                
                # Step 2: Create user profile
                print("  👤 Creating user profile...")
                profile_data = {
                    "id": user_id,
                    "username": user_data["username"],
                    "display_name": user_data["display_name"],
                    "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data['username']}",
                    "status": user_data["status"],
                    "status_text": user_data["status_text"],
                    "status_color": user_data["status_color"]
                }
                
                profile_response = supabase.table("user_profiles").insert(profile_data).execute()
                
                if profile_response.data:
                    print(f"  ✅ Profile created for: {user_data['username']}")
                    created_users.append({
                        "id": user_id,
                        "username": user_data["username"],
                        "email": user_data["email"],
                        "display_name": user_data["display_name"]
                    })
                else:
                    print(f"  ❌ Failed to create profile for {user_data['username']}")
                    print(f"     Error: {profile_response}")
                    
            else:
                print(f"  ❌ Failed to create auth user for {user_data['email']}")
                if hasattr(auth_response, 'error'):
                    print(f"     Error: {auth_response.error}")
                
        except Exception as e:
            error_msg = str(e)
            if "User already registered" in error_msg or "already_registered" in error_msg:
                print(f"  ℹ️  User {user_data['email']} already exists, trying to update profile...")
                
                # Try to find existing user and update profile
                try:
                    # List all users to find the existing one
                    users_response = supabase.auth.admin.list_users()
                    existing_user = None
                    
                    for user in users_response:
                        if user.email == user_data['email']:
                            existing_user = user
                            break
                    
                    if existing_user:
                        user_id = existing_user.id
                        print(f"  📝 Found existing user ID: {user_id}")
                        
                        # Upsert profile
                        profile_data = {
                            "id": user_id,
                            "username": user_data["username"],
                            "display_name": user_data["display_name"],
                            "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data['username']}",
                            "status": user_data["status"],
                            "status_text": user_data["status_text"],
                            "status_color": user_data["status_color"]
                        }
                        
                        profile_response = supabase.table("user_profiles").upsert(profile_data).execute()
                        
                        if profile_response.data:
                            print(f"  ✅ Profile updated for: {user_data['username']}")
                            created_users.append({
                                "id": user_id,
                                "username": user_data["username"],
                                "email": user_data["email"],
                                "display_name": user_data["display_name"]
                            })
                        else:
                            print(f"  ⚠️  Could not update profile: {profile_response}")
                    else:
                        print(f"  ❌ Could not find existing user for {user_data['email']}")
                        
                except Exception as profile_error:
                    print(f"  ❌ Error updating profile: {profile_error}")
            else:
                print(f"  ❌ Error creating user {user_data['email']}: {e}")
        
        # Small delay between user creations
        if i < len(test_users):
            time.sleep(0.5)
    
    return created_users

def create_default_relationships(users):
    """Create default friendships and conversations"""
    if len(users) < 2:
        print("\n⚠️  Need at least 2 users to create relationships")
        return False
    
    try:
        url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        supabase = create_client(url, service_key)
        
        print("\n🤝 Creating default relationships...")
        
        # Find Alice and Bob
        alice = next((u for u in users if u["username"] == "alice"), None)
        bob = next((u for u in users if u["username"] == "bob"), None)
        
        if not alice or not bob:
            print("❌ Could not find Alice and Bob for relationship creation")
            return False
        
        # Create friendship between Alice and Bob
        print("  📝 Creating friendship between Alice and Bob...")
        friendship_data = {
            "requester_id": alice["id"],
            "addressee_id": bob["id"],
            "status": "accepted",
            "action_user_id": bob["id"]
        }
        
        friendship_response = supabase.table("friendships").upsert(friendship_data).execute()
        
        if friendship_response.data:
            print("  ✅ Friendship created successfully")
        else:
            print(f"  ⚠️  Could not create friendship: {friendship_response}")
        
        # Create DM conversation between Alice and Bob
        print("  💬 Creating DM conversation...")
        dm_response = supabase.table("dm_conversations").insert({}).execute()
        
        if dm_response.data and len(dm_response.data) > 0:
            conversation_id = dm_response.data[0]["id"]
            print(f"  ✅ DM conversation created: {conversation_id}")
            
            # Add participants
            participants_data = [
                {"conversation_id": conversation_id, "user_id": alice["id"]},
                {"conversation_id": conversation_id, "user_id": bob["id"]}
            ]
            
            participants_response = supabase.table("dm_conversation_participants").insert(participants_data).execute()
            
            if participants_response.data:
                print("  ✅ DM participants added")
                
                # Add a sample message
                message_data = {
                    "content": {
                        "type": "doc",
                        "content": [
                            {
                                "type": "paragraph",
                                "content": [
                                    {
                                        "type": "text",
                                        "text": "Hey Bob! Welcome to AIGM. This is our test conversation! 🎉"
                                    }
                                ]
                            }
                        ]
                    },
                    "author_id": alice["id"],
                    "dm_conversation_id": conversation_id
                }
                
                message_response = supabase.table("messages").insert(message_data).execute()
                
                if message_response.data:
                    print("  ✅ Sample message added")
                else:
                    print(f"  ⚠️  Could not add sample message: {message_response}")
            else:
                print(f"  ⚠️  Could not add participants: {participants_response}")
        else:
            print(f"  ⚠️  Could not create DM conversation: {dm_response}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating relationships: {e}")
        return False

def verify_setup(users):
    """Verify the setup is working correctly"""
    print("\n🔍 Verifying setup...")
    
    try:
        url = os.getenv("SUPABASE_URL")
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        supabase = create_client(url, service_key)
        
        # Check user profiles
        profiles_response = supabase.table("user_profiles").select("username, display_name, status").execute()
        if profiles_response.data:
            print(f"  ✅ Found {len(profiles_response.data)} user profiles")
            for profile in profiles_response.data:
                print(f"     - {profile['username']}: {profile['display_name']} ({profile['status']})")
        else:
            print("  ❌ No user profiles found")
            return False
        
        # Check friendships
        friendships_response = supabase.table("friendships").select("*").execute()
        if friendships_response.data:
            print(f"  ✅ Found {len(friendships_response.data)} friendships")
        
        # Check DM conversations
        dm_response = supabase.table("dm_conversations").select("*").execute()
        if dm_response.data:
            print(f"  ✅ Found {len(dm_response.data)} DM conversations")
        
        # Check messages
        messages_response = supabase.table("messages").select("*").execute()
        if messages_response.data:
            print(f"  ✅ Found {len(messages_response.data)} messages")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verifying setup: {e}")
        return False

def main():
    """Main function"""
    print("🚀 AIGM Test Users Creation (Fixed)")
    print("=" * 50)
    
    # Create users
    users = create_test_users()
    
    if not users:
        print("\n❌ No users were created successfully")
        return False
    
    print(f"\n✅ Successfully created/updated {len(users)} users")
    
    # Create relationships
    relationships_ok = create_default_relationships(users)
    
    # Verify setup
    verification_ok = verify_setup(users)
    
    print("\n" + "=" * 50)
    print("📊 Setup Summary:")
    print(f"  Users Created: {len(users)}/5")
    print(f"  Relationships: {'✅ OK' if relationships_ok else '❌ Failed'}")
    print(f"  Verification: {'✅ OK' if verification_ok else '❌ Failed'}")
    
    if len(users) >= 3 and relationships_ok and verification_ok:
        print("\n🎉 Setup completed successfully!")
        print("\n📋 Test Login Credentials:")
        for user in users:
            print(f"  📧 {user['email']} / 12345")
        
        print("\n📋 Next Steps:")
        print("1. Run: python validate_setup.py")
        print("2. Run: pytest tests/test_user_search.py -v")
        print("3. Start API: uvicorn app.main:app --reload")
        return True
    else:
        print("\n⚠️  Setup completed with issues. Please check the errors above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)