"""
Pydantic schemas for quiz and assessment operations.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from ..models.assessment import QuestionType


class QuestionBase(BaseModel):
    """Base schema for question data."""
    question_text: str = Field(..., min_length=1, max_length=2000, description="Question text")
    question_type: QuestionType = Field(..., description="Type of question")
    order_index: int = Field(..., ge=0, description="Order of question in quiz")
    points: float = Field(1.0, ge=0, description="Points for correct answer")
    options: Optional[List[str]] = Field(None, description="Options for multiple choice questions")
    correct_answer: str = Field(..., min_length=1, description="Correct answer")
    explanation: Optional[str] = Field(None, max_length=1000, description="Explanation for correct answer")


class QuestionCreate(QuestionBase):
    """Schema for creating a new question."""
    pass


class QuestionUpdate(BaseModel):
    """Schema for updating an existing question."""
    question_text: Optional[str] = Field(None, min_length=1, max_length=2000)
    question_type: Optional[QuestionType] = None
    order_index: Optional[int] = Field(None, ge=0)
    points: Optional[float] = Field(None, ge=0)
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = Field(None, min_length=1)
    explanation: Optional[str] = Field(None, max_length=1000)


class QuestionResponse(QuestionBase):
    """Schema for question response data."""
    id: int
    quiz_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuizBase(BaseModel):
    """Base schema for quiz data."""
    title: str = Field(..., min_length=1, max_length=200, description="Quiz title")
    description: Optional[str] = Field(None, max_length=2000, description="Quiz description")
    time_limit: Optional[int] = Field(None, ge=1, description="Time limit in minutes")
    max_attempts: int = Field(1, ge=1, le=10, description="Maximum attempts allowed")
    passing_score: float = Field(70.0, ge=0, le=100, description="Passing score percentage")
    show_correct_answers: bool = Field(True, description="Show correct answers after completion")
    randomize_questions: bool = Field(False, description="Randomize question order")


class QuizCreate(QuizBase):
    """Schema for creating a new quiz."""
    course_id: int = Field(..., gt=0, description="ID of the course")


class QuizUpdate(BaseModel):
    """Schema for updating an existing quiz."""
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=2000)
    time_limit: Optional[int] = Field(None, ge=1)
    max_attempts: Optional[int] = Field(None, ge=1, le=10)
    passing_score: Optional[float] = Field(None, ge=0, le=100)
    show_correct_answers: Optional[bool] = None
    randomize_questions: Optional[bool] = None
    is_published: Optional[bool] = None


class QuizResponse(QuizBase):
    """Schema for quiz response data."""
    id: int
    course_id: int
    is_published: bool
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionResponse] = []

    class Config:
        from_attributes = True


class QuizSummaryResponse(QuizBase):
    """Schema for quiz summary response (without questions)."""
    id: int
    course_id: int
    is_published: bool
    question_count: int
    total_points: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class QuizAttemptAnswer(BaseModel):
    """Schema for a single question answer in a quiz attempt."""
    question_id: int = Field(..., gt=0, description="ID of the question")
    answer: str = Field(..., description="User's answer")


class QuizAttemptSubmission(BaseModel):
    """Schema for submitting a quiz attempt."""
    answers: List[QuizAttemptAnswer] = Field(..., description="List of answers")


class QuizAttemptResponse(BaseModel):
    """Schema for quiz attempt response data."""
    id: int
    user_id: int
    quiz_id: int
    attempt_number: int
    score: Optional[float]
    total_points: float
    earned_points: float
    is_completed: bool
    is_passed: bool
    started_at: datetime
    completed_at: Optional[datetime]
    time_taken: Optional[int]

    class Config:
        from_attributes = True


class QuizAttemptDetailResponse(QuizAttemptResponse):
    """Schema for detailed quiz attempt response with answers."""
    answers: Optional[Dict[str, Any]]
    quiz: QuizSummaryResponse

    class Config:
        from_attributes = True


class QuizResultResponse(BaseModel):
    """Schema for quiz result with feedback."""
    attempt: QuizAttemptResponse
    questions: List[Dict[str, Any]]  # Questions with user answers and feedback
    can_retake: bool
    next_attempt_number: Optional[int]


class QuizListResponse(BaseModel):
    """Schema for paginated quiz list response."""
    quizzes: List[QuizSummaryResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool