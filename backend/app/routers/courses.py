"""
Course management API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
import math

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.course_service import CourseService
from ..schemas.course import (
    # Course schemas
    CourseCreate,
    CourseUpdate,
    CourseStatusUpdate,
    CourseDetailResponse,
    CourseListResponse,
    CourseFullDetailResponse,
    CourseSearchFilters,
    CourseListPaginatedResponse,
    # Category schemas
    CourseCategoryCreate,
    CourseCategoryUpdate,
    CourseCategoryResponse,
    # Section schemas
    SectionCreate,
    SectionUpdate,
    SectionResponse,
    # Lecture schemas
    LectureCreate,
    LectureUpdate,
    LectureResponse
)

router = APIRouter(prefix="/courses", tags=["courses"])


# Course Category Endpoints
@router.post("/categories", response_model=CourseCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category_data: CourseCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new course category. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create categories"
        )
    
    service = CourseService(db)
    return service.create_category(category_data)


@router.get("/categories", response_model=List[CourseCategoryResponse])
async def get_categories(
    include_inactive: bool = Query(False, description="Include inactive categories"),
    db: Session = Depends(get_db)
):
    """Get all course categories."""
    service = CourseService(db)
    return service.get_categories(include_inactive=include_inactive)


@router.get("/categories/{category_id}", response_model=CourseCategoryResponse)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """Get category by ID."""
    service = CourseService(db)
    category = service.get_category_by_id(category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found"
        )
    return category


@router.put("/categories/{category_id}", response_model=CourseCategoryResponse)
async def update_category(
    category_id: int,
    category_data: CourseCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update course category. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update categories"
        )
    
    service = CourseService(db)
    return service.update_category(category_id, category_data)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete course category. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete categories"
        )
    
    service = CourseService(db)
    service.delete_category(category_id)


# Course Endpoints
@router.post("", response_model=CourseDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_course(
    course_data: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new course. Requires Instructor or Super Admin role."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Instructors and Super Admins can create courses"
        )
    
    service = CourseService(db)
    return service.create_course(course_data, current_user.id)


@router.get("", response_model=CourseListPaginatedResponse)
async def get_courses(
    search: Optional[str] = Query(None, description="Search term"),
    category_id: Optional[int] = Query(None, description="Filter by category"),
    instructor_id: Optional[int] = Query(None, description="Filter by instructor"),
    status: Optional[str] = Query(None, description="Filter by status"),
    difficulty_level: Optional[str] = Query(None, description="Filter by difficulty"),
    is_free: Optional[bool] = Query(None, description="Filter by free courses"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured courses"),
    min_price: Optional[float] = Query(None, description="Minimum price"),
    max_price: Optional[float] = Query(None, description="Maximum price"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """Get courses with filtering and pagination."""
    # Build filters
    filters = CourseSearchFilters(
        search=search,
        category_id=category_id,
        instructor_id=instructor_id,
        status=status,
        difficulty_level=difficulty_level,
        is_free=is_free,
        is_featured=is_featured,
        min_price=min_price,
        max_price=max_price
    )
    
    service = CourseService(db)
    courses, total = service.get_courses(filters, page=page, per_page=per_page)
    
    total_pages = math.ceil(total / per_page)
    
    return CourseListPaginatedResponse(
        courses=[CourseListResponse.model_validate(course) for course in courses],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/my-courses", response_model=CourseListPaginatedResponse)
async def get_my_courses(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get courses created by the current instructor."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Instructors and Super Admins can access this endpoint"
        )
    
    service = CourseService(db)
    courses, total = service.get_courses(
        instructor_id=current_user.id,
        page=page,
        per_page=per_page
    )
    
    total_pages = math.ceil(total / per_page)
    
    return CourseListPaginatedResponse(
        courses=[CourseListResponse.model_validate(course) for course in courses],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )


@router.get("/{course_id}", response_model=CourseFullDetailResponse)
async def get_course(
    course_id: int,
    include_sections: bool = Query(False, description="Include sections and lectures"),
    db: Session = Depends(get_db)
):
    """Get course by ID with optional sections and lectures."""
    service = CourseService(db)
    course = service.get_course_by_id(course_id, include_sections=include_sections)
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if include_sections:
        return CourseFullDetailResponse.model_validate(course)
    else:
        return CourseDetailResponse.model_validate(course)


@router.put("/{course_id}", response_model=CourseDetailResponse)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update course information."""
    service = CourseService(db)
    return service.update_course(course_id, course_data, current_user.id)


@router.put("/{course_id}/status", response_model=CourseDetailResponse)
async def update_course_status(
    course_id: int,
    status_data: CourseStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update course status (publish/unpublish)."""
    service = CourseService(db)
    return service.update_course_status(course_id, status_data, current_user.id)


@router.delete("/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete course."""
    service = CourseService(db)
    service.delete_course(course_id, current_user.id)


# Section Endpoints
@router.post("/{course_id}/sections", response_model=SectionResponse, status_code=status.HTTP_201_CREATED)
async def create_section(
    course_id: int,
    section_data: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new section in a course."""
    service = CourseService(db)
    return service.create_section(course_id, section_data, current_user.id)


@router.get("/{course_id}/sections", response_model=List[SectionResponse])
async def get_course_sections(
    course_id: int,
    db: Session = Depends(get_db)
):
    """Get all sections for a course."""
    service = CourseService(db)
    return service.get_sections_by_course(course_id)


@router.get("/sections/{section_id}", response_model=SectionResponse)
async def get_section(
    section_id: int,
    db: Session = Depends(get_db)
):
    """Get section by ID."""
    service = CourseService(db)
    section = service.get_section_by_id(section_id)
    if not section:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Section not found"
        )
    return section


@router.put("/sections/{section_id}", response_model=SectionResponse)
async def update_section(
    section_id: int,
    section_data: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update section information."""
    service = CourseService(db)
    return service.update_section(section_id, section_data, current_user.id)


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete section."""
    service = CourseService(db)
    service.delete_section(section_id, current_user.id)


# Lecture Endpoints
@router.post("/sections/{section_id}/lectures", response_model=LectureResponse, status_code=status.HTTP_201_CREATED)
async def create_lecture(
    section_id: int,
    lecture_data: LectureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new lecture in a section."""
    service = CourseService(db)
    return service.create_lecture(section_id, lecture_data, current_user.id)


@router.get("/sections/{section_id}/lectures", response_model=List[LectureResponse])
async def get_section_lectures(
    section_id: int,
    db: Session = Depends(get_db)
):
    """Get all lectures for a section."""
    service = CourseService(db)
    return service.get_lectures_by_section(section_id)


@router.get("/lectures/{lecture_id}", response_model=LectureResponse)
async def get_lecture(
    lecture_id: int,
    db: Session = Depends(get_db)
):
    """Get lecture by ID."""
    service = CourseService(db)
    lecture = service.get_lecture_by_id(lecture_id)
    if not lecture:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture not found"
        )
    return lecture


@router.put("/lectures/{lecture_id}", response_model=LectureResponse)
async def update_lecture(
    lecture_id: int,
    lecture_data: LectureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update lecture information."""
    service = CourseService(db)
    return service.update_lecture(lecture_id, lecture_data, current_user.id)


@router.delete("/lectures/{lecture_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lecture(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete lecture."""
    service = CourseService(db)
    service.delete_lecture(lecture_id, current_user.id)