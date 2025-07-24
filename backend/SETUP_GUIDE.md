# AIGM Database Setup Guide

## Quick Setup (5 minutes)

### Step 1: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```bash
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   **Note**: The `SUPABASE_ANON_KEY` is the same as `SUPABASE_PUBLISHABLE_DEFAULT_KEY` in the Supabase dashboard.

### Step 2: Set Up Database Schema

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase_setup.sql` and paste it
5. Click **Run** to execute the script

### Step 3: Create Test Users

```bash
python create_test_users.py
```

This will create:
- Alice (alice@example.com / password123)
- Bob (bob@example.com / password123)  
- Charlie (charlie@example.com / password123)

### Step 4: Validate Setup

```bash
python validate_setup.py
```

All checks should pass! ✅

### Step 5: Run Tests

```bash
pytest tests/test_user_search.py -v
```

## Troubleshooting

### Issue: "relation 'public.users' does not exist"
**Solution**: Run the SQL script in Supabase SQL Editor (Step 2)

### Issue: "Could not find the function public.execute_sql"
**Solution**: The Python migration script doesn't work with Supabase. Use the SQL Editor instead.

### Issue: Authentication errors in tests
**Solution**: Make sure your `.env` file has the correct Supabase credentials

### Issue: User creation fails
**Solution**: Check that:
1. Your Supabase project is not paused
2. The service role key has the correct permissions
3. The database schema was created successfully

## Manual Database Setup (Alternative)

If the automated setup doesn't work, you can manually create the database:

1. **Users Table**:
   ```sql
   CREATE TABLE users (
     id UUID REFERENCES auth.users(id) PRIMARY KEY,
     username VARCHAR(50) UNIQUE NOT NULL,
     display_name VARCHAR(100),
     avatar_url TEXT,
     status VARCHAR(20) DEFAULT 'online',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

2. **Enable RLS**:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can search all profiles" ON users
   FOR SELECT USING (true);
   ```

3. **Create Search Index**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "pg_trgm";
   CREATE INDEX idx_users_username_search ON users USING gin(username gin_trgm_ops);
   ```

## Next Steps

Once setup is complete:

1. **Start the API server**:
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Test user search**:
   ```bash
   curl "http://localhost:8000/api/users/search?q=ali" \
        -H "Authorization: Bearer fake-token"
   ```

3. **Run comprehensive tests**:
   ```bash
   pytest tests/ -v
   ```

## Environment Variables Reference

```bash
# Required for backend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key  # Same as PUBLISHABLE_DEFAULT_KEY
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Optional but recommended
SUPABASE_JWT_SECRET=your-jwt-secret
SECRET_KEY=your-app-secret-key
```

The setup creates a bulletproof foundation for the user search API that everything else depends on!