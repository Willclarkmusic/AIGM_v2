#!/usr/bin/env python3
"""
Validation script to check AIGM setup is complete
"""

import os
import sys
from pathlib import Path

def check_environment():
    """Check environment configuration"""
    print("🔍 Checking environment setup...")
    
    required_vars = [
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY", 
        "SUPABASE_ANON_KEY"
    ]
    
    env_file = Path(".env")
    if env_file.exists():
        print("✅ .env file found")
        
        # Try to load environment variables
        from dotenv import load_dotenv
        load_dotenv()
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var) or os.getenv(var).startswith("your-"):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"❌ Missing or placeholder environment variables: {missing_vars}")
            print("\n📋 Next steps:")
            print("1. Set up Supabase project at https://app.supabase.com")
            print("2. Copy the credentials to .env file")
            print("3. Run: python setup_database.py --with-users")
            return False
        else:
            print("✅ All required environment variables are set")
            return True
    else:
        print("❌ .env file not found")
        print("Copy .env.example to .env and configure your Supabase credentials")
        return False

def check_database_connection():
    """Check if we can connect to Supabase"""
    print("\n🔍 Checking database connection...")
    
    try:
        from app.db.supabase import get_supabase_client
        supabase = get_supabase_client()
        
        # Test connection by trying to access user_profiles table
        response = supabase.table("user_profiles").select("id").limit(1).execute()
        print("✅ Successfully connected to Supabase database")
        return True
        
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        print("\n📋 Possible issues:")
        print("1. Check Supabase credentials in .env")
        print("2. Verify project is not paused")
        print("3. Run database setup: python setup_database.py")
        return False

def check_test_data():
    """Check if test data exists"""
    print("\n🔍 Checking test data...")
    
    try:
        from app.db.supabase import get_supabase_client
        supabase = get_supabase_client()
        
        # Check for test users
        response = supabase.table("user_profiles").select("username").in_("username", ["alice", "bob"]).execute()
        
        if response.data and len(response.data) >= 2:
            print("✅ Test users found (Alice, Bob)")
            return True
        else:
            print("❌ Test users not found")
            print("Run: python setup_database.py --with-users")
            return False
            
    except Exception as e:
        print(f"❌ Error checking test data: {e}")
        return False

def run_basic_tests():
    """Run basic API tests"""
    print("\n🔍 Running basic API tests...")
    
    try:
        import subprocess
        result = subprocess.run([
            "./venv/Scripts/python.exe", "-m", "pytest", 
            "tests/test_basic.py", "-v", "--tb=short"
        ], capture_output=True, text=True, cwd=Path(__file__).parent)
        
        if result.returncode == 0:
            print("✅ Basic API tests passed")
            return True
        else:
            print("❌ Basic API tests failed")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False

def main():
    """Main validation function"""
    print("🚀 AIGM Setup Validation")
    print("=" * 50)
    
    checks = [
        ("Environment", check_environment),
        ("Database Connection", check_database_connection), 
        ("Test Data", check_test_data),
        ("Basic API Tests", run_basic_tests)
    ]
    
    results = []
    for name, check_func in checks:
        result = check_func()
        results.append((name, result))
        
        if not result:
            print(f"\n❌ {name} check failed - stopping validation")
            break
    
    print("\n" + "=" * 50)
    print("📊 Validation Summary:")
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"  {name}: {status}")
    
    all_passed = all(result for _, result in results)
    
    if all_passed:
        print("\n🎉 All checks passed! Ready for TDD implementation.")
        print("\n📋 Next steps:")
        print("1. Run user search tests: pytest tests/test_user_search.py -v")
        print("2. Implement missing functionality to make tests pass")
        print("3. Continue with friend request tests")
    else:
        print("\n⚠️  Some checks failed. Please fix the issues above before proceeding.")
    
    return all_passed

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)