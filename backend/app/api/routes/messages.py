from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional

from app.dependencies import get_current_user
from app.models.message import MessageCreate, MessageResponse, MessageListResponse, MessageEdit
from app.models.message_input import MessageContentInput
from app.models.user import User
from app.services.message import MessageService
from app.utils.exceptions import ValidationError, NotFoundError, PermissionError

router = APIRouter()
message_service = MessageService()

# Rate limiting store (in production, use Redis)
rate_limit_store = {}


@router.post("/", response_model=MessageResponse)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    """Send a new message to a DM conversation or room"""
    try:
        return await message_service.send_message(message_data, current_user.id)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/conversations/{conversation_id}", response_model=MessageResponse)
async def send_dm_message(
    conversation_id: str,
    message_input: MessageContentInput,
    current_user: User = Depends(get_current_user)
):
    """Send a new message to a DM conversation"""
    print(f"=== SEND DM MESSAGE: conversation_id={conversation_id}, user={current_user.username} ===")
    try:
        # Create MessageCreate instance with the conversation ID
        message_data = MessageCreate(
            content=message_input.content,
            dm_conversation_id=conversation_id,
            room_id=None
        )
        
        result = await message_service.send_message(message_data, current_user.id)
        print(f"=== DM MESSAGE SENT SUCCESS: message_id={result.id} ===")
        return result
    except ValidationError as e:
        print(f"=== DM MESSAGE VALIDATION ERROR: {e} ===")
        raise HTTPException(status_code=422, detail=str(e))
    except PermissionError as e:
        print(f"=== DM MESSAGE PERMISSION ERROR: {e} ===")
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        print(f"=== DM MESSAGE NOT FOUND ERROR: {e} ===")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"=== DM MESSAGE ERROR: {e} ===")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/rooms/{room_id}", response_model=MessageResponse)
async def send_room_message(
    room_id: str,
    message_input: MessageContentInput,
    current_user: User = Depends(get_current_user)
):
    """Send a new message to a room"""
    try:
        # Create MessageCreate instance with the room ID
        message_data = MessageCreate(
            content=message_input.content,
            room_id=room_id,
            dm_conversation_id=None
        )
        
        return await message_service.send_message(message_data, current_user.id)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/dm/{conversation_id}", response_model=MessageListResponse)
async def get_dm_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    before: Optional[str] = Query(None, description="Get messages before this timestamp (ISO format)")
):
    """Get messages from a DM conversation with pagination"""
    print(f"=== GET DM MESSAGES: conversation_id={conversation_id}, user={current_user.username} ===")
    try:
        # Convert before timestamp if provided
        before_datetime = None
        if before:
            try:
                from datetime import datetime
                before_datetime = datetime.fromisoformat(before.replace('Z', '+00:00'))
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid before timestamp format")
        
        result = await message_service.get_dm_messages(
            conversation_id, current_user.id, limit, offset, before_datetime
        )
        print(f"=== DM MESSAGES SUCCESS: {len(result.messages)} messages ===")
        return result
    except PermissionError as e:
        print(f"=== DM MESSAGES PERMISSION ERROR: {e} ===")
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        print(f"=== DM MESSAGES NOT FOUND ERROR: {e} ===")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        import traceback
        print(f"=== DM MESSAGES ERROR: {e} ===")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/room/{room_id}", response_model=MessageListResponse)
async def get_room_messages(
    room_id: str,
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get messages from a room with pagination"""
    try:
        return await message_service.get_room_messages(
            room_id, current_user.id, limit, offset
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.put("/{message_id}", response_model=MessageResponse)
async def edit_message(
    message_id: str,
    edit_data: MessageEdit,
    current_user: User = Depends(get_current_user)
):
    """Edit an existing message (only by author)"""
    try:
        return await message_service.edit_message(message_id, edit_data, current_user.id)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete("/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_message(
    message_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a message (only by author)"""
    try:
        await message_service.delete_message(message_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Internal server error")