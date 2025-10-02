"""
API routes for resource management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..schemas.resource import (
    LectureResourceCreate, LectureResourceUpdate, LectureResourceResponse, 
    ResourceDownloadCreate, ResourceDownloadResponse
)
from ..services.resource_service import ResourceService

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post("/", response_model=LectureResourceResponse, status_code=status.HTTP_201_CREATED)
async def create_resource(
    resource_data: LectureResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new downloadable resource for a lecture."""
    resource = ResourceService.create_resource(db, current_user.id, resource_data)
    return resource


@router.get("/lecture/{lecture_id}", response_model=list[LectureResourceResponse])
async def get_lecture_resources(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resources for a specific lecture."""
    resources = ResourceService.get_lecture_resources(db, current_user.id, lecture_id)
    return resources


@router.get("/{resource_id}", response_model=LectureResourceResponse)
async def get_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific resource by ID."""
    resource = ResourceService.get_resource(db, resource_id)
    return resource


@router.put("/{resource_id}", response_model=LectureResourceResponse)
async def update_resource(
    resource_id: int,
    resource_data: LectureResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing resource."""
    resource = ResourceService.update_resource(db, current_user.id, resource_id, resource_data)
    return resource


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a resource."""
    ResourceService.delete_resource(db, current_user.id, resource_id)
    return None


@router.post("/{resource_id}/download")
async def download_resource(
    resource_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Download a resource file."""
    # Extract client information
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    download_data = ResourceDownloadCreate(
        resource_id=resource_id,
        ip_address=client_ip,
        user_agent=user_agent
    )
    
    resource, download_url = ResourceService.download_resource(
        db, current_user.id, resource_id, download_data
    )
    
    # Return redirect to the actual file URL
    return RedirectResponse(url=download_url, status_code=status.HTTP_302_FOUND)