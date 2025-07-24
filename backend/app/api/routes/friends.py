from fastapi import APIRouter, HTTPException, Depends, status
from typing import Optional
from supabase import Client

from app.models.friendship import (
    FriendshipResponse, 
    FriendshipListResponse,
    FriendRequestCreate
)
from app.services.friend import FriendService
from app.dependencies import get_current_user, get_supabase

router = APIRouter()


@router.post("/request", response_model=FriendshipResponse, status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    friend_request: FriendRequestCreate,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Send a friend request to another user by username
    
    - **addressee_username**: Username of the user to send friend request to
    """
    try:
        return await FriendService.send_friend_request(
            requester_id=current_user.id,
            addressee_username=friend_request.addressee_username,
            supabase=supabase
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/{friendship_id}/accept", response_model=FriendshipResponse)
async def accept_friend_request(
    friendship_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Accept a friend request
    
    - **friendship_id**: ID of the friendship to accept
    - Only the addressee (recipient) can accept a friend request
    """
    try:
        return await FriendService.accept_friend_request(
            friendship_id=friendship_id,
            current_user_id=current_user.id,
            supabase=supabase
        )
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        elif "only the addressee" in str(e).lower():
            raise HTTPException(status_code=403, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.put("/{friendship_id}/block", response_model=FriendshipResponse)
async def block_friend_request(
    friendship_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Block a friend request or friendship
    
    - **friendship_id**: ID of the friendship to block
    - Can be used to decline incoming requests or block existing friendships
    """
    try:
        return await FriendService.block_friend_request(
            friendship_id=friendship_id,
            current_user_id=current_user.id,
            supabase=supabase
        )
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        elif "can only block" in str(e).lower():
            raise HTTPException(status_code=403, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/", response_model=FriendshipListResponse)
async def get_friendships(
    status: Optional[str] = None,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get user's friendships
    
    - **status**: Optional filter by friendship status (pending, accepted, blocked)
    - Returns all friendships where user is either requester or addressee
    """
    try:
        # Validate status parameter
        if status and status not in ['pending', 'accepted', 'blocked']:
            raise HTTPException(
                status_code=400, 
                detail="Invalid status. Must be one of: pending, accepted, blocked"
            )
        
        return await FriendService.get_friendships(
            current_user_id=current_user.id,
            status=status,
            supabase=supabase
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/{friendship_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_friendship(
    friendship_id: str,
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Delete a friendship
    
    - **friendship_id**: ID of the friendship to delete
    - Used for canceling sent requests or removing existing friendships
    - User must be either requester or addressee
    """
    try:
        await FriendService.delete_friendship(
            friendship_id=friendship_id,
            current_user_id=current_user.id,
            supabase=supabase
        )
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        elif "can only delete" in str(e).lower():
            raise HTTPException(status_code=403, detail=str(e))
        else:
            raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/list", response_model=list)
async def get_friends_list(
    current_user = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get a simple list of accepted friends
    
    - Returns only accepted friends as UserProfile objects
    - Useful for displaying friends lists in UI
    """
    try:
        friends = await FriendService.get_friends_list(
            current_user_id=current_user.id,
            supabase=supabase
        )
        return friends
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")