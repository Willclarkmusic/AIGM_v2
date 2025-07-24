from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from enum import Enum
from datetime import datetime
from app.models.user import UserProfile


class FriendshipStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"


class FriendRequestCreate(BaseModel):
    addressee_username: str = Field(..., min_length=1, max_length=50)

    @field_validator('addressee_username')
    @classmethod
    def validate_username(cls, v):
        if not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip().lower()


class FriendshipBase(BaseModel):
    id: str
    requester_id: str
    addressee_id: str
    status: FriendshipStatus
    action_user_id: str
    created_at: datetime
    updated_at: datetime


class FriendshipResponse(FriendshipBase):
    requester: Optional[UserProfile] = None
    addressee: Optional[UserProfile] = None

    class Config:
        from_attributes = True


class FriendshipListResponse(BaseModel):
    friendships: List[FriendshipResponse]
    total: int
    
    class Config:
        from_attributes = True


class FriendshipUpdate(BaseModel):
    status: FriendshipStatus
    action_user_id: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)