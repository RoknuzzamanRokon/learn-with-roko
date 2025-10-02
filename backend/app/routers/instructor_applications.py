"""
Instructor application API endpoints for applying to become an instructor.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..schemas.instructor_application import (
    InstructorApplicationCreate,
    InstructorApplicationUpdate,
    InstructorApplicationReview,
    InstructorApplicationResponse,
    InstructorApplicationListResponse,
    InstructorApplicationFilters,
    InstructorApplicationPaginatedResponse,
    InstructorApplicationStats,
    ApplicationStatus
)
from ..schemas.auth import MessageResponse
from ..services.instructor_application_service import InstructorApplicationService
from ..dependencies import (
    get_current_active_user,
    get_current_super_admin
)
from ..models.user import User

router = APIRouter(prefix="/instructor-applications", tags=["Instructor Applications"])


@router.post("/", response_model=InstructorApplicationResponse, status_code=status.HTTP_201_CREATED)
def create_instructor_application(
    application_data: InstructorApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new instructor application.
    
    - **motivation**: Why you want to become an instructor (50-2000 characters)
    - **experience**: Your relevant experience and background (50-2000 characters)
    - **expertise_areas**: Areas you want to teach (20-1000 characters)
    - **sample_course_outline**: Optional sample course outline (max 3000 characters)
    
    Only learners can apply to become instructors.
    Users can only have one pending application at a time.
    """
    service = InstructorApplicationService(db)
    application = service.create_application(current_user.id, application_data)
    
    # Build response with user info
    response = InstructorApplicationResponse.from_orm(application)
    response.applicant_name = application.applicant.full_name
    response.applicant_email = application.applicant.email
    
    return response


@router.get("/", response_model=InstructorApplicationPaginatedResponse)
def list_instructor_applications(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Applications per page"),
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter by application status"),
    user_id: Optional[int] = Query(None, description="Filter by specific user"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    List all instructor applications with filtering (Super Admin only).
    
    Supports pagination and filtering by:
    - **status**: Filter by application status (pending, approved, rejected)
    - **user_id**: Filter by specific user
    - **page**: Page number (starts from 1)
    - **per_page**: Number of applications per page (max 100)
    
    Returns paginated list of applications with metadata.
    """
    filters = InstructorApplicationFilters(
        status=status_filter,
        user_id=user_id
    )
    
    service = InstructorApplicationService(db)
    applications, total = service.search_applications(filters, page, per_page)
    
    # Calculate pagination metadata
    total_pages = (total + per_page - 1) // per_page
    has_next = page < total_pages
    has_prev = page > 1
    
    # Build response list with user info
    application_responses = []
    for app in applications:
        response = InstructorApplicationListResponse.from_orm(app)
        response.applicant_name = app.applicant.full_name
        response.applicant_email = app.applicant.email
        response.reviewer_name = app.reviewer.full_name if app.reviewer else None
        application_responses.append(response)
    
    return InstructorApplicationPaginatedResponse(
        applications=application_responses,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )


@router.get("/stats", response_model=InstructorApplicationStats)
def get_instructor_application_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Get instructor application statistics (Super Admin only).
    
    Returns comprehensive application statistics including:
    - Total applications count
    - Applications by status
    - New applications this month/week
    """
    service = InstructorApplicationService(db)
    return service.get_application_stats()


@router.get("/my-applications", response_model=list[InstructorApplicationResponse])
def get_my_instructor_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's instructor applications.
    
    Returns all applications submitted by the current user,
    ordered by creation date (newest first).
    """
    service = InstructorApplicationService(db)
    applications = service.get_user_applications(current_user.id)
    
    # Build response list with user info
    responses = []
    for app in applications:
        response = InstructorApplicationResponse.from_orm(app)
        response.applicant_name = app.applicant.full_name
        response.applicant_email = app.applicant.email
        response.reviewer_name = app.reviewer.full_name if app.reviewer else None
        responses.append(response)
    
    return responses


@router.get("/{application_id}", response_model=InstructorApplicationResponse)
def get_instructor_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get instructor application details by ID.
    
    - **application_id**: ID of the application to retrieve
    
    Users can view their own applications.
    Super Admins can view any application.
    """
    service = InstructorApplicationService(db)
    application = service.get_application_by_id(application_id)
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check permissions
    if current_user.role.value != "super_admin" and current_user.id != application.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this application"
        )
    
    # Build response with user info
    response = InstructorApplicationResponse.from_orm(application)
    response.applicant_name = application.applicant.full_name
    response.applicant_email = application.applicant.email
    response.reviewer_name = application.reviewer.full_name if application.reviewer else None
    
    return response


@router.put("/{application_id}", response_model=InstructorApplicationResponse)
def update_instructor_application(
    application_id: int,
    application_data: InstructorApplicationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update an instructor application.
    
    - **application_id**: ID of the application to update
    - **motivation**: Updated motivation (optional)
    - **experience**: Updated experience (optional)
    - **expertise_areas**: Updated expertise areas (optional)
    - **sample_course_outline**: Updated course outline (optional)
    
    Users can only update their own pending applications.
    """
    service = InstructorApplicationService(db)
    application = service.update_application(application_id, current_user.id, application_data)
    
    # Build response with user info
    response = InstructorApplicationResponse.from_orm(application)
    response.applicant_name = application.applicant.full_name
    response.applicant_email = application.applicant.email
    
    return response


@router.put("/{application_id}/review", response_model=InstructorApplicationResponse)
def review_instructor_application(
    application_id: int,
    review_data: InstructorApplicationReview,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Review an instructor application (Super Admin only).
    
    - **application_id**: ID of the application to review
    - **status**: New status (approved or rejected)
    - **review_notes**: Optional review notes
    
    If approved, the user's role will be automatically upgraded to instructor.
    Only pending applications can be reviewed.
    """
    service = InstructorApplicationService(db)
    application = service.review_application(application_id, current_user.id, review_data)
    
    # Build response with user info
    response = InstructorApplicationResponse.from_orm(application)
    response.applicant_name = application.applicant.full_name
    response.applicant_email = application.applicant.email
    response.reviewer_name = application.reviewer.full_name if application.reviewer else None
    
    return response


@router.delete("/{application_id}", response_model=MessageResponse)
def delete_instructor_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an instructor application.
    
    - **application_id**: ID of the application to delete
    
    Users can only delete their own pending applications.
    This action cannot be undone.
    """
    service = InstructorApplicationService(db)
    service.delete_application(application_id, current_user.id)
    
    return MessageResponse(message="Application deleted successfully")