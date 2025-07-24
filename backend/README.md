# 🚀 AIGM v2 Backend - FastAPI Server

> High-performance Python backend powering the AIGM v2 messaging platform with FastAPI, Supabase, and modern async architecture.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.6-green.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10-blue.svg)](https://python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.17.0-green.svg)](https://supabase.com/)
[![pytest](https://img.shields.io/badge/pytest-8.3.4-orange.svg)](https://pytest.org/)

## 🏗️ Architecture Overview

The backend follows a clean, modular architecture with clear separation of concerns:

```
backend/
├── 📁 app/
│   ├── 📁 api/              # API route handlers
│   │   ├── v1/
│   │   │   ├── auth.py      # Authentication endpoints
│   │   │   ├── users.py     # User management
│   │   │   ├── servers.py   # Server operations
│   │   │   ├── rooms.py     # Room management
│   │   │   ├── messages.py  # Message handling
│   │   │   └── files.py     # File upload/download
│   │   └── deps.py          # Dependency injection
│   ├── 📁 core/             # Core functionality
│   │   ├── config.py        # Configuration management
│   │   ├── security.py      # Security utilities
│   │   ├── database.py      # Database connection
│   │   └── exceptions.py    # Custom exceptions
│   ├── 📁 models/           # Pydantic models
│   │   ├── user.py          # User data models
│   │   ├── server.py        # Server data models
│   │   ├── message.py       # Message data models
│   │   └── base.py          # Base model classes
│   ├── 📁 services/         # Business logic layer
│   │   ├── auth_service.py  # Authentication logic
│   │   ├── user_service.py  # User operations
│   │   ├── server_service.py # Server management
│   │   ├── message_service.py # Message processing
│   │   └── file_service.py  # File handling
│   ├── 📁 utils/            # Utility functions
│   │   ├── supabase.py      # Supabase client
│   │   ├── storage.py       # File storage utilities
│   │   └── validators.py    # Data validation
│   └── main.py              # FastAPI application entry
├── 📁 tests/                # Comprehensive test suite
│   ├── conftest.py          # Test configuration
│   ├── test_auth.py         # Authentication tests
│   ├── test_users.py        # User endpoint tests
│   ├── test_servers.py      # Server functionality tests
│   └── test_messages.py     # Message handling tests
├── requirements.txt         # Python dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

## 🚀 Tech Stack

### Core Framework
- **FastAPI 0.115.6**: Modern, fast web framework with automatic API docs
- **Python 3.10**: Latest stable Python with type hints and performance improvements
- **Uvicorn**: Lightning-fast ASGI server for production deployment
- **Pydantic 2.11+**: Data validation and serialization with type safety

### Database & Storage
- **Supabase 2.17.0**: PostgreSQL database with real-time capabilities
- **Cloudflare R2**: S3-compatible object storage for files and media
- **boto3**: AWS SDK for seamless cloud storage integration

### Authentication & Security
- **Supabase Auth**: Built-in authentication with OAuth providers
- **python-jose**: JWT token handling and cryptographic operations
- **Row Level Security (RLS)**: Database-level security policies

### Testing & Quality
- **pytest 8.3.4**: Comprehensive testing framework
- **pytest-asyncio**: Async test support
- **pytest-cov**: Code coverage reporting
- **httpx**: Modern HTTP client for API testing

## 🎯 Key Features

### ✅ Implemented
- **RESTful API**: Complete CRUD operations for all entities
- **Real-time WebSockets**: Live messaging and presence updates
- **File Upload/Download**: Secure file handling with Cloudflare R2
- **User Authentication**: JWT-based auth with OAuth integration
- **Server Management**: Create, join, and manage Discord-like servers
- **Room System**: Channel-based communication within servers
- **Message Threading**: Reply and thread functionality
- **User Profiles**: Avatar, status, and profile customization
- **Comprehensive Testing**: 90%+ test coverage with unit and integration tests

### 🚧 In Development
- **Message Reactions**: Emoji reactions and custom reactions
- **Advanced Permissions**: Role-based access control system
- **Message Search**: Full-text search across messages and files
- **Rate Limiting**: API rate limiting and abuse prevention

### 🔮 Planned
- **AI Integration**: Message summarization and smart suggestions
- **Voice Channels**: WebRTC integration for voice communication
- **Bot Framework**: Custom bot development and management
- **Webhooks**: External service integrations

## 🚀 Quick Start

### Prerequisites
- Python 3.10 or higher
- pip or pipenv
- Supabase account and project
- Cloudflare R2 account (optional)

### 1. Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
# - CLOUDFLARE_* (if using file storage)
```

### 3. Database Setup
```bash
# Run database setup script
python setup_database.py

# Verify setup
python validate_setup.py
```

### 4. Start Development Server
```bash
# Start with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the FastAPI CLI
fastapi dev app/main.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

### Run All Tests
```bash
# Run with coverage
pytest tests/ -v --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run with specific markers
pytest -m "not slow" -v
```

### Test Categories
- **Unit Tests**: Individual function and class testing
- **Integration Tests**: API endpoint testing with database
- **Performance Tests**: Load testing and benchmarking
- **Security Tests**: Authentication and authorization testing

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/refresh` - Token refresh
- `POST /api/v1/auth/logout` - User logout

### User Management
- `GET /api/v1/users/me` - Get current user profile
- `PUT /api/v1/users/me` - Update user profile
- `POST /api/v1/users/avatar` - Upload user avatar
- `GET /api/v1/users/{user_id}` - Get user by ID

### Server Operations
- `GET /api/v1/servers` - List user's servers
- `POST /api/v1/servers` - Create new server
- `GET /api/v1/servers/{server_id}` - Get server details
- `PUT /api/v1/servers/{server_id}` - Update server
- `DELETE /api/v1/servers/{server_id}` - Delete server
- `POST /api/v1/servers/join` - Join server with invite code

### Room Management
- `GET /api/v1/servers/{server_id}/rooms` - List server rooms
- `POST /api/v1/servers/{server_id}/rooms` - Create room
- `GET /api/v1/rooms/{room_id}` - Get room details
- `PUT /api/v1/rooms/{room_id}` - Update room
- `DELETE /api/v1/rooms/{room_id}` - Delete room

### Messaging
- `GET /api/v1/rooms/{room_id}/messages` - Get room messages
- `POST /api/v1/rooms/{room_id}/messages` - Send message
- `PUT /api/v1/messages/{message_id}` - Edit message
- `DELETE /api/v1/messages/{message_id}` - Delete message
- `POST /api/v1/messages/{message_id}/reactions` - Add reaction

### File Operations
- `POST /api/v1/files/upload` - Upload file
- `GET /api/v1/files/{file_id}` - Download file
- `DELETE /api/v1/files/{file_id}` - Delete file

## 🔧 Configuration

### Environment Variables
```bash
# Application
ENVIRONMENT=development
DEBUG=true
SECRET_KEY=your-secret-key

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Cloudflare R2 (Optional)
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=aigm-files
CLOUDFLARE_BUCKET_URL=https://files.aigm.world

# File Upload
MAX_FILE_SIZE=52428800  # 50MB
```

## 🚀 Deployment

### Docker Deployment
```bash
# Build image
docker build -t aigm-backend .

# Run container
docker run -p 8000:8000 --env-file .env aigm-backend
```

### Production Considerations
- Use environment-specific configuration
- Enable HTTPS with proper SSL certificates
- Configure CORS for your frontend domain
- Set up monitoring and logging
- Use a reverse proxy (nginx/Cloudflare)
- Enable database connection pooling
- Configure rate limiting

## 🔍 Monitoring & Logging

### Health Checks
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

### Logging
- Structured JSON logging
- Request/response logging
- Error tracking and alerting
- Performance metrics

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Write comprehensive tests for new features
3. Update API documentation
4. Use type hints for all functions
5. Follow the existing project structure

### Code Quality Tools
```bash
# Format code
black app/ tests/

# Sort imports
isort app/ tests/

# Type checking
mypy app/

# Linting
flake8 app/ tests/
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase Python Client](https://supabase.com/docs/reference/python/introduction)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [pytest Documentation](https://docs.pytest.org/)

---

**Built with ❤️ and modern Python practices for scalable, maintainable code!** 🐍✨
