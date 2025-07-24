# AIGM Database Reset Instructions

## 🚀 Complete Fresh Start with user_profiles

### Step 1: Reset Database Schema

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Click "New Query"**
4. **Copy the entire contents of `reset_database_schema.sql`**
5. **Paste into SQL Editor**
6. **Click "Run"**

You should see:
- Tables being dropped
- New tables created with `user_profiles`
- Indexes created
- RLS policies applied
- Success message at the end

### Step 2: Create Test Users

```bash
python create_test_users_fixed.py
```

Expected output:
```
🚀 AIGM Test Users Creation (Fixed)
==================================================
👥 Creating test users...

[1/5] Creating user: alice@test.com
  📝 Creating auth user...
  ✅ Auth user created with ID: [uuid]
  👤 Creating user profile...
  ✅ Profile created for: alice

[2/5] Creating user: bob@test.com
  ...

🤝 Creating default relationships...
  📝 Creating friendship between Alice and Bob...
  ✅ Friendship created successfully
  💬 Creating DM conversation...
  ✅ DM conversation created: [uuid]
  ✅ DM participants added
  ✅ Sample message added

🔍 Verifying setup...
  ✅ Found 5 user profiles
     - alice: Alice Johnson (online)
     - bob: Bob Smith (online)
     - charlie: Charlie Brown (idle)
     - diana: Diana Prince (away)
     - eve: Eve Wilson (online)
  ✅ Found 1 friendships
  ✅ Found 1 DM conversations
  ✅ Found 1 messages

🎉 Setup completed successfully!

📋 Test Login Credentials:
  📧 alice@test.com / 12345
  📧 bob@test.com / 12345
  📧 charlie@test.com / 12345
  📧 diana@test.com / 12345
  📧 eve@test.com / 12345
```

### Step 3: Validate Everything Works

```bash
python validate_setup.py
```

Expected output:
```
🚀 AIGM Setup Validation
==================================================
🔍 Checking environment setup...
✅ .env file found
✅ All required environment variables are set

🔍 Checking database connection...
✅ Successfully connected to Supabase database

🔍 Checking test data...
✅ Test users found (Alice, Bob)

🔍 Running basic API tests...
✅ Basic API tests passed

==================================================
📊 Validation Summary:
  Environment: ✅ PASS
  Database Connection: ✅ PASS
  Test Data: ✅ PASS
  Basic API Tests: ✅ PASS

🎉 All checks passed! Ready for TDD implementation.

📋 Next steps:
1. Run user search tests: pytest tests/test_user_search.py -v
2. Implement missing functionality to make tests pass
3. Continue with friend request tests
```

### Step 4: Test User Search API

```bash
pytest tests/test_user_search.py -v
```

This should run comprehensive tests for the user search functionality.

### Step 5: Start the API Server

```bash
uvicorn app.main:app --reload
```

## 🔧 What Changed

### Database Schema
- **Old**: `users` table
- **New**: `user_profiles` table
- **Updated**: All foreign key references now point to `user_profiles(id)`

### Tables Updated
- ✅ `user_profiles` (main table)
- ✅ `servers.owner_id` → `user_profiles(id)`
- ✅ `server_members.user_id` → `user_profiles(id)`
- ✅ `rooms.created_by` → `user_profiles(id)`
- ✅ `friendships.*_id` → `user_profiles(id)`
- ✅ `messages.author_id` → `user_profiles(id)`
- ✅ `dm_conversation_participants.user_id` → `user_profiles(id)`
- ✅ `message_reactions.user_id` → `user_profiles(id)`
- ✅ `files.uploaded_by` → `user_profiles(id)`

### Test Users Created
- **Alice** (alice@test.com) - online, building AIGM
- **Bob** (bob@test.com) - online, ready to chat
- **Charlie** (charlie@test.com) - idle, in a meeting
- **Diana** (diana@test.com) - away, working on code
- **Eve** (eve@test.com) - online, testing features

### Default Relationships
- Alice ↔ Bob friendship (accepted)
- Alice ↔ Bob DM conversation with sample message

## 🎯 Success Criteria

After following these steps, you should have:

1. ✅ Clean database with `user_profiles` table
2. ✅ 5 test users with proper auth and profiles
3. ✅ Default friendship and DM conversation
4. ✅ All tests passing
5. ✅ API server running and responsive

## 🔍 Troubleshooting

### Error: "relation 'users' does not exist"
**Solution**: Make sure you ran the complete `reset_database_schema.sql` file

### Error: "User already registered"
**Solution**: The script handles this - it will update existing user profiles

### Error: "Could not find function"
**Solution**: The reset script creates all necessary functions

### API returns empty results
**Solution**: Verify test users exist with `python validate_setup.py`

---

This creates a bulletproof foundation for friend request testing! 🚀