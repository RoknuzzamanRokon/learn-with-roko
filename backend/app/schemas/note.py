"""
Pydantic schemas for note-related operations.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class NoteBase(BaseModel):
    """Base schema for note data."""
    content: str = Field(..., min_length=1, max_length=5000, description="Note content")
    timestamp: Optional[int] = Field(None, ge=0, description="Video timestamp in seconds")


class NoteCreate(NoteBase):
    """Schema for creating a new note."""
    lecture_id: int = Field(..., gt=0, description="ID of the lecture")


class NoteUpdate(BaseModel):
    """Schema for updating an existing note."""
    content: Optional[str] = Field(None, min_length=1, max_length=5000, description="Note content")
    timestamp: Optional[int] = Field(None, ge=0, description="Video timestamp in seconds")


class NoteResponse(NoteBase):
    """Schema for note response data."""
    id: int
    user_id: int
    lecture_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    """Schema for paginated note list response."""
    notes: list[NoteResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class NoteSearchFilters(BaseModel):
    """Schema for note search and filtering."""
    lecture_id: Optional[int] = None
    course_id: Optional[int] = None
    search: Optional[str] = Field(None, max_length=200, description="Search in note content")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")