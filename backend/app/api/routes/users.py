from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List
from supabase import Client
from app.models.user import UserSearchResponse, UserProfile
from app.services.user import search_users
from app.dependencies import get_current_user, get_supabase

router = APIRouter()


@router.get("/search", response_model=UserSearchResponse)
async def search_users_endpoint(
    q: str = Query(..., description="Search query", min_length=1, max_length=100),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Search users for friend requests
    CRITICAL ENDPOINT: Everything depends on this working correctly
    
    Performance requirement: <500ms response time
    Security: Excludes current user and blocked users
    """
    try:
        return await search_users(q, current_user.id, supabase, limit, offset)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user = Depends(get_current_user)
):
    """Get current user profile"""
    # TODO: Implement get current user profile
    return current_user


@router.put("/me", response_model=UserProfile)
async def update_current_user_profile(
    # profile_data: UserProfileUpdate,
    current_user = Depends(get_current_user)
):
    """Update current user profile"""
    # TODO: Implement profile update
    pass