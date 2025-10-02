"""
Pydantic schemas for enrollment management endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# Enrollment Schemas
class EnrollmentCreate(BaseModel):
    """Schema for creating a new enrollment."""
    course_id: int = Field(..., description="Course ID to enroll in")


class EnrollmentResponse(BaseModel):
    """Schema for enrollment response."""
    id: int
    user_id: int
    course_id: int
    progress_percentage: float
    is_completed: bool
    enrolled_at: datetime
    completed_at: Optional[datetime]
    last_accessed: Optional[datetime]
    
    class Config:
        from_attributes = True


class CourseProgressResponse(BaseModel):
    """Schema for course progress response."""
    id: int
    user_id: int
    course_id: int
    completed_lectures: int
    total_lectures: int
    completed_quizzes: int
    total_quizzes: int
    total_watch_time: int
    current_section_id: Optional[int]
    current_lecture_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    completion_percentage: float
    
    class Config:
        from_attributes = True


class LectureProgressResponse(BaseModel):
    """Schema for lecture progress response."""
    id: int
    user_id: int
    lecture_id: int
    is_completed: bool
    watch_time: int
    last_position: int
    started_at: datetime
    completed_at: Optional[datetime]
    last_accessed: datetime
    
    class Config:
        from_attributes = True


class LectureProgressUpdate(BaseModel):
    """Schema for updating lecture progress."""
    watch_time: Optional[int] = Field(None, ge=0, description="Watch time in seconds")
    last_position: Optional[int] = Field(None, ge=0, description="Last position in seconds")
    is_completed: Optional[bool] = Field(None, description="Whether lecture is completed")


# Payment-related schemas (for future Stripe integration)
class PaymentIntentCreate(BaseModel):
    """Schema for creating payment intent."""
    course_id: int = Field(..., description="Course ID to purchase")
    
    
class PaymentIntentResponse(BaseModel):
    """Schema for payment intent response."""
    client_secret: str = Field(..., description="Stripe client secret")
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(..., description="Currency code")