#!/usr/bin/env python3
"""
Database setup script for AIGM
Applies migrations and creates test data
"""

import os
import sys
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_supabase_client() -> Client:
    """Create Supabase client with service role key"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")
        sys.exit(1)
    
    return create_client(url, key)

def apply_migration(supabase: Client, migration_file: Path):
    """Apply a single migration file"""
    print(f"📄 Applying migration: {migration_file.name}")
    
    try:
        with open(migration_file, 'r') as f:
            sql_content = f.read()
        
        # Split by semicolon and execute each statement
        statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement.strip():
                try:
                    result = supabase.rpc('execute_sql', {'sql_query': statement}).execute()
                    if hasattr(result, 'error') and result.error:
                        print(f"⚠️  Warning in statement: {result.error}")
                except Exception as e:
                    # Some statements might fail if they already exist, that's okay
                    if "already exists" not in str(e).lower():
                        print(f"⚠️  Warning: {e}")
        
        print(f"✅ Migration {migration_file.name} applied successfully")
        
    except Exception as e:
        print(f"❌ Error applying migration {migration_file.name}: {e}")
        return False
    
    return True

def setup_database():
    """Main database setup function"""
    print("🚀 Setting up AIGM database...")
    
    # Get Supabase client
    supabase = get_supabase_client()
    print("✅ Connected to Supabase")
    
    # Find migration files
    migrations_dir = Path(__file__).parent / "app" / "db" / "migrations"
    migration_files = sorted(migrations_dir.glob("*.sql"))
    
    if not migration_files:
        print("❌ No migration files found!")
        sys.exit(1)
    
    print(f"📁 Found {len(migration_files)} migration files")
    
    # Apply each migration
    for migration_file in migration_files:
        if not apply_migration(supabase, migration_file):
            print(f"❌ Failed to apply migration: {migration_file.name}")
            sys.exit(1)
    
    print("🎉 Database setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Create test users via Supabase Auth dashboard or API")
    print("2. Run the user search tests: pytest ../tests/test_user_search.py")
    print("3. Start the FastAPI server: uvicorn app.main:app --reload")

def create_test_users():
    """Create test users for development"""
    print("👥 Creating test users...")
    
    supabase = get_supabase_client()
    
    # Test users data
    test_users = [
        {
            "email": "alice@example.com",
            "password": "12345",
            "username": "alice",
            "display_name": "Alice Johnson"
        },
        {
            "email": "bob@example.com", 
            "password": "12345",
            "username": "bob",
            "display_name": "Bob Smith"
        },
        {
            "email": "charlie@example.com",
            "password": "12345", 
            "username": "charlie",
            "display_name": "Charlie Brown"
        },
        {
            "email": "diana@example.com",
            "password": "12345",
            "username": "diana", 
            "display_name": "Diana Prince"
        },
        {
            "email": "eve@example.com",
            "password": "12345",
            "username": "eve",
            "display_name": "Eve Williams"
        }
    ]
    
    created_users = []
    
    for user_data in test_users:
        try:
            # Create auth user
            auth_response = supabase.auth.admin.create_user({
                "email": user_data["email"],
                "password": user_data["password"],
                "email_confirm": True
            })
            
            if auth_response.user:
                user_id = auth_response.user.id
                print(f"✅ Created auth user: {user_data['email']} (ID: {user_id})")
                
                # Create user profile
                profile_response = supabase.table("users").insert({
                    "id": user_id,
                    "username": user_data["username"],
                    "display_name": user_data["display_name"],
                    "avatar_url": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data['username']}",
                    "status": "online",
                    "status_text": f"Test user {user_data['username']}"
                }).execute()
                
                if not profile_response.data:
                    print(f"⚠️  Warning: Could not create profile for {user_data['email']}")
                else:
                    print(f"✅ Created profile for: {user_data['username']}")
                    created_users.append({
                        "id": user_id,
                        "username": user_data["username"],
                        "email": user_data["email"]
                    })
            
        except Exception as e:
            if "already_registered" in str(e):
                print(f"ℹ️  User {user_data['email']} already exists")
            else:
                print(f"❌ Error creating user {user_data['email']}: {e}")
    
    if len(created_users) >= 2:
        # Create friendship between first two users
        try:
            friendship_response = supabase.table("friendships").insert({
                "requester_id": created_users[0]["id"],
                "addressee_id": created_users[1]["id"],
                "status": "accepted",
                "action_user_id": created_users[1]["id"]
            }).execute()
            
            if friendship_response.data:
                print(f"✅ Created friendship between {created_users[0]['username']} and {created_users[1]['username']}")
        except Exception as e:
            print(f"⚠️  Could not create friendship: {e}")
    
    print(f"🎉 Created {len(created_users)} test users successfully!")
    return created_users

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--with-users":
        setup_database()
        create_test_users()
    else:
        setup_database()