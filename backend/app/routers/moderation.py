"""
Moderation router for course and content management.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.moderation_service import ModerationService
from ..schemas.moderation import (
    CoursesForReviewResponse,
    CourseDetailForReview,
    CourseStatusUpdate,
    CourseStatusUpdateResponse,
    CourseFeaturedToggle,
    CourseFeaturedToggleResponse,
    ModerationStatistics,
    BulkUpdateRequest,
    BulkUpdateResponse
)

router = APIRouter(prefix="/moderation", tags=["moderation"])


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user


@router.get("/courses", response_model=CoursesForReviewResponse)
async def get_courses_for_review(
    status: Optional[str] = Query(None, description="Filter by course status"),
    search: Optional[str] = Query(None, description="Search term for course title or instructor"),
    instructor_id: Optional[int] = Query(None, description="Filter by instructor ID"),
    limit: int = Query(50, ge=1, le=100, description="Number of courses to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get courses that need review or moderation.
    
    Args:
        status: Filter by course status (draft, published, archived)
        search: Search term for course title, description, or instructor name
        instructor_id: Filter by specific instructor
        limit: Number of courses to return (1-100)
        offset: Offset for pagination
        
    Returns:
        List of courses with pagination info
    """
    try:
        result = ModerationService.get_courses_for_review(
            db, status, search, instructor_id, limit, offset
        )
        return CoursesForReviewResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch courses for review: {str(e)}"
        )


@router.get("/courses/{course_id}", response_model=CourseDetailForReview)
async def get_course_details_for_review(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get detailed course information for review.
    
    Args:
        course_id: Course ID to get details for
        
    Returns:
        Detailed course information including sections and statistics
    """
    try:
        course_details = ModerationService.get_course_details_for_review(db, course_id)
        return CourseDetailForReview(**course_details)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch course details: {str(e)}"
        )


@router.put("/courses/{course_id}/status", response_model=CourseStatusUpdateResponse)
async def update_course_status(
    course_id: int,
    status_update: CourseStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Update course status (approve, reject, hide, etc.).
    
    Args:
        course_id: Course ID to update
        status_update: New status and optional admin notes
        
    Returns:
        Updated course information
    """
    try:
        result = ModerationService.update_course_status(
            db, course_id, status_update.status, status_update.admin_notes
        )
        return CourseStatusUpdateResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update course status: {str(e)}"
        )


@router.put("/courses/{course_id}/featured", response_model=CourseFeaturedToggleResponse)
async def toggle_course_featured(
    course_id: int,
    featured_toggle: CourseFeaturedToggle,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Toggle course featured status.
    
    Args:
        course_id: Course ID to update
        featured_toggle: Whether to feature or unfeature the course
        
    Returns:
        Updated course featured status
    """
    try:
        result = ModerationService.toggle_course_featured(
            db, course_id, featured_toggle.is_featured
        )
        return CourseFeaturedToggleResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to toggle course featured status: {str(e)}"
        )


@router.get("/statistics", response_model=ModerationStatistics)
async def get_moderation_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get moderation statistics for admin dashboard.
    
    Returns:
        Moderation statistics including course counts and review metrics
    """
    try:
        stats = ModerationService.get_moderation_statistics(db)
        return ModerationStatistics(**stats)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch moderation statistics: {str(e)}"
        )


@router.post("/courses/bulk-update", response_model=BulkUpdateResponse)
async def bulk_update_courses(
    bulk_update: BulkUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Perform bulk actions on multiple courses.
    
    Args:
        bulk_update: Bulk update request with course IDs and action
        
    Returns:
        Results of bulk operation including success count and errors
    """
    try:
        result = ModerationService.bulk_update_courses(
            db, bulk_update.course_ids, bulk_update.action, bulk_update.value
        )
        return BulkUpdateResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to perform bulk update: {str(e)}"
        )