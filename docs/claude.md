# AIGM (AI Generative Messaging) - Project Rules & Guidelines

## Project Overview

Building a modern, real-time messaging platform with React frontend, FastAPI backend, Supabase for auth/database/realtime, and Cloudflare R2 for file storage.

**URL**: aigm.world  
**Files subdomain**: files.aigm.world  
**Target**: Production-ready Phase 1 messaging platform

## Core Architecture Rules

### Frontend

- **React 18** with TypeScript
- **Tailwind CSS** only - NO custom CSS files
- **React Icons** for all iconography
- **TipTap** for rich text editing
- **Vite** for build tooling
- **Supabase React SDK** for auth/database

### Backend

- **FastAPI** with Python 3.11+
- **Supabase** for database, auth, and real-time
- **Cloudflare R2** for file storage
- **Pydantic** for data validation
- **Pytest** for testing

### Database

- **PostgreSQL** via Supabase
- **Row Level Security (RLS)** enabled on all tables
- See `architecture.md` for complete schema
- **Test data**: Alice & Bob users (friends by default), password '12345'

### Development Environment

- **Windows 11** with **PowerShell** primary
- **WSL2** available but PowerShell and venv preferred only use wsl if you absolutely have to
- **Python venv** for package management
- **Local Docker Compose** for development
- **Claude Code** for initial setup and heavy lifting
- **Windsurf/Cascade** for refinements and debugging

## Test-Driven Development (TDD)

### Priority Order

1. **User search API** - Foundation for friend requests
2. **Friend request workflow** - Send, accept, block functionality
3. **Real-time messaging** - Message delivery and display
4. **Server/room management** - Create, join, manage servers
5. **File uploads** - R2 integration (Phase 1 end)

### Testing Requirements

- **pytest** for all backend API tests
- **Vitest + Testing Library** for frontend components
- **Integration tests** for complete workflows
- **Real-time tests** for message delivery
- All tests must pass before feature completion

## Code Quality Standards

### General Rules

- **No placeholders or temporary code** - Build production-ready features
- **Read from database** - All data must come from PostgreSQL via Supabase
- **Proper error handling** - Graceful degradation and user feedback
- **TypeScript strict mode** - No `any` types
- **ESLint + Prettier** - Consistent code formatting

### API Design

- **RESTful endpoints** with proper HTTP status codes
- **Pydantic models** for request/response validation
- **Comprehensive documentation** with FastAPI auto-docs
- **Rate limiting** and security best practices
- **Proper logging** for debugging and monitoring

### Frontend Standards

- **Component composition** over inheritance
- **Custom hooks** for business logic
- **Proper state management** with React state/context
- **Responsive design** - Mobile-first approach
- **Accessibility** - ARIA labels and semantic HTML

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

## Deployment Strategy

### Local Development

- **Docker Compose** with hot reload
- **Supabase Cloud** connection
- **Local file storage** for development

### Production

- **Cloudflare Pages** for React frontend
- **Cloudflare Workers/Docker** for FastAPI backend
- **Environment variables** via Cloudflare dashboard
- **Automated deployments** from Git

## Phase 1 MVP Features

### Core Messaging

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

## Future Phases (Reference Only)

### Phase 2: Spaces

- Video conference rooms
- AI agent integration via HyperMode
- Collaborative music creation with Tone.js
- 3D visual spaces with React Three Fiber
- Coding sandbox environments

### Phase 3: Mobile & Desktop

- React Native for iOS/Android
- Electron for desktop apps
- Cross-platform synchronization

## Critical Rules for AI Assistants

### Claude Code Rules

- **WSL2 environment** - Use Linux commands in WSL2 context
- **PowerShell integration** - Bridge between Windows and WSL2
- **venv management** - Create and activate Python virtual environments
- **Docker familiarity** - Set up development containers
- **File structure** - Organize code in logical directories

### Windsurf/Cascade Rules

- **Incremental changes** - Small, testable modifications
- **Error debugging** - Systematic troubleshooting approach
- **Code review** - Check for bugs and improvements
- **Testing integration** - Run and validate tests
- **UI/UX refinement** - Polish user interface details

### Communication Standards

- **Question everything** - Challenge assumptions and suggest improvements
- **Industry research** - Reference current best practices
- **Performance focus** - Optimize for speed and scalability
- **Security awareness** - Implement proper auth and data protection
- **Documentation** - Explain complex decisions and trade-offs

## Success Metrics

### Technical

- **<100ms** message delivery time
- **>99%** uptime in production
- **<2s** page load times
- **Zero** security vulnerabilities
- **100%** test coverage for critical paths

### User Experience

- **Intuitive navigation** - New users can send messages in <2 minutes
- **Responsive design** - Works perfectly on all screen sizes
- **Real-time updates** - Messages appear instantly for all users
- **Error handling** - Graceful degradation with helpful messages

## Reference Documents

- `architecture.md` - Technical architecture and database schema
- `api-specification.md` - Complete API documentation
- `testing-guide.md` - Testing strategies and examples
- `deployment-guide.md` - Production deployment instructions
