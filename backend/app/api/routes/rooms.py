from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
async def get_rooms():
    """Get rooms in a server"""
    # TODO: Implement room retrieval
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/")
async def create_room():
    """Create a new room"""
    # TODO: Implement room creation
    raise HTTPException(status_code=501, detail="Not implemented")