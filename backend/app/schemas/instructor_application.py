"""
Pydantic schemas for instructor application endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from ..models.instructor_application import ApplicationStatus


class InstructorApplicationCreate(BaseModel):
    """Schema for creating an instructor application."""
    motivation: str = Field(..., min_length=50, max_length=2000, description="Why you want to become an instructor")
    experience: str = Field(..., min_length=50, max_length=2000, description="Your relevant experience and background")
    expertise_areas: str = Field(..., min_length=20, max_length=1000, description="Areas you want to teach")
    sample_course_outline: Optional[str] = Field(None, max_length=3000, description="Optional sample course outline")


class InstructorApplicationUpdate(BaseModel):
    """Schema for updating an instructor application (applicant only)."""
    motivation: Optional[str] = Field(None, min_length=50, max_length=2000, description="Why you want to become an instructor")
    experience: Optional[str] = Field(None, min_length=50, max_length=2000, description="Your relevant experience and background")
    expertise_areas: Optional[str] = Field(None, min_length=20, max_length=1000, description="Areas you want to teach")
    sample_course_outline: Optional[str] = Field(None, max_length=3000, description="Optional sample course outline")


class InstructorApplicationReview(BaseModel):
    """Schema for reviewing an instructor application (admin only)."""
    status: ApplicationStatus = Field(..., description="Application status")
    review_notes: Optional[str] = Field(None, max_length=1000, description="Review notes from admin")


class InstructorApplicationResponse(BaseModel):
    """Schema for instructor application response."""
    id: int
    user_id: int
    motivation: str
    experience: str
    expertise_areas: str
    sample_course_outline: Optional[str]
    status: ApplicationStatus
    reviewed_by: Optional[int]
    review_notes: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    
    # Nested user info
    applicant_name: Optional[str] = None
    applicant_email: Optional[str] = None
    reviewer_name: Optional[str] = None
    
    class Config:
        from_attributes = True


class InstructorApplicationListResponse(BaseModel):
    """Schema for instructor application list response."""
    id: int
    user_id: int
    status: ApplicationStatus
    created_at: datetime
    reviewed_at: Optional[datetime]
    
    # Nested user info
    applicant_name: str
    applicant_email: str
    reviewer_name: Optional[str]
    
    class Config:
        from_attributes = True


class InstructorApplicationStats(BaseModel):
    """Schema for instructor application statistics."""
    total_applications: int
    pending_applications: int
    approved_applications: int
    rejected_applications: int
    applications_this_month: int
    applications_this_week: int


class InstructorApplicationFilters(BaseModel):
    """Schema for filtering instructor applications."""
    status: Optional[ApplicationStatus] = Field(None, description="Filter by application status")
    user_id: Optional[int] = Field(None, description="Filter by specific user")
    created_after: Optional[datetime] = Field(None, description="Filter applications created after this date")
    created_before: Optional[datetime] = Field(None, description="Filter applications created before this date")


class InstructorApplicationPaginatedResponse(BaseModel):
    """Schema for paginated instructor application list response."""
    applications: List[InstructorApplicationListResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool