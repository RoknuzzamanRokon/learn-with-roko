"""
Instructor application service for handling instructor role applications.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func, extract
from fastapi import HTTPException, status
from datetime import datetime, timedelta

from ..models.instructor_application import InstructorApplication, ApplicationStatus
from ..models.user import User, UserRole
from ..schemas.instructor_application import (
    InstructorApplicationCreate,
    InstructorApplicationUpdate,
    InstructorApplicationReview,
    InstructorApplicationFilters,
    InstructorApplicationStats
)


class InstructorApplicationService:
    """Service class for instructor application management."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_application(self, user_id: int, application_data: InstructorApplicationCreate) -> InstructorApplication:
        """
        Create a new instructor application.
        
        Args:
            user_id: ID of the user applying
            application_data: Application data
            
        Returns:
            InstructorApplication: Created application
            
        Raises:
            HTTPException: If user not found, already instructor, or has pending application
        """
        # Check if user exists and is a learner
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.role != UserRole.LEARNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only learners can apply to become instructors"
            )
        
        # Check if user already has a pending application
        existing_application = self.db.query(InstructorApplication).filter(
            and_(
                InstructorApplication.user_id == user_id,
                InstructorApplication.status == ApplicationStatus.PENDING
            )
        ).first()
        
        if existing_application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a pending instructor application"
            )
        
        # Create application
        application = InstructorApplication(
            user_id=user_id,
            motivation=application_data.motivation,
            experience=application_data.experience,
            expertise_areas=application_data.expertise_areas,
            sample_course_outline=application_data.sample_course_outline,
            status=ApplicationStatus.PENDING
        )
        
        self.db.add(application)
        self.db.commit()
        self.db.refresh(application)
        
        return application
    
    def get_application_by_id(self, application_id: int) -> Optional[InstructorApplication]:
        """
        Get application by ID with user relationships.
        
        Args:
            application_id: Application ID
            
        Returns:
            Optional[InstructorApplication]: Application if found
        """
        return self.db.query(InstructorApplication).options(
            joinedload(InstructorApplication.applicant),
            joinedload(InstructorApplication.reviewer)
        ).filter(InstructorApplication.id == application_id).first()
    
    def get_user_applications(self, user_id: int) -> List[InstructorApplication]:
        """
        Get all applications for a specific user.
        
        Args:
            user_id: User ID
            
        Returns:
            List[InstructorApplication]: User's applications
        """
        return self.db.query(InstructorApplication).options(
            joinedload(InstructorApplication.reviewer)
        ).filter(InstructorApplication.user_id == user_id).order_by(
            InstructorApplication.created_at.desc()
        ).all()
    
    def update_application(
        self, 
        application_id: int, 
        user_id: int, 
        application_data: InstructorApplicationUpdate
    ) -> InstructorApplication:
        """
        Update an instructor application (applicant only, pending applications only).
        
        Args:
            application_id: Application ID
            user_id: User ID (must be the applicant)
            application_data: Updated application data
            
        Returns:
            InstructorApplication: Updated application
            
        Raises:
            HTTPException: If application not found, not owned by user, or not pending
        """
        application = self.get_application_by_id(application_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        if application.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own applications"
            )
        
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can only update pending applications"
            )
        
        # Update application fields
        update_data = application_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(application, field, value)
        
        self.db.commit()
        self.db.refresh(application)
        
        return application
    
    def review_application(
        self, 
        application_id: int, 
        reviewer_id: int, 
        review_data: InstructorApplicationReview
    ) -> InstructorApplication:
        """
        Review an instructor application (admin only).
        
        Args:
            application_id: Application ID
            reviewer_id: ID of the reviewing admin
            review_data: Review data
            
        Returns:
            InstructorApplication: Reviewed application
            
        Raises:
            HTTPException: If application not found or not pending
        """
        application = self.get_application_by_id(application_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application has already been reviewed"
            )
        
        # Update application with review
        application.status = review_data.status
        application.review_notes = review_data.review_notes
        application.reviewed_by = reviewer_id
        application.reviewed_at = datetime.utcnow()
        
        # If approved, upgrade user role to instructor
        if review_data.status == ApplicationStatus.APPROVED:
            user = self.db.query(User).filter(User.id == application.user_id).first()
            if user:
                user.role = UserRole.INSTRUCTOR
        
        self.db.commit()
        self.db.refresh(application)
        
        return application
    
    def delete_application(self, application_id: int, user_id: int) -> bool:
        """
        Delete an instructor application (applicant only, pending applications only).
        
        Args:
            application_id: Application ID
            user_id: User ID (must be the applicant)
            
        Returns:
            bool: True if deleted successfully
            
        Raises:
            HTTPException: If application not found, not owned by user, or not pending
        """
        application = self.get_application_by_id(application_id)
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        if application.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own applications"
            )
        
        if application.status != ApplicationStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You can only delete pending applications"
            )
        
        self.db.delete(application)
        self.db.commit()
        
        return True
    
    def search_applications(
        self,
        filters: InstructorApplicationFilters,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[InstructorApplication], int]:
        """
        Search and filter instructor applications with pagination.
        
        Args:
            filters: Search and filter criteria
            page: Page number (1-based)
            per_page: Number of applications per page
            
        Returns:
            Tuple[List[InstructorApplication], int]: List of applications and total count
        """
        query = self.db.query(InstructorApplication).options(
            joinedload(InstructorApplication.applicant),
            joinedload(InstructorApplication.reviewer)
        )
        
        # Apply status filter
        if filters.status:
            query = query.filter(InstructorApplication.status == filters.status)
        
        # Apply user filter
        if filters.user_id:
            query = query.filter(InstructorApplication.user_id == filters.user_id)
        
        # Apply date filters
        if filters.created_after:
            query = query.filter(InstructorApplication.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.filter(InstructorApplication.created_at <= filters.created_before)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * per_page
        applications = query.order_by(InstructorApplication.created_at.desc()).offset(offset).limit(per_page).all()
        
        return applications, total
    
    def get_application_stats(self) -> InstructorApplicationStats:
        """
        Get instructor application statistics.
        
        Returns:
            InstructorApplicationStats: Application statistics
        """
        # Get current date for time-based filters
        now = datetime.utcnow()
        month_ago = now - timedelta(days=30)
        week_ago = now - timedelta(days=7)
        
        # Total applications
        total_applications = self.db.query(InstructorApplication).count()
        
        # Applications by status
        pending_applications = self.db.query(InstructorApplication).filter(
            InstructorApplication.status == ApplicationStatus.PENDING
        ).count()
        
        approved_applications = self.db.query(InstructorApplication).filter(
            InstructorApplication.status == ApplicationStatus.APPROVED
        ).count()
        
        rejected_applications = self.db.query(InstructorApplication).filter(
            InstructorApplication.status == ApplicationStatus.REJECTED
        ).count()
        
        # New applications
        applications_this_month = self.db.query(InstructorApplication).filter(
            InstructorApplication.created_at >= month_ago
        ).count()
        
        applications_this_week = self.db.query(InstructorApplication).filter(
            InstructorApplication.created_at >= week_ago
        ).count()
        
        return InstructorApplicationStats(
            total_applications=total_applications,
            pending_applications=pending_applications,
            approved_applications=approved_applications,
            rejected_applications=rejected_applications,
            applications_this_month=applications_this_month,
            applications_this_week=applications_this_week
        )