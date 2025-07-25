from fastapi import APIRouter, HTTPException, Depends, status

from app.dependencies import get_current_user
from app.models.conversation import ConversationCreate, ConversationResponse, ConversationListResponse
from app.models.user import User
from app.services.conversation import ConversationService
from app.utils.exceptions import ValidationError, NotFoundError, PermissionError

router = APIRouter()
conversation_service = ConversationService()


@router.post("/", response_model=ConversationResponse)
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new conversation or find existing one with another user"""
    try:
        return await conversation_service.create_or_find_conversation(
            current_user.id, 
            conversation_data.participant_username
        )
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"Error in create_conversation: {e}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/", response_model=ConversationListResponse)
async def get_conversations(
    current_user: User = Depends(get_current_user)
):
    """Get all conversations for the current user"""
    print(f"=== GET CONVERSATIONS CALLED FOR USER: {current_user.username} ===")
    try:
        result = await conversation_service.get_user_conversations(current_user.id)
        print(f"=== CONVERSATIONS SUCCESS: {len(result.conversations)} conversations ===")
        return result
    except Exception as e:
        import traceback
        print(f"=== ERROR in get_conversations: {e} ===")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific conversation"""
    try:
        return await conversation_service.get_conversation(current_user.id, conversation_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a conversation"""
    try:
        await conversation_service.delete_conversation(conversation_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")