# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AIGM v2 is a modern, real-time messaging platform with Discord-like features built with cutting-edge web technologies. The project aims for a production-ready Phase 1 MVP with:

- **URL**: aigm.world (production)
- **Files subdomain**: files.aigm.world  
- **Target**: Production-ready Phase 1 messaging platform
- **Environment**: Windows 11 with PowerShell (NO WSL2)
- **Development Flow**: Claude Code for setup/heavy lifting → Windsurf/Cascade for refinements

## Development Commands

### Backend (FastAPI)
```powershell
cd backend
# IMPORTANT: Use existing venv - DO NOT create new one
.\venv\Scripts\Activate.ps1  # Windows PowerShell activation
pip install -r requirements.txt
uvicorn app.main:app --reload  # Start dev server on port 8000
```

### Frontend (React + Vite)
```powershell
cd frontend
npm install
npm run dev          # Start dev server on port 3000
npm run build        # Build for production (tsc -b && vite build)
npm run lint         # Run ESLint
npm test             # Run tests with Vitest
npm run test:ui      # Interactive test UI
npm run test:coverage # Run tests with coverage
```

### Testing - Test-Driven Development (TDD)
```powershell
# Backend tests - PRIORITY ORDER for Phase 0.5:
cd backend
.\venv\Scripts\Activate.ps1

# 1. CRITICAL: User Search API (foundation for everything)
pytest tests/test_user_search.py -v --cov=app

# 2. Friend Request Workflow  
pytest tests/test_friend_workflow.py -v

# 3. Real-time Message Delivery
pytest tests/test_realtime_messaging.py -v

# 4. Complete test suite
pytest tests/ -v --cov=app

# Frontend tests  
cd frontend
npm test             # All tests
npm run test:ui      # Interactive test UI
npm run test:coverage # Coverage report
```

### Linting and Type Checking
```powershell
# Frontend linting and type checking
cd frontend
npm run lint         # ESLint
npx tsc --noEmit     # TypeScript checking

# Backend formatting (if needed)
cd backend
.\venv\Scripts\Activate.ps1
black .              # Code formatting (dev dependency)
```

## Architecture Overview

### Tech Stack Requirements
- **Frontend**: React 18 + TypeScript + Tailwind CSS (NO custom CSS) + TipTap + Vite
- **Backend**: FastAPI + Python 3.10 + Supabase + Cloudflare R2
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Real-time**: Supabase Realtime WebSockets
- **Testing**: pytest (backend) + Vitest + Testing Library (frontend)

### Core Patterns
- **Service Layer Architecture**: All business logic in dedicated service classes (`ConversationService`, `MessageService`, etc.)
- **Dependency Injection**: FastAPI dependencies for auth, database access, and validation
- **Clean API Design**: RESTful endpoints with consistent error handling
- **Real-time First**: Supabase WebSocket integration for live updates
- **Test-Driven Development**: RED → GREEN → REFACTOR cycle

### Key Components

#### Backend Structure
- `app/main.py` - FastAPI application setup and middleware
- `app/dependencies.py` - Shared dependencies (auth, database access)
- `app/services/` - Business logic layer (always use these, never direct DB access)
- `app/api/routes/` - REST API endpoints
- `app/models/` - Pydantic data models for validation

#### Frontend Structure  
- `src/contexts/AuthContext.tsx` - Global auth state management
- `src/services/` - API communication layer (mirrors backend services)
- `src/components/` - Reusable UI components
- `src/hooks/` - Custom React hooks for reusable logic

### Authentication Flow
- **Frontend**: React Context manages auth state with Supabase client
- **Backend**: JWT validation via `get_current_user` dependency
- **Database**: Row Level Security (RLS) policies enforce permissions
- **Development**: Mock user system with hardcoded Alice/Bob users for testing

### Database Integration
- **Dual Supabase Client Pattern**: Service role (backend) + Anonymous role (frontend)
- **Real-time Subscriptions**: WebSocket-based live updates via Supabase
- **Rich Content**: TipTap JSON stored in PostgreSQL with server-side sanitization
- **Permission-first Design**: Friend relationships required for DM conversations
- **Test Data**: Alice & Bob users (friends by default), password '12345'
- **Table Focus**: Work with `user_profiles` table (NOT `users` table)

