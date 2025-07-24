from fastapi import APIRouter, HTTPException, UploadFile, File

router = APIRouter()


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a file to Cloudflare R2"""
    # TODO: Implement file upload
    raise HTTPException(status_code=501, detail="Not implemented")


@router.get("/{file_id}")
async def get_file(file_id: str):
    """Get file metadata"""
    # TODO: Implement file retrieval
    raise HTTPException(status_code=501, detail="Not implemented")