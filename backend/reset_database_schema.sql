-- AIGM Database Complete Reset - Copy/Paste into Supabase SQL Editor
-- This will drop all existing tables and recreate with user_profiles naming

-- ================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ================================
-- Drop in reverse dependency order to avoid foreign key constraint errors

-- Drop tables that reference other tables first
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS dm_conversation_participants CASCADE;
DROP TABLE IF EXISTS dm_conversations CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS server_members CASCADE;
DROP TABLE IF EXISTS servers CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS users CASCADE;  -- Old table name
DROP TABLE IF EXISTS user_profiles CASCADE;  -- New table name (if exists)

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS create_test_user_profile(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_friendship(UUID, UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS create_dm_conversation(UUID, UUID) CASCADE;

-- ================================
-- STEP 2: ENABLE EXTENSIONS
-- ================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ================================
-- STEP 3: CREATE NEW SCHEMA
-- ================================

-- Main User Profiles Table (extends auth.users)
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  avatar_url TEXT,
  custom_url VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'online',
  status_text VARCHAR(100),
  status_color VARCHAR(7) DEFAULT '#22c55e',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Servers Table
CREATE TABLE servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url TEXT,
  invite_code VARCHAR(50) UNIQUE,
  owner_id UUID REFERENCES user_profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Server Members Table
CREATE TABLE server_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- owner, admin, member
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(server_id, user_id)
);

-- Rooms Table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  room_type VARCHAR(20) DEFAULT 'text', -- text, voice, video
  position INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DM Conversations Table
CREATE TABLE dm_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DM Conversation Participants Table
CREATE TABLE dm_conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages Table (with TipTap JSON)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content JSONB NOT NULL, -- TipTap rich text JSON
  author_id UUID REFERENCES user_profiles(id) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  dm_conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  space_id UUID, -- Future: references spaces(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT message_destination_check CHECK (
    (room_id IS NOT NULL AND dm_conversation_id IS NULL) OR
    (room_id IS NULL AND dm_conversation_id IS NOT NULL)
  )
);

-- Message Reactions Table
CREATE TABLE message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Friendships Table (with blocking support)
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES user_profiles(id) NOT NULL,
  addressee_id UUID REFERENCES user_profiles(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
  action_user_id UUID REFERENCES user_profiles(id) NOT NULL, -- who took last action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Files Table
CREATE TABLE files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  url TEXT NOT NULL,
  uploaded_by UUID REFERENCES user_profiles(id) NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================
-- STEP 4: CREATE PERFORMANCE INDEXES
-- ================================

-- User profile search optimization
CREATE INDEX idx_user_profiles_username_search ON user_profiles USING gin(username gin_trgm_ops);
CREATE INDEX idx_user_profiles_display_name_search ON user_profiles USING gin(display_name gin_trgm_ops);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_status ON user_profiles(status);

-- Message retrieval optimization
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_dm_created ON messages(dm_conversation_id, created_at DESC);
CREATE INDEX idx_messages_author ON messages(author_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Friendship queries optimization
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_requester_status ON friendships(requester_id, status);
CREATE INDEX idx_friendships_addressee_status ON friendships(addressee_id, status);

-- Server and room optimization
CREATE INDEX idx_server_members_server ON server_members(server_id);
CREATE INDEX idx_server_members_user ON server_members(user_id);
CREATE INDEX idx_servers_owner ON servers(owner_id);
CREATE INDEX idx_rooms_server ON rooms(server_id);
CREATE INDEX idx_rooms_created_by ON rooms(created_by);

-- DM conversation optimization
CREATE INDEX idx_dm_participants_conversation ON dm_conversation_participants(conversation_id);
CREATE INDEX idx_dm_participants_user ON dm_conversation_participants(user_id);

-- File upload optimization
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_message ON files(message_id);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- ================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- ================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- ================================
-- STEP 6: CREATE RLS POLICIES
-- ================================

-- User Profiles Policies
CREATE POLICY "Anyone can search user profiles" ON user_profiles
FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Friendships Policies
CREATE POLICY "Users can view own friendships" ON friendships
FOR SELECT USING (
  requester_id = auth.uid() OR addressee_id = auth.uid()
);

CREATE POLICY "Users can create friend requests" ON friendships
FOR INSERT WITH CHECK (
  requester_id = auth.uid()
);

CREATE POLICY "Users can update own friendships" ON friendships
FOR UPDATE USING (
  requester_id = auth.uid() OR addressee_id = auth.uid()
);

-- Messages Policies
CREATE POLICY "Users can view messages in accessible rooms/DMs" ON messages
FOR SELECT USING (
  -- Room messages: user must be member of server
  (room_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM server_members sm
    JOIN rooms r ON r.server_id = sm.server_id
    WHERE r.id = room_id AND sm.user_id = auth.uid()
  ))
  OR
  -- DM messages: user must be participant in conversation
  (dm_conversation_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM dm_conversation_participants dcp
    WHERE dcp.conversation_id = dm_conversation_id
    AND dcp.user_id = auth.uid()
  ))
);

CREATE POLICY "Users can send messages to accessible rooms/DMs" ON messages
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND (
    -- Room messages: user must be member of server
    (room_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM server_members sm
      JOIN rooms r ON r.server_id = sm.server_id
      WHERE r.id = room_id AND sm.user_id = auth.uid()
    ))
    OR
    -- DM messages: user must be participant in conversation
    (dm_conversation_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM dm_conversation_participants dcp
      WHERE dcp.conversation_id = dm_conversation_id
      AND dcp.user_id = auth.uid()
    ))
  )
);

