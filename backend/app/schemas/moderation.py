"""
Moderation schemas for course and content management.
"""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel


class InstructorInfo(BaseModel):
    """Instructor information schema."""
    id: int
    name: str
    email: str
    role: Optional[str] = None
    created_at: Optional[str] = None


class CategoryInfo(BaseModel):
    """Category information schema."""
    id: int
    name: str
    description: Optional[str] = None


class CourseStatistics(BaseModel):
    """Course statistics schema."""
    total_enrollments: int
    completed_enrollments: int
    completion_rate: float
    sections_count: int
    lectures_count: int


class LectureInfo(BaseModel):
    """Lecture information schema."""
    id: int
    title: str
    description: Optional[str] = None
    lecture_type: str
    order_index: int
    duration: int
    is_preview: bool
    is_downloadable: bool


class SectionInfo(BaseModel):
    """Section information schema."""
    id: int
    title: str
    description: Optional[str] = None
    order_index: int
    total_duration: int
    total_lectures: int
    lectures: List[LectureInfo]


class CourseForReview(BaseModel):
    """Course information for review listing."""
    id: int
    title: str
    description: str
    short_description: Optional[str] = None
    status: str
    difficulty_level: str
    price: float
    is_featured: bool
    thumbnail_url: Optional[str] = None
    total_duration: int
    total_lectures: int
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    instructor: InstructorInfo
    category: Optional[CategoryInfo] = None
    enrollment_count: int


class CourseDetailForReview(BaseModel):
    """Detailed course information for review."""
    id: int
    title: str
    description: str
    short_description: Optional[str] = None
    status: str
    difficulty_level: str
    price: float
    is_featured: bool
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None
    total_duration: int
    total_lectures: int
    language: str
    allow_qa: bool
    allow_notes: bool
    created_at: str
    updated_at: str
    published_at: Optional[str] = None
    instructor: InstructorInfo
    category: Optional[CategoryInfo] = None
    statistics: CourseStatistics
    sections: List[SectionInfo]


class PaginationInfo(BaseModel):
    """Pagination information schema."""
    total: int
    limit: int
    offset: int
    has_next: bool
    has_prev: bool


class CoursesForReviewResponse(BaseModel):
    """Response schema for courses for review."""
    courses: List[CourseForReview]
    pagination: PaginationInfo


class CourseStatusUpdate(BaseModel):
    """Request schema for course status update."""
    status: str
    admin_notes: Optional[str] = None


class CourseStatusUpdateResponse(BaseModel):
    """Response schema for course status update."""
    id: int
    title: str
    status: str
    published_at: Optional[str] = None
    updated_at: str


class CourseFeaturedToggle(BaseModel):
    """Request schema for course featured toggle."""
    is_featured: bool


class CourseFeaturedToggleResponse(BaseModel):
    """Response schema for course featured toggle."""
    id: int
    title: str
    is_featured: bool
    updated_at: str


class ModerationStatistics(BaseModel):
    """Moderation statistics schema."""
    course_status: Dict[str, int]
    featured_courses: int
    recent_submissions: int
    courses_needing_review: int


class BulkUpdateRequest(BaseModel):
    """Request schema for bulk course updates."""
    course_ids: List[int]
    action: str  # publish, archive, feature, unfeature
    value: Optional[Any] = None


class BulkUpdateResponse(BaseModel):
    """Response schema for bulk course updates."""
    updated: int
    errors: List[str]