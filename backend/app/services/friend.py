from typing import List, Optional
from supabase import Client
from datetime import datetime

from app.models.friendship import (
    FriendshipResponse,
    FriendshipListResponse,
    FriendshipStatus,
    FriendRequestCreate
)
from app.models.user import UserProfile


class FriendService:
    """Service for managing friend requests and friendships"""

    @staticmethod
    async def send_friend_request(
        requester_id: str,
        addressee_username: str,
        supabase: Client
    ) -> FriendshipResponse:
        """Send a friend request to another user"""
        
        # Find the addressee by username
        addressee_response = supabase.table('user_profiles').select('*').eq('username', addressee_username).single().execute()
        
        if not addressee_response.data:
            raise ValueError(f"User '{addressee_username}' not found")
        
        addressee = addressee_response.data
        addressee_id = addressee['id']
        
        # Check if trying to friend yourself
        if requester_id == addressee_id:
            raise ValueError("Cannot send friend request to yourself")
        
        # Check if friendship already exists
        existing_response = supabase.table('friendships').select('*').or_(
            f'and(requester_id.eq.{requester_id},addressee_id.eq.{addressee_id}),'
            f'and(requester_id.eq.{addressee_id},addressee_id.eq.{requester_id})'
        ).execute()
        
        if existing_response.data:
            existing_status = existing_response.data[0]['status']
            if existing_status == 'pending':
                raise ValueError("Friend request already pending")
            elif existing_status == 'accepted':
                raise ValueError("You are already friends with this user")
            elif existing_status == 'blocked':
                raise ValueError("Cannot send friend request to this user")
        
        # Create new friendship record
        friendship_data = {
            'requester_id': requester_id,
            'addressee_id': addressee_id,
            'status': 'pending',
            'action_user_id': requester_id
        }
        
        response = supabase.table('friendships').insert(friendship_data).select('*').single().execute()
        
        if response.error:
            raise Exception(f"Failed to create friend request: {response.error}")
        
        # Get the complete friendship with user data
        complete_response = supabase.table('friendships').select(
            '*,'
            'requester:user_profiles!friendships_requester_id_fkey(*),'
            'addressee:user_profiles!friendships_addressee_id_fkey(*)'
        ).eq('id', response.data['id']).single().execute()
        
        if complete_response.error:
            raise Exception(f"Failed to retrieve friendship: {complete_response.error}")
        
        return FriendshipResponse(**complete_response.data)

    @staticmethod
    async def accept_friend_request(
        friendship_id: str,
        current_user_id: str,
        supabase: Client
    ) -> FriendshipResponse:
        """Accept a friend request"""
        
        # Get the friendship
        response = supabase.table('friendships').select('*').eq('id', friendship_id).single().execute()
        
        if not response.data:
            raise ValueError("Friendship not found")
        
        friendship = response.data
        
        # Verify current user is the addressee
        if friendship['addressee_id'] != current_user_id:
            raise ValueError("Only the addressee can accept a friend request")
        
        # Verify status is pending
        if friendship['status'] != 'pending':
            raise ValueError(f"Cannot accept friendship with status: {friendship['status']}")
        
        # Update friendship status
        update_data = {
            'status': 'accepted',
            'action_user_id': current_user_id,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        update_response = supabase.table('friendships').update(update_data).eq('id', friendship_id).select(
            '*,'
            'requester:user_profiles!friendships_requester_id_fkey(*),'
            'addressee:user_profiles!friendships_addressee_id_fkey(*)'
        ).single().execute()
        
        if update_response.error:
            raise Exception(f"Failed to accept friend request: {update_response.error}")
        
        return FriendshipResponse(**update_response.data)

    @staticmethod
    async def block_friend_request(
        friendship_id: str,
        current_user_id: str,
        supabase: Client
    ) -> FriendshipResponse:
        """Block a friend request or friendship"""
        
        # Get the friendship
        response = supabase.table('friendships').select('*').eq('id', friendship_id).single().execute()
        
        if not response.data:
            raise ValueError("Friendship not found")
        
        friendship = response.data
        
        # Verify current user is involved in the friendship
        if friendship['addressee_id'] != current_user_id and friendship['requester_id'] != current_user_id:
            raise ValueError("You can only block friendships you are involved in")
        
        # Update friendship status
        update_data = {
            'status': 'blocked',
            'action_user_id': current_user_id,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        update_response = supabase.table('friendships').update(update_data).eq('id', friendship_id).select(
            '*,'
            'requester:user_profiles!friendships_requester_id_fkey(*),'
            'addressee:user_profiles!friendships_addressee_id_fkey(*)'
        ).single().execute()
        
        if update_response.error:
            raise Exception(f"Failed to block friendship: {update_response.error}")
        
        return FriendshipResponse(**update_response.data)

    @staticmethod
    async def get_friendships(
        current_user_id: str,
        status: Optional[str],
        supabase: Client
    ) -> FriendshipListResponse:
        """Get user's friendships with optional status filter"""
        
        query = supabase.table('friendships').select(
            '*,'
            'requester:user_profiles!friendships_requester_id_fkey(*),'
            'addressee:user_profiles!friendships_addressee_id_fkey(*)'
        ).or_(
            f'requester_id.eq.{current_user_id},addressee_id.eq.{current_user_id}'
        )
        
        if status:
            query = query.eq('status', status)
        
        response = query.execute()
        
        if response.error:
            raise Exception(f"Failed to retrieve friendships: {response.error}")
        
        friendships = [FriendshipResponse(**friendship) for friendship in response.data or []]
        
        return FriendshipListResponse(
            friendships=friendships,
            total=len(friendships)
        )

    @staticmethod
    async def delete_friendship(
        friendship_id: str,
        current_user_id: str,
        supabase: Client
    ) -> None:
        """Delete a friendship (for canceling sent requests or removing friends)"""
        
        # Get the friendship to verify user can delete it
        response = supabase.table('friendships').select('*').eq('id', friendship_id).single().execute()
        
        if not response.data:
            raise ValueError("Friendship not found")
        
        friendship = response.data
        
        # Verify current user is involved in the friendship
        if friendship['addressee_id'] != current_user_id and friendship['requester_id'] != current_user_id:
            raise ValueError("You can only delete friendships you are involved in")
        
        # Delete the friendship
        delete_response = supabase.table('friendships').delete().eq('id', friendship_id).execute()
        
        if delete_response.error:
            raise Exception(f"Failed to delete friendship: {delete_response.error}")

    @staticmethod
    async def get_friends_list(
        current_user_id: str,
        supabase: Client
    ) -> List[UserProfile]:
        """Get a list of accepted friends as UserProfile objects"""
        
        response = supabase.table('friendships').select(
            'requester:user_profiles!friendships_requester_id_fkey(*),'
            'addressee:user_profiles!friendships_addressee_id_fkey(*)'
        ).or_(
            f'requester_id.eq.{current_user_id},addressee_id.eq.{current_user_id}'
        ).eq('status', 'accepted').execute()
        
        if response.error:
            raise Exception(f"Failed to retrieve friends: {response.error}")
        
        friends = []
        for friendship in response.data or []:
            # Get the friend (the other user in the friendship)
            if friendship['requester']['id'] == current_user_id:
                friend_data = friendship['addressee']
            else:
                friend_data = friendship['requester']
            
            friends.append(UserProfile(**friend_data))
        
        return friends

    @staticmethod
    async def are_friends(
        user1_id: str,
        user2_id: str,
        supabase: Client
    ) -> bool:
        """Check if two users are friends (accepted friendship)"""
        
        response = supabase.table('friendships').select('status').or_(
            f'and(requester_id.eq.{user1_id},addressee_id.eq.{user2_id}),' +
            f'and(requester_id.eq.{user2_id},addressee_id.eq.{user1_id})'
        ).eq('status', 'accepted').single().execute()
        
        return bool(response.data)