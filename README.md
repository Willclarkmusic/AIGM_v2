# 🚀 AIGM v2 - AI Generative Messaging Platform

> A modern, real-time messaging platform with Discord-like features, built with cutting-edge web technologies.

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-green.svg)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-blue.svg)](https://tailwindcss.com/)

## 🌟 Platform Overview

AIGM v2 is a next-generation messaging platform that combines the familiar Discord-like server/channel structure with modern AI capabilities and real-time collaboration features. Built for developers, teams, and communities who want a powerful, customizable communication platform.

### 🎯 Core Goals

- **Real-time Communication**: Instant messaging with WebSocket-powered live updates
- **Rich Content Support**: Advanced text editing with TipTap, file sharing, and media support
- **Scalable Architecture**: Modern microservices approach with cloud-native infrastructure
- **Developer-First**: Comprehensive APIs, extensive testing, and clean architecture
- **Community-Focused**: Server/room structure for organized group communication
- **AI-Enhanced**: Future-ready platform with AI integration capabilities

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │    │   FastAPI       │    │   Supabase      │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
│                 │    │                 │    │                 │
│ • UI Components │    │ • REST API      │    │ • PostgreSQL    │
│ • State Mgmt    │    │ • Business Logic│    │ • Auth System   │
│ • Real-time     │    │ • Validation    │    │ • Real-time     │
│ • TipTap Editor │    │ • File Handling │    │ • RLS Policies  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  Cloudflare R2  │
                    │  (File Storage) │
                    │                 │
                    │ • Images        │
                    │ • Documents     │
                    │ • Media Files   │
                    └─────────────────┘
```

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript for type-safe development
- **Vite** for lightning-fast development and optimized builds
- **Tailwind CSS 4.1** for utility-first styling (no custom CSS)
- **TipTap** for rich text editing and content creation
- **Supabase JS Client** for seamless backend integration
- **React Icons & Lucide React** for consistent iconography
- **Headless UI** for accessible component primitives

### Backend
- **FastAPI** with Python 3.10 for high-performance APIs
- **Supabase** for database, authentication, and real-time features
- **Cloudflare R2** for scalable file storage
- **Pydantic** for data validation and serialization
- **pytest** with comprehensive testing suite
- **uvicorn** for ASGI server deployment

### Infrastructure
- **PostgreSQL** via Supabase for robust data storage
- **Real-time WebSockets** for instant messaging
- **Row Level Security (RLS)** for data protection
- **OAuth Integration** (Google, GitHub)
- **Docker** support for containerized deployment

## 📁 Project Structure

```
AIGM_v2/
├── 📁 frontend/          # React TypeScript application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── hooks/        # Custom React hooks
│   │   ├── utils/        # Utility functions
│   │   └── types/        # TypeScript definitions
│   ├── package.json      # Frontend dependencies
│   └── .env.example      # Frontend environment template
├── 📁 backend/           # FastAPI Python application
│   ├── app/
│   │   ├── api/          # API route handlers
│   │   ├── core/         # Core functionality
│   │   ├── models/       # Database models
│   │   └── services/     # Business logic
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Backend environment template
├── 📁 tests/             # Integration and E2E tests
├── docker-compose.yml    # Local development setup
└── README.md            # This file
```

## 🎯 Current Progress

### ✅ Completed Features
- [x] **Infrastructure Setup**: Complete development environment with Docker
- [x] **Authentication System**: Supabase Auth with OAuth providers
- [x] **Database Schema**: Comprehensive schema for users, servers, rooms, messages
- [x] **Frontend Foundation**: React app with Tailwind, routing, and components
- [x] **Backend API**: FastAPI with Supabase integration and file upload
- [x] **Real-time Messaging**: WebSocket implementation for live chat
- [x] **Testing Framework**: Comprehensive test suite with pytest and Vitest
- [x] **User Profiles**: Avatar, status, and profile management
- [x] **Server Management**: Create/join servers with invite codes
- [x] **Room System**: Channel-like rooms within servers

### 🚧 In Development
- [ ] **Message Threading**: Reply and thread functionality
- [ ] **File Sharing**: Enhanced file upload with previews
- [ ] **User Presence**: Online/offline status indicators
- [ ] **Notifications**: Real-time notification system
- [ ] **Mobile Responsiveness**: Optimized mobile experience

### 🔮 Planned Features
- [ ] **AI Integration**: Smart message suggestions and summaries
- [ ] **Voice/Video**: WebRTC integration for voice channels
- [ ] **Bot Framework**: Custom bot development platform
- [ ] **Plugin System**: Extensible architecture for third-party integrations
- [ ] **Advanced Permissions**: Granular role-based access control

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Supabase account
- Cloudflare R2 account (optional)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd AIGM_v2
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your Supabase public key
```

### 4. Database Setup
```bash
cd ../backend
python setup_database.py
```

### 5. Start Development Servers
```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit `http://localhost:3000` to see the application! 🎉

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## 📚 Documentation

Detailed documentation is available in the respective directories:
- [Frontend Documentation](./frontend/README.md)
- [Backend Documentation](./backend/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by Discord's excellent UX patterns
- Powered by the amazing Supabase platform

---

**Ready to revolutionize team communication? Let's build the future together!** 🚀