### Development Patterns & Quality Standards

#### Working with Services
Always use service layer - never direct database access:
```python
# Correct
conversation_service = ConversationService(supabase)
result = await conversation_service.create_dm_conversation(user_id, friend_id)

# Incorrect  
result = supabase.table('conversations').insert(...)
```

#### Code Quality Rules
- **No placeholders or temporary code** - Build production-ready features
- **TypeScript strict mode** - No `any` types allowed
- **Tailwind CSS ONLY** - NO custom CSS files
- **Component composition** over inheritance
- **Responsive design** - Mobile-first approach
- **Accessibility** - ARIA labels and semantic HTML

#### Error Handling
Use custom exception classes defined in `app/utils/exceptions.py`:
- `ValidationError` for input validation
- `NotFoundError` for missing resources  
- `PermissionError` for authorization failures

#### Testing Approach - TDD Priority Order
1. **User Search API** - Foundation for friend requests (CRITICAL)
2. **Friend Request Workflow** - Send, accept, block functionality
3. **Real-time Message Delivery** - Core messaging functionality
4. **Server/Room Management** - Server creation and room management
5. **File Upload Integration** - R2 file storage (Phase 1 end)

Use existing test users (Alice: user_123, Bob: user_456) and real database integration testing.

### File Upload & Storage
- **Cloudflare R2** integration via `FileService`
- **File types**: Images, documents, media files
- **Size limit**: 50MB per file
- **Security**: File type validation and malware scanning
- **Server-side validation** and sanitization
- **Async upload handling** with progress indicators

### Real-time Features
- Message subscriptions via `useRealtimeMessages` hook
- Table-level change detection with INSERT/UPDATE/DELETE triggers
- Optimistic UI updates in React components
- **Performance target**: <100ms message delivery time

## Environment Configuration

### Required Environment Variables
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=aigm-files
CLOUDFLARE_BUCKET_URL=https://files.aigm.world

# FastAPI
SECRET_KEY=your-secret-key
ENVIRONMENT=development
DEBUG=true
```

## Phase 1 MVP Features Status

### Core Messaging (Current Focus)
- [x] User registration/login with email + OAuth (Google/GitHub)
- [x] Rich text messaging with TipTap editor
- [x] Real-time message delivery via Supabase Realtime
- [x] Friend system with search, request, accept/block
- [x] Single server per user with custom rooms
- [x] Direct messaging between friends
- [x] User status indicators (online/idle/away/custom)
- [x] Message reactions with emojis
- [x] File uploads to R2 (Phase 1 end)

### UI/UX Requirements
- **Responsive design** - Works on mobile and desktop
- **Three-sidebar layout** - Servers | Rooms/Friends | Members
- **Collapsible sidebars** - Save space on mobile
- **Message pagination** - Load 50 messages at a time
- **Typing indicators** - Show when users are typing
- **Timestamp grouping** - Show time for messages 2+ hours apart

## Development Notes

### PowerShell Environment
- **Windows 11 with PowerShell** - NO WSL2 usage allowed
- **Python 3.10** - Existing venv in backend/venv/
- **Activation**: `.\backend\venv\Scripts\Activate.ps1`
- Use PowerShell commands and Windows-style paths

### Common Issues & Solutions
- Always activate Python venv before backend work
- Ensure Supabase credentials are properly configured
- Use the mock users (Alice/Bob) for development and testing
- Check `backend/validate_setup.py` if having connection issues
- Backend must read from `user_profiles` table, not `users`

### Database Schema Notes
Key tables: `user_profiles`, `conversations`, `conversation_participants`, `messages`
- Messages store rich TipTap JSON content
- Conversations can be DM or group/server-based
- Comprehensive foreign key relationships with cascade delete
- Row Level Security (RLS) policies on all tables
- Test data includes Alice & Bob users (password: '12345')

## Reference Documentation
- `/docs/claude.md` - Complete project rules and guidelines
- `/docs/architecture.md` - Technical architecture and database schema
- `/docs/Phase-1_development-guide` - Step-by-step development guide
- `/docs/testing-strategy.md` - TDD methodology and test examples