-- Servers Policies
CREATE POLICY "Users can view servers they're members of" ON servers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM server_members sm
    WHERE sm.server_id = id AND sm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create servers" ON servers
FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Server owners can update their servers" ON servers
FOR UPDATE USING (owner_id = auth.uid());

-- Rooms Policies
CREATE POLICY "Users can view rooms in accessible servers" ON rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM server_members sm
    WHERE sm.server_id = rooms.server_id AND sm.user_id = auth.uid()
  )
);

CREATE POLICY "Server admins can create rooms" ON rooms
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM server_members sm
    WHERE sm.server_id = rooms.server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

-- DM Conversations Policies
CREATE POLICY "Users can view own DM conversations" ON dm_conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dm_conversation_participants dcp
    WHERE dcp.conversation_id = id AND dcp.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view own DM participants" ON dm_conversation_participants
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM dm_conversation_participants dcp2
    WHERE dcp2.conversation_id = conversation_id AND dcp2.user_id = auth.uid()
  )
);

-- Message Reactions Policies
CREATE POLICY "Users can react to visible messages" ON message_reactions
FOR ALL USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_id AND (
      (m.room_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM server_members sm
        JOIN rooms r ON r.server_id = sm.server_id
        WHERE r.id = m.room_id AND sm.user_id = auth.uid()
      ))
      OR
      (m.dm_conversation_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM dm_conversation_participants dcp
        WHERE dcp.conversation_id = m.dm_conversation_id
        AND dcp.user_id = auth.uid()
      ))
    )
  )
);

-- Files Policies
CREATE POLICY "Users can view files in accessible messages" ON files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_id AND (
      (m.room_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM server_members sm
        JOIN rooms r ON r.server_id = sm.server_id
        WHERE r.id = m.room_id AND sm.user_id = auth.uid()
      ))
      OR
      (m.dm_conversation_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM dm_conversation_participants dcp
        WHERE dcp.conversation_id = m.dm_conversation_id
        AND dcp.user_id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Users can upload files" ON files
FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- ================================
-- STEP 7: CREATE UTILITY FUNCTIONS
-- ================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_servers_updated_at BEFORE UPDATE ON servers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dm_conversations_updated_at BEFORE UPDATE ON dm_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper function to create user profiles
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT DEFAULT NULL,
  status TEXT DEFAULT 'online',
  status_text TEXT DEFAULT NULL,
  status_color TEXT DEFAULT '#22c55e'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_profiles (id, username, display_name, avatar_url, status, status_text, status_color)
  VALUES (user_id, username, display_name, avatar_url, status, status_text, status_color)
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    status = EXCLUDED.status,
    status_text = EXCLUDED.status_text,
    status_color = EXCLUDED.status_color,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create friendships
CREATE OR REPLACE FUNCTION create_friendship(
  requester_id UUID,
  addressee_id UUID,
  friendship_status TEXT DEFAULT 'pending'
)
RETURNS UUID AS $$
DECLARE
  friendship_id UUID;
BEGIN
  INSERT INTO friendships (requester_id, addressee_id, status, action_user_id)
  VALUES (requester_id, addressee_id, friendship_status, requester_id)
  ON CONFLICT (requester_id, addressee_id) DO UPDATE SET
    status = EXCLUDED.status,
    action_user_id = EXCLUDED.action_user_id,
    updated_at = NOW()
  RETURNING id INTO friendship_id;
  
  RETURN friendship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create DM conversations
CREATE OR REPLACE FUNCTION create_dm_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT dm.id INTO conversation_id
  FROM dm_conversations dm
  JOIN dm_conversation_participants p1 ON dm.id = p1.conversation_id
  JOIN dm_conversation_participants p2 ON dm.id = p2.conversation_id
  WHERE p1.user_id = user1_id AND p2.user_id = user2_id
  LIMIT 1;
  
  -- If not found, create new conversation
  IF conversation_id IS NULL THEN
    INSERT INTO dm_conversations DEFAULT VALUES
    RETURNING id INTO conversation_id;
    
    INSERT INTO dm_conversation_participants (conversation_id, user_id) VALUES
      (conversation_id, user1_id),
      (conversation_id, user2_id);
  END IF;
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- COMPLETION MESSAGE
-- ================================

DO $$
BEGIN
  RAISE NOTICE '✅ AIGM Database Schema Reset Complete!';
  RAISE NOTICE '📋 Next Steps:';
  RAISE NOTICE '1. Run: python create_test_users_fixed.py';
  RAISE NOTICE '2. Run: python validate_setup.py';
  RAISE NOTICE '3. Test: pytest tests/test_user_search.py -v';
END $$;