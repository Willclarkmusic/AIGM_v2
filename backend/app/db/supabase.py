from supabase import create_client, Client
from app.config import settings


def get_supabase_client() -> Client:
    """Get Supabase client with service role key for backend operations"""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise ValueError("Supabase URL and service role key must be configured")
    
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY
    )


def get_supabase_client_anon() -> Client:
    """Get Supabase client with anonymous key for public operations"""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise ValueError("Supabase URL and anonymous key must be configured")
    
    return create_client(
        supabase_url=settings.SUPABASE_URL,
        supabase_key=settings.SUPABASE_ANON_KEY
    )


# Global client instance (will be initialized when needed)
supabase: Client = None


def init_supabase():
    """Initialize global Supabase client"""
    global supabase
    supabase = get_supabase_client()
    return supabase


def get_supabase():
    """Get the global Supabase client instance (for backward compatibility)"""
    if supabase is None:
        return get_supabase_client()
    return supabase