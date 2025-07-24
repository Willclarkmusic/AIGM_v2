from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration settings"""
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "*.aigm.world", "testserver"]
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://aigm.world",
        "https://*.aigm.world"
    ]
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""
    
    # Cloudflare R2
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_ACCESS_KEY_ID: str = ""
    CLOUDFLARE_SECRET_ACCESS_KEY: str = ""
    CLOUDFLARE_BUCKET_NAME: str = "aigm-files"
    CLOUDFLARE_BUCKET_URL: str = "https://files.aigm.world"
    
    # Redis (optional for caching)
    REDIS_URL: str = "redis://localhost:6379"
    
    # File upload limits
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    MAX_FILES_PER_MESSAGE: int = 10
    
    model_config = {"env_file": ".env"}


settings = Settings()