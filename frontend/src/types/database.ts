export interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  custom_url?: string;
  status: 'online' | 'idle' | 'away' | 'offline';
  status_text?: string;
  status_color: string;
  created_at: string;
  updated_at: string;
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  invite_code?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface ServerMember {
  id: string;
  server_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  server_id: string;
  room_type: 'text' | 'voice' | 'video';
  position: number;
  created_at: string;
  updated_at: string;
}

export interface DMConversation {
  id: string;
  created_at: string;
  updated_at: string;
  participants: DMConversationParticipant[];
}

export interface DMConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  content: any; // TipTap JSON content
  author_id: string;
  room_id?: string;
  dm_conversation_id?: string;
  space_id?: string;
  created_at: string;
  updated_at: string;
  author?: User;
  reactions?: MessageReaction[];
  files?: File[];
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  action_user_id: string;
  created_at: string;
  updated_at: string;
  requester?: User;
  addressee?: User;
}

export interface File {
  id: string;
  filename: string;
  original_name: string;
  file_type: string;
  file_size: number;
  url: string;
  uploader_id: string;
  message_id?: string;
  created_at: string;
}