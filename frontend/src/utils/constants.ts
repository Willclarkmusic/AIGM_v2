export const APP_NAME = 'AIGM';
export const APP_DESCRIPTION = 'AI Generative Messaging Platform';

// API endpoints
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// File upload limits
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '52428800'); // 50MB
export const CLOUDFLARE_BUCKET_URL = import.meta.env.VITE_CLOUDFLARE_BUCKET_URL;

// Pagination
export const DEFAULT_MESSAGE_LIMIT = 50;
export const DEFAULT_USER_SEARCH_LIMIT = 20;

// Status colors
export const STATUS_COLORS = {
  online: '#22c55e',
  idle: '#f59e0b', 
  away: '#ef4444',
  offline: '#6b7280',
} as const;

// Message limits
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_FILES_PER_MESSAGE = 10;

// User limits
export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 50;
export const MIN_DISPLAY_NAME_LENGTH = 1;
export const MAX_DISPLAY_NAME_LENGTH = 100;