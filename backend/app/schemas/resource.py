"""
Pydantic schemas for resource-related operations.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from ..models.resource import ResourceType


class LectureResourceBase(BaseModel):
    """Base schema for lecture resource data."""
    title: str = Field(..., min_length=1, max_length=200, description="Resource title")
    description: Optional[str] = Field(None, max_length=1000, description="Resource description")
    resource_type: ResourceType = Field(..., description="Type of resource")
    file_name: str = Field(..., min_length=1, max_length=255, description="Original file name")
    file_size: Optional[int] = Field(None, ge=0, description="File size in bytes")
    mime_type: Optional[str] = Field(None, max_length=100, description="MIME type of the file")
    is_downloadable: bool = Field(True, description="Whether the resource can be downloaded")


class LectureResourceCreate(LectureResourceBase):
    """Schema for creating a new lecture resource."""
    lecture_id: int = Field(..., gt=0, description="ID of the lecture")
    file_url: str = Field(..., min_length=1, max_length=500, description="URL to the resource file")


class LectureResourceUpdate(BaseModel):
    """Schema for updating an existing lecture resource."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Resource title")
    description: Optional[str] = Field(None, max_length=1000, description="Resource description")
    resource_type: Optional[ResourceType] = Field(None, description="Type of resource")
    is_downloadable: Optional[bool] = Field(None, description="Whether the resource can be downloaded")


class LectureResourceResponse(LectureResourceBase):
    """Schema for lecture resource response data."""
    id: int
    lecture_id: int
    file_url: str
    download_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ResourceDownloadResponse(BaseModel):
    """Schema for resource download response."""
    id: int
    user_id: int
    resource_id: int
    downloaded_at: datetime

    class Config:
        from_attributes = True


class ResourceDownloadCreate(BaseModel):
    """Schema for creating a resource download record."""
    resource_id: int = Field(..., gt=0, description="ID of the resource")
    ip_address: Optional[str] = Field(None, max_length=45, description="IP address of the downloader")
    user_agent: Optional[str] = Field(None, max_length=500, description="User agent string")