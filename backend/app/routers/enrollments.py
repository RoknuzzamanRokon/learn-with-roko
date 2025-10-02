"""
Enrollment management API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..services.enrollment_service import EnrollmentService
from ..schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentResponse,
    CourseProgressResponse,
    LectureProgressResponse,
    LectureProgressUpdate,
    PaymentIntentCreate,
    PaymentIntentResponse
)

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.post("", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED)
async def enroll_in_course(
    enrollment_data: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enroll current user in a course."""
    service = EnrollmentService(db)
    return service.enroll_user_in_course(current_user.id, enrollment_data)


@router.get("", response_model=List[EnrollmentResponse])
async def get_my_enrollments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all enrollments for the current user."""
    service = EnrollmentService(db)
    return service.get_user_enrollments(current_user.id)


@router.get("/{course_id}", response_model=EnrollmentResponse)
async def get_enrollment(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get specific enrollment for current user and course."""
    service = EnrollmentService(db)
    enrollment = service.get_enrollment(current_user.id, course_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found"
        )
    return enrollment


@router.get("/{course_id}/progress", response_model=CourseProgressResponse)
async def get_course_progress(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get course progress for current user."""
    service = EnrollmentService(db)
    progress = service.get_course_progress(current_user.id, course_id)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course progress not found"
        )
    return progress


@router.put("/lectures/{lecture_id}/progress", response_model=LectureProgressResponse)
async def update_lecture_progress(
    lecture_id: int,
    progress_data: LectureProgressUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update lecture progress for current user."""
    service = EnrollmentService(db)
    return service.update_lecture_progress(current_user.id, lecture_id, progress_data)


@router.get("/lectures/{lecture_id}/progress", response_model=LectureProgressResponse)
async def get_lecture_progress(
    lecture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get lecture progress for current user."""
    service = EnrollmentService(db)
    progress = service.get_lecture_progress(current_user.id, lecture_id)
    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lecture progress not found"
        )
    return progress


@router.post("/payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create payment intent for course purchase."""
    service = EnrollmentService(db)
    return service.create_payment_intent(current_user.id, payment_data)


@router.post("/enroll-with-payment", response_model=EnrollmentResponse)
async def enroll_with_payment(
    enrollment_data: EnrollmentCreate,
    payment_intent_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enroll user after successful payment."""
    service = EnrollmentService(db)
    return service.enroll_with_payment(current_user.id, enrollment_data, payment_intent_id)