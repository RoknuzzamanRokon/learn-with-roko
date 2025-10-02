"""
File upload and management API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from pathlib import Path

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.file_service import FileService

router = APIRouter(prefix="/files", tags=["files"])

# Initialize file service
file_service = FileService()


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload a single file. Requires Instructor or Super Admin role."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Instructors and Super Admins can upload files"
        )
    
    result = await file_service.upload_file(file, current_user.id)
    return {
        "message": "File uploaded successfully",
        "file": result
    }


@router.post("/upload-multiple", status_code=status.HTTP_201_CREATED)
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload multiple files. Requires Instructor or Super Admin role."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Instructors and Super Admins can upload files"
        )
    
    if len(files) > 10:  # Limit to 10 files per request
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files allowed per upload"
        )
    
    result = await file_service.upload_multiple_files(files, current_user.id)
    return {
        "message": "Files processed",
        "result": result
    }


@router.get("/download/{category}/{filename}")
async def download_file(
    category: str,
    filename: str,
    current_user: User = Depends(get_current_user)
):
    """Download a file. Requires authentication."""
    # Validate category
    allowed_categories = ["videos", "documents", "images", "archives"]
    if category not in allowed_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file category"
        )
    
    # Construct file path
    file_path = Path("uploads") / category / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type='application/octet-stream'
    )


@router.delete("/delete")
async def delete_file(
    file_path: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a file. Requires Instructor or Super Admin role."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Instructors and Super Admins can delete files"
        )
    
    success = file_service.delete_file(file_path)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or could not be deleted"
        )
    
    return {"message": "File deleted successfully"}


@router.get("/info")
async def get_file_info(
    file_path: str,
    current_user: User = Depends(get_current_user)
):
    """Get file information. Requires authentication."""
    file_info = file_service.get_file_info(file_path)
    if not file_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return file_info


# Static file serving endpoint (for development)
@router.get("/uploads/{category}/{filename}")
async def serve_uploaded_file(
    category: str,
    filename: str
):
    """Serve uploaded files directly (for development only)."""
    # Validate category
    allowed_categories = ["videos", "documents", "images", "archives"]
    if category not in allowed_categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file category"
        )
    
    # Construct file path
    file_path = Path("uploads") / category / filename
    
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Determine media type
    import mimetypes
    media_type, _ = mimetypes.guess_type(str(file_path))
    if not media_type:
        media_type = 'application/octet-stream'
    
    return FileResponse(
        path=str(file_path),
        media_type=media_type
    )