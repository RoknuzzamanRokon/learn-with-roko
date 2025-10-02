"""
Pydantic schemas for Q&A and discussion operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class QAAnswerBase(BaseModel):
    """Base schema for Q&A answer data."""
    content: str = Field(..., min_length=1, max_length=5000, description="Answer content")


class QAAnswerCreate(QAAnswerBase):
    """Schema for creating a new Q&A answer."""
    question_id: int = Field(..., gt=0, description="ID of the question being answered")


class QAAnswerUpdate(BaseModel):
    """Schema for updating an existing Q&A answer."""
    content: Optional[str] = Field(None, min_length=1, max_length=5000, description="Answer content")


class QAAnswerResponse(QAAnswerBase):
    """Schema for Q&A answer response data."""
    id: int
    user_id: int
    question_id: int
    is_instructor_answer: bool
    is_accepted: bool
    created_at: datetime
    updated_at: datetime
    user_name: str  # Will be populated from user relationship

    class Config:
        from_attributes = True


class QAQuestionBase(BaseModel):
    """Base schema for Q&A question data."""
    title: str = Field(..., min_length=1, max_length=200, description="Question title")
    content: str = Field(..., min_length=1, max_length=5000, description="Question content")
    timestamp: Optional[int] = Field(None, ge=0, description="Video timestamp in seconds")


class QAQuestionCreate(QAQuestionBase):
    """Schema for creating a new Q&A question."""
    lecture_id: int = Field(..., gt=0, description="ID of the lecture")


class QAQuestionUpdate(BaseModel):
    """Schema for updating an existing Q&A question."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    content: Optional[str] = Field(None, min_length=1, max_length=5000)
    timestamp: Optional[int] = Field(None, ge=0)


class QAQuestionResponse(QAQuestionBase):
    """Schema for Q&A question response data."""
    id: int
    user_id: int
    lecture_id: int
    is_answered: bool
    is_featured: bool
    created_at: datetime
    updated_at: datetime
    user_name: str  # Will be populated from user relationship
    answers: List[QAAnswerResponse] = []

    class Config:
        from_attributes = True


class QAQuestionListResponse(BaseModel):
    """Schema for paginated Q&A question list response."""
    questions: List[QAQuestionResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class QASearchFilters(BaseModel):
    """Schema for Q&A search and filtering."""
    lecture_id: Optional[int] = None
    course_id: Optional[int] = None
    is_answered: Optional[bool] = None
    is_featured: Optional[bool] = None
    search: Optional[str] = Field(None, max_length=200, description="Search in question title and content")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")


class QAModerationAction(BaseModel):
    """Schema for Q&A moderation actions."""
    is_featured: Optional[bool] = None
    is_answered: Optional[bool] = None


class QAAnswerModerationAction(BaseModel):
    """Schema for Q&A answer moderation actions."""
    is_accepted: Optional[bool] = None