# AIGM Technical Architecture

## System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   FastAPI       │    │   Supabase      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ - UI Components │    │ - REST API      │    │ - PostgreSQL    │
│ - State Mgmt    │    │ - Business Logic│    │ - Auth          │
│ - Real-time     │    │ - Validation    │    │ - Real-time     │
│ - TipTap Editor │    │ - File Handling │    │ - RLS Policies  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Cloudflare R2  │
                    │  (File Storage) │
                    │                 │
                    │ - Images        │
                    │ - Documents     │
                    │ - Media Files   │
                    └─────────────────┘
```

## Frontend Architecture (React)

### Tech Stack
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling (NO custom CSS)
- **React Icons** for all icons
- **TipTap** for rich text editing
- **Supabase JS Client** for backend communication

### Component Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── Avatar.tsx
│   ├── layout/          # Layout components
│   │   ├── Sidebar.tsx
│   │   ├── ServerBar.tsx
│   │   ├── InfoBar.tsx
│   │   └── MembersList.tsx
│   ├── messaging/       # Chat components
│   │   ├── MessageBox.tsx
│   │   ├── MessageComposer.tsx
│   │   ├── MessageBubble.tsx
│   │   └── MessageReactions.tsx
│   ├── friends/         # Friend system
│   │   ├── FriendsList.tsx
│   │   ├── FriendRequest.tsx
│   │   └── UserSearch.tsx
│   └── auth/            # Authentication
│       ├── LoginForm.tsx
│       ├── SignupForm.tsx
│       └── OAuthButtons.tsx
├── hooks/               # Custom React hooks
│   ├── useAuth.ts
│   ├── useMessages.ts
│   ├── useRealtime.ts
│   └── useFriends.ts
├── contexts/            # React contexts
│   ├── AuthContext.tsx
│   ├── AppStateContext.tsx
│   └── ThemeContext.tsx
├── services/            # API services
│   ├── supabase.ts
│   ├── auth.ts
│   ├── messages.ts
│   └── files.ts
├── types/               # TypeScript types
│   ├── auth.ts
│   ├── messages.ts
│   └── database.ts
└── utils/               # Utility functions
    ├── formatters.ts
    ├── validators.ts
    └── constants.ts
```

### State Management Strategy
- **React Context** for global state (auth, app state)
- **useState/useReducer** for component state
- **Custom hooks** for business logic and API calls
- **Supabase Realtime** for real-time state synchronization

### Real-time Implementation
```typescript
// Real-time message subscription
const { data: messages, error } = useSupabaseSubscription(
  'messages',
  `room_id=eq.${roomId}`,
  { event: 'INSERT' }
);

// Real-time user status updates
const { data: users } = useSupabaseSubscription(
  'users',
  `id=in.(${friendIds.join(',')})`,
  { event: 'UPDATE' }
);
```

## Backend Architecture (FastAPI)

### Tech Stack
- **FastAPI** with Python 3.11+
- **Pydantic** for data validation
- **Supabase Python Client** for database operations
- **Pytest** for testing
- **Uvicorn** ASGI server

### Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app setup
│   ├── config.py            # Environment configuration
│   ├── dependencies.py      # Dependency injection
│   ├── api/
│   │   ├── __init__.py
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── users.py     # User management
│   │   │   ├── messages.py  # Messaging endpoints
│   │   │   ├── servers.py   # Server management
│   │   │   ├── rooms.py     # Room management
│   │   │   ├── friends.py   # Friend system
│   │   │   └── files.py     # File upload/download
│   │   └── deps.py          # Route dependencies
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py          # User Pydantic models
│   │   ├── message.py       # Message models
│   │   ├── server.py        # Server models
│   │   └── friendship.py    # Friendship models
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication logic
│   │   ├── message.py       # Message business logic
│   │   ├── friend.py        # Friend system logic
│   │   ├── server.py        # Server management
│   │   └── file.py          # File handling
│   ├── db/
│   │   ├── __init__.py
│   │   ├── supabase.py      # Supabase client setup
│   │   ├── queries.py       # Database queries
│   │   └── migrations/      # SQL migration files
│   └── utils/
│       ├── __init__.py
│       ├── security.py      # Security utilities
│       ├── validators.py    # Custom validators
│       └── exceptions.py    # Custom exceptions
├── tests/
│   ├── __init__.py
│   ├── conftest.py          # Pytest configuration
│   ├── test_auth.py         # Authentication tests
│   ├── test_messages.py     # Message API tests
│   ├── test_friends.py      # Friend system tests
│   ├── test_realtime.py     # Real-time functionality tests
│   └── fixtures/            # Test data fixtures
├── requirements.txt
├── pyproject.toml
└── Dockerfile
```

### API Design Principles
- **RESTful endpoints** with clear resource naming
- **Consistent response format** with proper HTTP status codes
- **Comprehensive validation** using Pydantic models
- **Error handling** with detailed error messages
- **Rate limiting** for security and performance
- **API documentation** auto-generated by FastAPI

### Example API Endpoints
```python
# User search for friend requests
GET /api/users/search?q=alice&limit=10

