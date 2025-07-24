from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class UserProfile(BaseModel):
    """User profile model"""
    id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    custom_url: Optional[str] = None
    status: str = "online"
    status_text: Optional[str] = None
    status_color: str = "#22c55e"
    created_at: datetime
    updated_at: datetime


class UserSearchResult(BaseModel):
    """Single user search result"""
    id: str
    username: str
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str


class UserSearchResponse(BaseModel):
    """User search response with pagination"""
    users: List[UserSearchResult]
    total: int
    limit: int
    offset: int


# Alias for backward compatibility with existing code
User = UserProfile