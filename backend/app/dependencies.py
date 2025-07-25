from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from app.models.user import UserProfile
from app.db.supabase import get_supabase_client
from supabase import Client
from datetime import datetime
import jwt
from app.config import settings

security = HTTPBearer()


def get_supabase() -> Client:
    """
    Dependency to get Supabase client instance
    """
    return get_supabase_client()


async def get_current_user(token: str = Depends(security)) -> UserProfile:
    """
    Extract current user from JWT token
    For development, return a mock user to test the messaging system
    """
    # For development - always return alice user to match database data
    return UserProfile(
        id="229d3ddc-3423-44f3-b14c-acc0d4985e68",  # Alice's actual UUID from database
        username="alice",
        display_name="Alice Johnson",  # Match database display name
        avatar_url=None,
        custom_url=None,
        status="online",
        status_text=None,
        status_color="#22c55e",
        created_at=datetime.now(),
        updated_at=datetime.now()
    )