# Friend request management
POST /api/friends/request
PUT /api/friends/{friendship_id}/accept
PUT /api/friends/{friendship_id}/block

# Messaging
GET /api/rooms/{room_id}/messages?limit=50&before=timestamp
POST /api/rooms/{room_id}/messages
POST /api/messages/{message_id}/reactions

# Server management
POST /api/servers
GET /api/servers/{server_id}/members
POST /api/servers/{server_id}/rooms
```

### Database Integration
```python
# Supabase client with RLS
from supabase import create_client

supabase = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
)

# Example query with RLS
async def get_user_messages(user_id: str, room_id: str):
    response = supabase.table('messages')\
        .select('*, users(username, avatar_url)')\
        .eq('room_id', room_id)\
        .order('created_at', desc=True)\
        .limit(50)\
        .execute()
    return response.data
```

## Database Architecture (Supabase/PostgreSQL)

### Core Tables Design

#### User Profiles Table
```sql
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
```

#### Messages Table (with TipTap JSON)
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content JSONB NOT NULL, -- TipTap rich text JSON
  author_id UUID REFERENCES users(id) NOT NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  dm_conversation_id UUID REFERENCES dm_conversations(id) ON DELETE CASCADE,
  space_id UUID, -- Future: references spaces(id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Friendships Table (with blocking support)
```sql
CREATE TABLE friendships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES users(id) NOT NULL,
  addressee_id UUID REFERENCES users(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, blocked
  action_user_id UUID REFERENCES users(id) NOT NULL, -- who took last action
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Row Level Security (RLS) Policies
```sql
-- Users can search all profiles for friend requests
CREATE POLICY "Users can search all profiles" ON user_profiles 
FOR SELECT USING (true);

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

-- Users can view friendships they're part of
CREATE POLICY "Users can view own friendships" ON friendships 
FOR SELECT USING (
  requester_id = auth.uid() OR addressee_id = auth.uid()
);
```

### Database Performance Optimizations
```sql
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
```

## Real-time Architecture (Supabase Realtime)

### Real-time Subscriptions Strategy
```typescript
// Message delivery in rooms
const messageSubscription = supabase
  .channel(`room-${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `room_id=eq.${roomId}`
  }, handleNewMessage)
  .subscribe();

// User status updates for friends
const statusSubscription = supabase
  .channel('user-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'users',
    filter: `id=in.(${friendIds.join(',')})`
  }, handleStatusUpdate)
  .subscribe();

