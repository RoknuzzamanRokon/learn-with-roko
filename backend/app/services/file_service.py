"""
File service for handling file uploads and content management.
"""

import os
import uuid
import mimetypes
from typing import List, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from pathlib import Path
import shutil

# Configuration
UPLOAD_DIR = Path("uploads")
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/mpeg", "video/quicktime", "video/x-msvideo", 
    "video/webm", "video/ogg"
}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf", "application/msword", 
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain", "text/csv"
}
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/png", "image/gif", "image/webp"
}
ALLOWED_ARCHIVE_TYPES = {
    "application/zip", "application/x-rar-compressed", "application/x-7z-compressed"
}

ALL_ALLOWED_TYPES = ALLOWED_VIDEO_TYPES | ALLOWED_DOCUMENT_TYPES | ALLOWED_IMAGE_TYPES | ALLOWED_ARCHIVE_TYPES


class FileService:
    """Service class for file management operations."""
    
    def __init__(self):
        # Create upload directories if they don't exist
        self.upload_dir = UPLOAD_DIR
        self.video_dir = self.upload_dir / "videos"
        self.document_dir = self.upload_dir / "documents"
        self.image_dir = self.upload_dir / "images"
        self.archive_dir = self.upload_dir / "archives"
        
        for directory in [self.upload_dir, self.video_dir, self.document_dir, self.image_dir, self.archive_dir]:
            directory.mkdir(parents=True, exist_ok=True)
    
    def _get_file_category(self, content_type: str) -> str:
        """Determine file category based on content type."""
        if content_type in ALLOWED_VIDEO_TYPES:
            return "video"
        elif content_type in ALLOWED_DOCUMENT_TYPES:
            return "document"
        elif content_type in ALLOWED_IMAGE_TYPES:
            return "image"
        elif content_type in ALLOWED_ARCHIVE_TYPES:
            return "archive"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {content_type}"
            )
    
    def _get_upload_directory(self, category: str) -> Path:
        """Get the appropriate upload directory for file category."""
        directories = {
            "video": self.video_dir,
            "document": self.document_dir,
            "image": self.image_dir,
            "archive": self.archive_dir
        }
        return directories.get(category, self.upload_dir)
    
    def _generate_unique_filename(self, original_filename: str) -> str:
        """Generate a unique filename while preserving the extension."""
        file_extension = Path(original_filename).suffix
        unique_id = str(uuid.uuid4())
        return f"{unique_id}{file_extension}"
    
    def validate_file(self, file: UploadFile) -> Tuple[str, str]:
        """
        Validate uploaded file.
        
        Returns:
            Tuple of (content_type, category)
            
        Raises:
            HTTPException: If file is invalid
        """
        # Check file size
        if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)}MB"
            )
        
        # Determine content type
        content_type = file.content_type
        if not content_type:
            # Try to guess from filename
            content_type, _ = mimetypes.guess_type(file.filename or "")
            if not content_type:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Could not determine file type"
                )
        
        # Check if file type is allowed
        if content_type not in ALL_ALLOWED_TYPES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {content_type} is not allowed"
            )
        
        category = self._get_file_category(content_type)
        return content_type, category
    
    async def upload_file(self, file: UploadFile, user_id: int) -> dict:
        """
        Upload a file and return file information.
        
        Args:
            file: The uploaded file
            user_id: ID of the user uploading the file
            
        Returns:
            Dict with file information
            
        Raises:
            HTTPException: If upload fails
        """
        try:
            # Validate file
            content_type, category = self.validate_file(file)
            
            # Generate unique filename
            unique_filename = self._generate_unique_filename(file.filename or "unknown")
            
            # Get upload directory
            upload_dir = self._get_upload_directory(category)
            file_path = upload_dir / unique_filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Get file size
            file_size = file_path.stat().st_size
            
            # Generate URL (this would be different in production with cloud storage)
            file_url = f"/uploads/{category}/{unique_filename}"
            
            return {
                "filename": unique_filename,
                "original_filename": file.filename,
                "content_type": content_type,
                "category": category,
                "size": file_size,
                "url": file_url,
                "uploaded_by": user_id
            }
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"File upload failed: {str(e)}"
            )
        finally:
            # Close the file
            await file.close()
    
    async def upload_multiple_files(self, files: List[UploadFile], user_id: int) -> List[dict]:
        """
        Upload multiple files.
        
        Args:
            files: List of uploaded files
            user_id: ID of the user uploading the files
            
        Returns:
            List of file information dicts
        """
        results = []
        errors = []
        
        for file in files:
            try:
                result = await self.upload_file(file, user_id)
                results.append(result)
            except HTTPException as e:
                errors.append({
                    "filename": file.filename,
                    "error": e.detail
                })
        
        if errors and not results:
            # All files failed
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"message": "All file uploads failed", "errors": errors}
            )
        
        return {
            "uploaded_files": results,
            "errors": errors if errors else None
        }
    
    def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from the filesystem.
        
        Args:
            file_path: Path to the file to delete
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Construct full path
            if file_path.startswith("/uploads/"):
                file_path = file_path[9:]  # Remove /uploads/ prefix
            
            full_path = self.upload_dir / file_path
            
            if full_path.exists() and full_path.is_file():
                full_path.unlink()
                return True
            return False
            
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            return False
    
    def get_file_info(self, file_path: str) -> Optional[dict]:
        """
        Get information about a file.
        
        Args:
            file_path: Path to the file
            
        Returns:
            File information dict or None if file doesn't exist
        """
        try:
            if file_path.startswith("/uploads/"):
                file_path = file_path[9:]  # Remove /uploads/ prefix
            
            full_path = self.upload_dir / file_path
            
            if not full_path.exists() or not full_path.is_file():
                return None
            
            stat = full_path.stat()
            content_type, _ = mimetypes.guess_type(str(full_path))
            
            return {
                "filename": full_path.name,
                "size": stat.st_size,
                "content_type": content_type,
                "created_at": stat.st_ctime,
                "modified_at": stat.st_mtime
            }
            
        except Exception as e:
            print(f"Error getting file info for {file_path}: {e}")
            return None