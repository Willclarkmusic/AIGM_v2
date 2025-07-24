from typing import List, Optional
from supabase import Client
from app.models.user import UserSearchResponse, UserSearchResult
import time


async def search_users(
    query: str,
    current_user_id: str,
    supabase: Client,
    limit: int = 10,
    offset: int = 0
) -> UserSearchResponse:
    """
    Search users by username or display name with filters
    CRITICAL: Must exclude current user and blocked users
    Performance requirement: <500ms response time
    """
    start_time = time.time()
    
    # Validate query length
    if len(query.strip()) < 1:
        raise ValueError("Search query must be at least 1 character")
    if len(query.strip()) > 100:
        raise ValueError("Search query cannot exceed 100 characters")
    
    # Clean and normalize query
    clean_query = query.strip().lower()
    
    try:
        
        # Build the search query
        # Using PostgreSQL full-text search with trigram matching for performance
        search_pattern = f"%{clean_query}%"
        
        # Base query to find user profiles
        query_builder = supabase.table("user_profiles").select(
            "id, username, display_name, avatar_url, status"
        )
        
        # Exclude current user
        query_builder = query_builder.neq("id", current_user_id)
        
        # Search in username and display_name using ILIKE for case-insensitive search
        query_builder = query_builder.or_(
            f"username.ilike.{search_pattern},"
            f"display_name.ilike.{search_pattern}"
        )
        
        # Exclude blocked users (users who blocked current user or current user blocked)
        # First get list of blocked user IDs
        blocked_response = supabase.table("friendships").select("requester_id, addressee_id").or_(
            f"and(requester_id.eq.{current_user_id},status.eq.blocked),"
            f"and(addressee_id.eq.{current_user_id},status.eq.blocked)"
        ).execute()
        
        blocked_user_ids = set()
        if blocked_response.data:
            for relationship in blocked_response.data:
                if relationship["requester_id"] == current_user_id:
                    blocked_user_ids.add(relationship["addressee_id"])
                else:
                    blocked_user_ids.add(relationship["requester_id"])
        
        # Apply blocked user filter if there are any
        if blocked_user_ids:
            blocked_ids_str = ",".join(f"'{uid}'" for uid in blocked_user_ids)
            query_builder = query_builder.not_.in_("id", list(blocked_user_ids))
        
        # Apply ordering for relevance (exact username matches first, then display name matches)
        # PostgreSQL will handle this via the similarity function with pg_trgm
        query_builder = query_builder.order("username")
        
        # Apply pagination
        query_builder = query_builder.range(offset, offset + limit - 1)
        
        # Execute the query
        response = query_builder.execute()
        
        # Get total count for pagination (separate query for performance)
        count_query = supabase.table("user_profiles").select("id", count="exact")
        count_query = count_query.neq("id", current_user_id)
        count_query = count_query.or_(
            f"username.ilike.{search_pattern},"
            f"display_name.ilike.{search_pattern}"
        )
        
        if blocked_user_ids:
            count_query = count_query.not_.in_("id", list(blocked_user_ids))
        
        count_response = count_query.execute()
        total_count = count_response.count if count_response.count is not None else 0
        
        # Convert to response models
        users = []
        if response.data:
            for user_data in response.data:
                users.append(UserSearchResult(
                    id=user_data["id"],
                    username=user_data["username"],
                    display_name=user_data.get("display_name"),
                    avatar_url=user_data.get("avatar_url"),
                    status=user_data.get("status", "offline")
                ))
        
        # Sort results for better relevance (exact matches first)
        def sort_key(user):
            username_score = 0
            display_name_score = 0
            
            # Exact username match gets highest priority
            if user.username.lower() == clean_query:
                username_score = 1000
            # Username starts with query gets high priority
            elif user.username.lower().startswith(clean_query):
                username_score = 100
            # Username contains query
            elif clean_query in user.username.lower():
                username_score = 10
            
            # Display name matching (lower priority than username)
            if user.display_name:
                if user.display_name.lower() == clean_query:
                    display_name_score = 50
                elif user.display_name.lower().startswith(clean_query):
                    display_name_score = 5
                elif clean_query in user.display_name.lower():
                    display_name_score = 1
            
            return -(username_score + display_name_score)  # Negative for descending order
        
        users.sort(key=sort_key)
        
        # Check performance requirement
        end_time = time.time()
        response_time = (end_time - start_time) * 1000
        if response_time >= 500:
            print(f"WARNING: User search took {response_time}ms, exceeds 500ms requirement")
        
        return UserSearchResponse(
            users=users,
            total=total_count,
            limit=limit,
            offset=offset
        )
        
    except Exception as e:
        print(f"Error in user search: {e}")
        # Re-raise the exception so it can be handled by the API endpoint
        raise e