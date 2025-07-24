-- AIGM Seed Data
-- Creates test users and initial data for development and testing

-- Insert test users (these will need to be created via Supabase Auth first)
-- This is for reference - actual user creation will be done via auth API

-- Note: These users should be created via Supabase Auth with password '12345'
-- Then their profiles will be inserted here with specific UUIDs

-- Test user data (replace UUIDs with actual auth.users IDs after creation)
-- Example structure for when auth users are created:

/*
INSERT INTO users (id, username, display_name, avatar_url, status, status_text, status_color) VALUES
  -- Alice (primary test user)
  ('550e8400-e29b-41d4-a716-446655440001', 'alice', 'Alice Johnson', 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice', 'online', 'Building AIGM!', '#22c55e'),
  
  -- Bob (Alice's friend)
  ('550e8400-e29b-41d4-a716-446655440002', 'bob', 'Bob Smith', 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob', 'online', 'Ready to chat', '#3b82f6'),
  
  -- Charlie (additional test user)
  ('550e8400-e29b-41d4-a716-446655440003', 'charlie', 'Charlie Brown', 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie', 'away', 'In a meeting', '#f59e0b'),
  
  -- Diana (additional test user)
  ('550e8400-e29b-41d4-a716-446655440004', 'diana', 'Diana Prince', 'https://api.dicebear.com/7.x/avataaars/svg?seed=diana', 'idle', 'Working on code', '#8b5cf6'),
  
  -- Eve (additional test user)
  ('550e8400-e29b-41d4-a716-446655440005', 'eve', 'Eve Williams', 'https://api.dicebear.com/7.x/avataaars/svg?seed=eve', 'online', 'Testing features', '#ef4444');

-- Create friendship between Alice and Bob (accepted)
INSERT INTO friendships (requester_id, addressee_id, status, action_user_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'accepted', '550e8400-e29b-41d4-a716-446655440002');

-- Create DM conversation between Alice and Bob
INSERT INTO dm_conversations (id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001');

INSERT INTO dm_conversation_participants (conversation_id, user_id) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001'),
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

-- Create Alice's personal server
INSERT INTO servers (id, name, description, owner_id, invite_code) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'Alice''s Server', 'Welcome to Alice''s personal server!', '550e8400-e29b-41d4-a716-446655440001', 'ALICE123');

-- Add Alice as server member (owner)
INSERT INTO server_members (server_id, user_id, role) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'owner');

-- Create default rooms in Alice's server
INSERT INTO rooms (id, name, description, server_id, position) VALUES
  ('880e8400-e29b-41d4-a716-446655440001', 'general', 'General discussion', '770e8400-e29b-41d4-a716-446655440001', 0),
  ('880e8400-e29b-41d4-a716-446655440002', 'announcements', 'Server announcements', '770e8400-e29b-41d4-a716-446655440001', 1),
  ('880e8400-e29b-41d4-a716-446655440003', 'random', 'Random chatter', '770e8400-e29b-41d4-a716-446655440001', 2);

-- Create some sample messages (DM between Alice and Bob)
INSERT INTO messages (content, author_id, dm_conversation_id) VALUES
  ('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hey Bob! How are you doing?"}]}]}', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001'),
  ('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hi Alice! I''m doing great. Excited to test this new chat app!"}]}]}', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001'),
  ('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Awesome! The TipTap editor is working perfectly. We can even add "},{"type":"text","marks":[{"type":"bold"}],"text":"bold text"},{"type":"text","text":" and "},{"type":"text","marks":[{"type":"italic"}],"text":"italic text"},{"type":"text","text":"!"}]}]}', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001');

-- Create sample messages in server room
INSERT INTO messages (content, author_id, room_id) VALUES
  ('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Welcome to my server! 🎉"}]}]}', '550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001'),
  ('{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is where we can chat about anything!"}]}]}', '550e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001');

-- Add some pending friend requests for testing
INSERT INTO friendships (requester_id, addressee_id, status, action_user_id) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'pending', '550e8400-e29b-41d4-a716-446655440003'),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'pending', '550e8400-e29b-41d4-a716-446655440001');
*/

-- Function to create test users via API (for reference)
-- This will be called from the backend API after auth users are created

CREATE OR REPLACE FUNCTION create_test_user_profile(
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
  INSERT INTO users (id, username, display_name, avatar_url, status, status_text, status_color)
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

-- Function to create friendship between users
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
  RETURNING id INTO friendship_id;
  
  RETURN friendship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create DM conversation between two users
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