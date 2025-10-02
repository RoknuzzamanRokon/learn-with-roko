"""
Pydantic schemas for course management endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from ..models.course import CourseStatus, DifficultyLevel, LectureType


# Course Category Schemas
class CourseCategoryCreate(BaseModel):
    """Schema for creating a new course category."""
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    parent_id: Optional[int] = Field(None, description="Parent category ID for subcategories")


class CourseCategoryUpdate(BaseModel):
    """Schema for updating course category."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(None, description="Category description")
    parent_id: Optional[int] = Field(None, description="Parent category ID")
    is_active: Optional[bool] = Field(None, description="Whether category is active")


class CourseCategoryResponse(BaseModel):
    """Schema for course category response."""
    id: int
    name: str
    description: Optional[str]
    parent_id: Optional[int]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Course Schemas
class CourseCreate(BaseModel):
    """Schema for creating a new course."""
    title: str = Field(..., min_length=1, max_length=200, description="Course title")
    description: str = Field(..., min_length=1, description="Course description")
    short_description: Optional[str] = Field(None, max_length=500, description="Short course description")
    category_id: Optional[int] = Field(None, description="Course category ID")
    price: Decimal = Field(0.00, ge=0, description="Course price")
    difficulty_level: DifficultyLevel = Field(DifficultyLevel.BEGINNER, description="Course difficulty level")
    language: str = Field("en", max_length=10, description="Course language")
    thumbnail_url: Optional[str] = Field(None, description="Course thumbnail URL")
    preview_video_url: Optional[str] = Field(None, description="Course preview video URL")
    allow_qa: bool = Field(True, description="Allow Q&A for this course")
    allow_notes: bool = Field(True, description="Allow notes for this course")


class CourseUpdate(BaseModel):
    """Schema for updating course information."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Course title")
    description: Optional[str] = Field(None, min_length=1, description="Course description")
    short_description: Optional[str] = Field(None, max_length=500, description="Short course description")
    category_id: Optional[int] = Field(None, description="Course category ID")
    price: Optional[Decimal] = Field(None, ge=0, description="Course price")
    difficulty_level: Optional[DifficultyLevel] = Field(None, description="Course difficulty level")
    language: Optional[str] = Field(None, max_length=10, description="Course language")
    thumbnail_url: Optional[str] = Field(None, description="Course thumbnail URL")
    preview_video_url: Optional[str] = Field(None, description="Course preview video URL")
    allow_qa: Optional[bool] = Field(None, description="Allow Q&A for this course")
    allow_notes: Optional[bool] = Field(None, description="Allow notes for this course")


class CourseStatusUpdate(BaseModel):
    """Schema for updating course status."""
    status: CourseStatus = Field(..., description="New course status")


class CourseDetailResponse(BaseModel):
    """Schema for detailed course response."""
    id: int
    title: str
    description: str
    short_description: Optional[str]
    instructor_id: int
    category_id: Optional[int]
    price: Decimal
    status: CourseStatus
    difficulty_level: DifficultyLevel
    thumbnail_url: Optional[str]
    preview_video_url: Optional[str]
    total_duration: int
    total_lectures: int
    language: str
    is_featured: bool
    allow_qa: bool
    allow_notes: bool
    created_at: datetime
    updated_at: datetime
    published_at: Optional[datetime]
    is_free: bool
    is_published: bool
    
    class Config:
        from_attributes = True


class CourseListResponse(BaseModel):
    """Schema for course list response."""
    id: int
    title: str
    short_description: Optional[str]
    instructor_id: int
    category_id: Optional[int]
    price: Decimal
    status: CourseStatus
    difficulty_level: DifficultyLevel
    thumbnail_url: Optional[str]
    total_duration: int
    total_lectures: int
    is_featured: bool
    created_at: datetime
    published_at: Optional[datetime]
    is_free: bool
    is_published: bool
    
    class Config:
        from_attributes = True


# Section Schemas
class SectionCreate(BaseModel):
    """Schema for creating a new section."""
    title: str = Field(..., min_length=1, max_length=200, description="Section title")
    description: Optional[str] = Field(None, description="Section description")
    order_index: int = Field(0, ge=0, description="Section order index")


class SectionUpdate(BaseModel):
    """Schema for updating section information."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Section title")
    description: Optional[str] = Field(None, description="Section description")
    order_index: Optional[int] = Field(None, ge=0, description="Section order index")


class SectionResponse(BaseModel):
    """Schema for section response."""
    id: int
    title: str
    description: Optional[str]
    course_id: int
    order_index: int
    total_duration: int
    total_lectures: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Lecture Schemas
class LectureCreate(BaseModel):
    """Schema for creating a new lecture."""
    title: str = Field(..., min_length=1, max_length=200, description="Lecture title")
    description: Optional[str] = Field(None, description="Lecture description")
    lecture_type: LectureType = Field(LectureType.VIDEO, description="Lecture type")
    order_index: int = Field(0, ge=0, description="Lecture order index")
    duration: int = Field(0, ge=0, description="Lecture duration in minutes")
    video_url: Optional[str] = Field(None, description="Video URL")
    content_url: Optional[str] = Field(None, description="Content URL for PDFs, documents, etc.")
    is_preview: bool = Field(False, description="Whether this is a free preview")
    is_downloadable: bool = Field(False, description="Whether content is downloadable")


class LectureUpdate(BaseModel):
    """Schema for updating lecture information."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Lecture title")
    description: Optional[str] = Field(None, description="Lecture description")
    lecture_type: Optional[LectureType] = Field(None, description="Lecture type")
    order_index: Optional[int] = Field(None, ge=0, description="Lecture order index")
    duration: Optional[int] = Field(None, ge=0, description="Lecture duration in minutes")
    video_url: Optional[str] = Field(None, description="Video URL")
    content_url: Optional[str] = Field(None, description="Content URL")
    is_preview: Optional[bool] = Field(None, description="Whether this is a free preview")
    is_downloadable: Optional[bool] = Field(None, description="Whether content is downloadable")


class LectureResponse(BaseModel):
    """Schema for lecture response."""
    id: int
    title: str
    description: Optional[str]
    section_id: int
    lecture_type: LectureType
    order_index: int
    duration: int
    video_url: Optional[str]
    content_url: Optional[str]
    is_preview: bool
    is_downloadable: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Search and Filter Schemas
class CourseSearchFilters(BaseModel):
    """Schema for course search and filtering."""
    search: Optional[str] = Field(None, description="Search term for title or description")
    category_id: Optional[int] = Field(None, description="Filter by category")
    instructor_id: Optional[int] = Field(None, description="Filter by instructor")
    status: Optional[CourseStatus] = Field(None, description="Filter by status")
    difficulty_level: Optional[DifficultyLevel] = Field(None, description="Filter by difficulty")
    is_free: Optional[bool] = Field(None, description="Filter by free/paid courses")
    is_featured: Optional[bool] = Field(None, description="Filter by featured courses")
    min_price: Optional[Decimal] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[Decimal] = Field(None, ge=0, description="Maximum price filter")


class CourseListPaginatedResponse(BaseModel):
    """Schema for paginated course list response."""
    courses: List[CourseListResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


# Detailed Course with Sections and Lectures
class LectureDetailResponse(LectureResponse):
    """Extended lecture response with additional details."""
    pass


class SectionDetailResponse(SectionResponse):
    """Extended section response with lectures."""
    lectures: List[LectureDetailResponse] = []


class CourseFullDetailResponse(CourseDetailResponse):
    """Extended course response with sections and lectures."""
    sections: List[SectionDetailResponse] = []
    category: Optional[CourseCategoryResponse] = None