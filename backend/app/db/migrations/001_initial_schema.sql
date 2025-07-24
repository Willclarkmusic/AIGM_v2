-- AIGM Database Schema
-- This script sets up the complete database schema for the AIGM messaging platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users Table
CREATE TABLE users (
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
  owner_id UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Server Members Table
CREATE TABLE server_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- Messages Table (with TipTap JSON)
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content JSONB NOT NULL, -- TipTap rich text JSON
  author_id UUID REFERENCES users(id) NOT NULL,
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
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Friendships Table (with blocking support)
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES users(id) NOT NULL,
  addressee_id UUID REFERENCES users(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
  action_user_id UUID REFERENCES users(id) NOT NULL, -- who took last action
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
  uploader_id UUID REFERENCES users(id) NOT NULL,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
-- Critical indexes for message retrieval
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
CREATE INDEX idx_messages_dm_created ON messages(dm_conversation_id, created_at DESC);
CREATE INDEX idx_messages_author ON messages(author_id);

-- Friend search optimization
CREATE INDEX idx_users_username_search ON users USING gin(username gin_trgm_ops);
CREATE INDEX idx_users_display_name_search ON users USING gin(display_name gin_trgm_ops);

-- Friendship status queries
CREATE INDEX idx_friendships_status ON friendships(status) WHERE status = 'accepted';
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);

-- Server member queries
CREATE INDEX idx_server_members_server ON server_members(server_id);
CREATE INDEX idx_server_members_user ON server_members(user_id);

-- File queries
CREATE INDEX idx_files_message ON files(message_id);
CREATE INDEX idx_files_uploader ON files(uploader_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dm_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Users can search all profiles for friend requests
CREATE POLICY "Users can search all profiles" ON users
FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Users can view their own friendships
CREATE POLICY "Users can view own friendships" ON friendships
FOR SELECT USING (
  requester_id = auth.uid() OR addressee_id = auth.uid()
);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" ON friendships
FOR INSERT WITH CHECK (
  requester_id = auth.uid()
);

-- Users can update friendships they're part of
CREATE POLICY "Users can update own friendships" ON friendships
FOR UPDATE USING (
  requester_id = auth.uid() OR addressee_id = auth.uid()
);

-- Users can only see messages in rooms they belong to
CREATE POLICY "Users can view room messages" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM server_members sm
    JOIN rooms r ON r.server_id = sm.server_id
    WHERE r.id = room_id AND sm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM dm_conversation_participants dcp
    WHERE dcp.conversation_id = dm_conversation_id
    AND dcp.user_id = auth.uid()
  )
);

-- Users can send messages to rooms they belong to
CREATE POLICY "Users can send room messages" ON messages
FOR INSERT WITH CHECK (
  author_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM server_members sm
      JOIN rooms r ON r.server_id = sm.server_id
      WHERE r.id = room_id AND sm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM dm_conversation_participants dcp
      WHERE dcp.conversation_id = dm_conversation_id
      AND dcp.user_id = auth.uid()
    )
  )
);

-- Users can view servers they're members of
CREATE POLICY "Users can view member servers" ON servers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM server_members sm
    WHERE sm.server_id = id AND sm.user_id = auth.uid()
  )
);

-- Users can create servers
CREATE POLICY "Users can create servers" ON servers
FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Server owners can update their servers
CREATE POLICY "Owners can update servers" ON servers
FOR UPDATE USING (owner_id = auth.uid());

-- Users can view rooms in servers they belong to
CREATE POLICY "Users can view server rooms" ON rooms
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM server_members sm
    WHERE sm.server_id = rooms.server_id AND sm.user_id = auth.uid()
  )
);

-- Server admins can create rooms
CREATE POLICY "Admins can create rooms" ON rooms
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM server_members sm
    WHERE sm.server_id = rooms.server_id 
    AND sm.user_id = auth.uid() 
    AND sm.role IN ('owner', 'admin')
  )
);

-- Users can view DM conversations they participate in
CREATE POLICY "Users can view own DM conversations" ON dm_conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dm_conversation_participants dcp
    WHERE dcp.conversation_id = id AND dcp.user_id = auth.uid()
  )
);

-- Users can react to messages they can see
CREATE POLICY "Users can react to visible messages" ON message_reactions
FOR ALL USING (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_id AND (
      EXISTS (
        SELECT 1 FROM server_members sm
        JOIN rooms r ON r.server_id = sm.server_id
        WHERE r.id = m.room_id AND sm.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM dm_conversation_participants dcp
        WHERE dcp.conversation_id = m.dm_conversation_id
        AND dcp.user_id = auth.uid()
      )
    )
  )
);

-- Users can view files in messages they can see
CREATE POLICY "Users can view files in visible messages" ON files
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = message_id AND (
      EXISTS (
        SELECT 1 FROM server_members sm
        JOIN rooms r ON r.server_id = sm.server_id
        WHERE r.id = m.room_id AND sm.user_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM dm_conversation_participants dcp
        WHERE dcp.conversation_id = m.dm_conversation_id
        AND dcp.user_id = auth.uid()
      )
    )
  )
);

-- Users can upload files
CREATE POLICY "Users can upload files" ON files
FOR INSERT WITH CHECK (uploader_id = auth.uid());

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
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