// Friend request notifications
const friendRequestSubscription = supabase
  .channel(`user-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'friendships',
    filter: `addressee_id=eq.${userId}`
  }, handleFriendRequest)
  .subscribe();
```

### Message Delivery Flow
1. **User types message** → TipTap editor captures rich text
2. **Submit to API** → FastAPI validates and stores in database
3. **Database trigger** → PostgreSQL INSERT triggers Supabase Realtime
4. **Real-time broadcast** → All subscribed clients receive message
5. **UI update** → React components re-render with new message
6. **Acknowledgment** → Optional read receipts and delivery status

## File Storage Architecture (Cloudflare R2)

### File Upload Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   FastAPI   │    │ Cloudflare  │    │  Database   │
│             │    │             │    │     R2      │    │             │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │                  │
       │ 1. Upload file   │                  │                  │
       ├─────────────────►│                  │                  │
       │                  │ 2. Validate      │                  │
       │                  │    & generate    │                  │
       │                  │    unique name   │                  │
       │                  │ 3. Upload to R2  │                  │
       │                  ├─────────────────►│                  │
       │                  │ 4. Get R2 URL    │                  │
       │                  │◄─────────────────┤                  │
       │                  │ 5. Store metadata│                  │
       │                  ├─────────────────────────────────────►│
       │ 6. Return URL    │                  │                  │
       │◄─────────────────┤                  │                  │
```

### File Types and Limits
```python
ALLOWED_FILE_TYPES = {
    'images': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    'documents': ['pdf', 'doc', 'docx', 'txt', 'md'],
    'media': ['mp4', 'webm', 'mp3', 'wav']
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_FILES_PER_MESSAGE = 10
```

### R2 Integration
```python
import boto3
from botocore.config import Config

r2 = boto3.client(
    's3',
    endpoint_url=f'https://{settings.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com',
    aws_access_key_id=settings.CLOUDFLARE_ACCESS_KEY_ID,
    aws_secret_access_key=settings.CLOUDFLARE_SECRET_ACCESS_KEY,
    config=Config(signature_version='s3v4'),
    region_name='auto'
)

async def upload_file(file: UploadFile, user_id: str) -> str:
    file_key = f"{user_id}/{uuid4()}/{file.filename}"
    
    r2.upload_fileobj(
        file.file,
        settings.CLOUDFLARE_BUCKET_NAME,
        file_key,
        ExtraArgs={'ContentType': file.content_type}
    )
    
    return f"https://{settings.CLOUDFLARE_BUCKET_URL}/{file_key}"
```

## Security Architecture

### Authentication Flow
1. **OAuth/Email login** → Supabase Auth handles token generation
2. **JWT validation** → FastAPI validates tokens on each request
3. **User context** → Extract user ID from validated token
4. **RLS enforcement** → Database policies ensure data isolation

### Security Best Practices
- **Row Level Security** on all database tables
- **Input validation** using Pydantic models
- **Rate limiting** on all API endpoints
- **CORS configuration** for allowed origins
- **File upload scanning** for malicious content
- **Content Security Policy** headers
- **HTTPS only** in production

### Example Security Implementation
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
import jwt

security = HTTPBearer()

async def get_current_user(token: str = Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials, 
            settings.SUPABASE_JWT_SECRET, 
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401)
        return user_id
    except jwt.PyJWTError:
        raise HTTPException(status_code=401)
```

## Performance Optimization

### Database Optimization
- **Connection pooling** for database connections
- **Query optimization** with proper indexes
- **Pagination** for large data sets
- **Caching** frequently accessed data
- **Database migrations** for schema changes

### Frontend Optimization
- **Code splitting** with React.lazy()
- **Image optimization** with lazy loading
- **Bundle optimization** with Vite
- **Service worker** for offline functionality
- **Virtual scrolling** for large message lists

### Real-time Optimization
- **Connection management** - Reuse WebSocket connections
- **Subscription batching** - Combine multiple subscriptions
- **Message queuing** - Handle burst message delivery
- **Conflict resolution** - Handle concurrent updates

## Deployment Architecture

### Development Setup
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - VITE_SUPABASE_URL=${SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
    volumes:
      - ./frontend:/app
      - /app/node_modules

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - CLOUDFLARE_ACCOUNT_ID=${CLOUDFLARE_ACCOUNT_ID}
    volumes:
      - ./backend:/app
    depends_on:
      - frontend
```

### Production Deployment
- **Cloudflare Pages** for React frontend with automatic deployments
- **Cloudflare Workers** or Docker containers for FastAPI backend
- **Environment variables** managed through Cloudflare dashboard
- **CDN optimization** for static assets
- **Load balancing** for high availability
- **Monitoring** with application performance monitoring (APM)

## Testing Strategy

### Unit Testing
- **Backend**: pytest with fixtures for database testing
- **Frontend**: Vitest + Testing Library for component testing
- **Services**: Mock external dependencies (Supabase, R2)

### Integration Testing
- **API endpoints**: Full request/response cycle testing
- **Real-time**: WebSocket connection and message delivery
- **File uploads**: Complete upload workflow
- **Authentication**: OAuth and session management

### End-to-End Testing
- **User workflows**: Registration → friend request → messaging
- **Cross-browser testing**: Chrome, Firefox, Safari, Edge
- **Mobile responsiveness**: Touch interactions and layouts
- **Performance testing**: Load testing for concurrent users

This architecture provides a scalable, secure, and maintainable foundation for the AIGM messaging platform with clear separation of concerns and modern best practices.