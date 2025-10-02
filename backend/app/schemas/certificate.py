"""
Certificate schemas for API requests and responses.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CertificateBase(BaseModel):
    """Base certificate schema."""
    title: str
    description: Optional[str] = None


class CertificateCreate(CertificateBase):
    """Schema for creating certificates."""
    user_id: int
    course_id: int


class CertificateResponse(CertificateBase):
    """Schema for certificate responses."""
    id: int
    user_id: int
    course_id: int
    certificate_id: str
    verification_code: str
    certificate_url: Optional[str] = None
    is_verified: bool
    issued_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CertificateWithDetails(CertificateResponse):
    """Certificate response with user and course details."""
    user_name: str
    course_title: str
    instructor_name: str

    class Config:
        from_attributes = True


class CompletionStatus(BaseModel):
    """Schema for course completion status."""
    completed: bool
    lectures_completed: bool
    quizzes_passed: bool
    lecture_progress: dict
    quiz_details: list
    completion_percentage: float
    error: Optional[str] = None


class CertificateVerification(BaseModel):
    """Schema for certificate verification."""
    valid: bool
    certificate: Optional[CertificateWithDetails] = None
    message: str