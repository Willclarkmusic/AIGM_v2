from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/")
async def get_servers():
    """Get user's servers"""
    # TODO: Implement server retrieval
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/")
async def create_server():
    """Create a new server"""
    # TODO: Implement server creation
    raise HTTPException(status_code=501, detail="Not implemented")