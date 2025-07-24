# 🌐 AIGM v2 Frontend - React Application

> Modern, responsive React frontend for the AIGM v2 messaging platform with TypeScript, Tailwind CSS, and real-time capabilities.

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-blue.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-2.52.0-green.svg)](https://supabase.com/)

## 🏗️ Architecture Overview

The frontend follows a modern React architecture with clean component organization and type-safe development:

```
frontend/
├── 📁 src/
│   ├── 📁 components/        # Reusable UI components
│   │   ├── ui/              # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Avatar.tsx
│   │   ├── layout/          # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ServerBar.tsx
│   │   │   └── TopBar.tsx
│   │   ├── messaging/       # Chat components
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageInput.tsx
│   │   │   └── MessageItem.tsx
│   │   ├── auth/            # Authentication
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   └── server/          # Server management
│   │       ├── ServerList.tsx
│   │       └── RoomList.tsx
│   ├── 📁 pages/             # Application pages
│   │   ├── Home.tsx
│   │   ├── Chat.tsx
│   │   ├── Login.tsx
│   │   └── Profile.tsx
│   ├── 📁 hooks/            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useMessages.ts
│   │   ├── useRealtime.ts
│   │   └── useSupabase.ts
│   ├── 📁 utils/            # Utility functions
│   │   ├── supabase.ts      # Supabase client
│   │   ├── auth.ts          # Auth helpers
│   │   ├── formatters.ts    # Data formatters
│   │   └── constants.ts     # App constants
│   ├── 📁 types/            # TypeScript definitions
│   │   ├── auth.ts
│   │   ├── message.ts
│   │   ├── server.ts
│   │   └── user.ts
│   ├── 📁 styles/           # Global styles
│   │   └── globals.css      # Tailwind imports
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # React entry point
│   └── vite-env.d.ts        # Vite type definitions
├── 📁 public/             # Static assets
│   └── favicon.ico
├── package.json             # Dependencies and scripts
├── .env.example            # Environment template
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
