from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.post("/login")
async def login():
    """Login endpoint"""
    # TODO: Implement Supabase auth integration
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/logout")
async def logout():
    """Logout endpoint"""
    # TODO: Implement logout
    raise HTTPException(status_code=501, detail="Not implemented")


@router.post("/refresh")
async def refresh_token():
    """Refresh JWT token"""
    # TODO: Implement token refresh
    raise HTTPException(status_code=501, detail="Not implemented")