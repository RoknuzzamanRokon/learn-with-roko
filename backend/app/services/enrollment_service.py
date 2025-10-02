"""
Enrollment service for handling course enrollment and progress tracking.
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
from datetime import datetime

from ..models.enrollment import Enrollment, CourseProgress, LectureProgress
from ..models.course import Course, CourseStatus
from ..models.user import User
from ..schemas.enrollment import (
    EnrollmentCreate,
    LectureProgressUpdate,
    PaymentIntentCreate,
    PaymentIntentResponse
)


class EnrollmentService:
    """Service class for enrollment management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def enroll_user_in_course(self, user_id: int, enrollment_data: EnrollmentCreate) -> Enrollment:
        """
        Enroll a user in a course.
        
        Args:
            user_id: ID of the user to enroll
            enrollment_data: Enrollment creation data
            
        Returns:
            Enrollment: Created enrollment
            
        Raises:
            HTTPException: If course not found, not published, or user already enrolled
        """
        # Check if course exists and is published
        course = self.db.query(Course).filter(
            and_(
                Course.id == enrollment_data.course_id,
                Course.status == CourseStatus.PUBLISHED
            )
        ).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or not available for enrollment"
            )
        
        # Check if user is already enrolled
        existing_enrollment = self.db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == enrollment_data.course_id
            )
        ).first()
        if existing_enrollment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already enrolled in this course"
            )
        
        # Create enrollment
        enrollment = Enrollment(
            user_id=user_id,
            course_id=enrollment_data.course_id
        )
        self.db.add(enrollment)
        
        # Create initial course progress
        course_progress = CourseProgress(
            user_id=user_id,
            course_id=enrollment_data.course_id,
            total_lectures=course.total_lectures,
            total_quizzes=0  # Will be updated when quizzes are implemented
        )
        self.db.add(course_progress)
        
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment
    
    def get_user_enrollments(self, user_id: int) -> List[Enrollment]:
        """Get all enrollments for a user."""
        return self.db.query(Enrollment).filter(
            Enrollment.user_id == user_id
        ).order_by(Enrollment.enrolled_at.desc()).all()
    
    def get_enrollment(self, user_id: int, course_id: int) -> Optional[Enrollment]:
        """Get specific enrollment for user and course."""
        return self.db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.course_id == course_id
            )
        ).first()
    
    def is_user_enrolled(self, user_id: int, course_id: int) -> bool:
        """Check if user is enrolled in a course."""
        enrollment = self.get_enrollment(user_id, course_id)
        return enrollment is not None
    
    def get_course_progress(self, user_id: int, course_id: int) -> Optional[CourseProgress]:
        """Get course progress for a user."""
        return self.db.query(CourseProgress).filter(
            and_(
                CourseProgress.user_id == user_id,
                CourseProgress.course_id == course_id
            )
        ).first()
    
    def update_lecture_progress(
        self, 
        user_id: int, 
        lecture_id: int, 
        progress_data: LectureProgressUpdate
    ) -> LectureProgress:
        """
        Update or create lecture progress.
        
        Args:
            user_id: ID of the user
            lecture_id: ID of the lecture
            progress_data: Progress update data
            
        Returns:
            LectureProgress: Updated lecture progress
        """
        # Get or create lecture progress
        lecture_progress = self.db.query(LectureProgress).filter(
            and_(
                LectureProgress.user_id == user_id,
                LectureProgress.lecture_id == lecture_id
            )
        ).first()
        
        if not lecture_progress:
            lecture_progress = LectureProgress(
                user_id=user_id,
                lecture_id=lecture_id
            )
            self.db.add(lecture_progress)
        
        # Update progress fields
        update_data = progress_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(lecture_progress, field, value)
        
        # Set completion timestamp if marked as completed
        if progress_data.is_completed and not lecture_progress.completed_at:
            lecture_progress.completed_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(lecture_progress)
        
        # Update course progress
        self._update_course_progress(user_id, lecture_id)
        
        return lecture_progress
    
    def get_lecture_progress(self, user_id: int, lecture_id: int) -> Optional[LectureProgress]:
        """Get lecture progress for a user."""
        return self.db.query(LectureProgress).filter(
            and_(
                LectureProgress.user_id == user_id,
                LectureProgress.lecture_id == lecture_id
            )
        ).first()
    
    def _update_course_progress(self, user_id: int, lecture_id: int):
        """Update course progress based on lecture completion."""
        # Get lecture and course info
        from ..models.course import Lecture, Section
        lecture = self.db.query(Lecture).filter(Lecture.id == lecture_id).first()
        if not lecture:
            return
        
        section = self.db.query(Section).filter(Section.id == lecture.section_id).first()
        if not section:
            return
        
        course_id = section.course_id
        
        # Get course progress
        course_progress = self.get_course_progress(user_id, course_id)
        if not course_progress:
            return
        
        # Count completed lectures for this course
        completed_lectures = self.db.query(LectureProgress).join(
            Lecture, LectureProgress.lecture_id == Lecture.id
        ).join(
            Section, Lecture.section_id == Section.id
        ).filter(
            and_(
                LectureProgress.user_id == user_id,
                Section.course_id == course_id,
                LectureProgress.is_completed == True
            )
        ).count()
        
        # Update course progress
        course_progress.completed_lectures = completed_lectures
        
        # Calculate total watch time
        total_watch_time = self.db.query(LectureProgress).join(
            Lecture, LectureProgress.lecture_id == Lecture.id
        ).join(
            Section, Lecture.section_id == Section.id
        ).filter(
            and_(
                LectureProgress.user_id == user_id,
                Section.course_id == course_id
            )
        ).with_entities(LectureProgress.watch_time).all()
        
        course_progress.total_watch_time = sum(wt[0] for wt in total_watch_time) // 60  # Convert to minutes
        
        # Update enrollment progress percentage
        enrollment = self.get_enrollment(user_id, course_id)
        if enrollment:
            enrollment.progress_percentage = course_progress.completion_percentage
            enrollment.last_accessed = datetime.utcnow()
            
            # Mark as completed if all lectures are done
            if course_progress.completion_percentage >= 100 and not enrollment.is_completed:
                enrollment.is_completed = True
                enrollment.completed_at = datetime.utcnow()
                
                # Trigger certificate generation check
                from ..services.certificate_service import CertificateService
                CertificateService.update_course_progress(self.db, user_id, course_id)
        
        self.db.commit()
    
    def create_payment_intent(self, user_id: int, payment_data: PaymentIntentCreate) -> PaymentIntentResponse:
        """
        Create payment intent for course purchase.
        
        Args:
            user_id: ID of the user making the purchase
            payment_data: Payment intent creation data
            
        Returns:
            PaymentIntentResponse: Payment intent details
            
        Raises:
            HTTPException: If course not found, free, or user already enrolled
        """
        # Check if course exists and is published
        course = self.db.query(Course).filter(
            and_(
                Course.id == payment_data.course_id,
                Course.status == CourseStatus.PUBLISHED
            )
        ).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or not available for purchase"
            )
        
        # Check if course is free
        if course.price == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This course is free and does not require payment"
            )
        
        # Check if user is already enrolled
        existing_enrollment = self.get_enrollment(user_id, payment_data.course_id)
        if existing_enrollment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already enrolled in this course"
            )
        
        # For now, return a mock payment intent
        # In a real implementation, this would integrate with Stripe
        amount_cents = int(course.price * 100)  # Convert to cents
        
        # Mock client secret - in real implementation, this would come from Stripe
        client_secret = f"pi_mock_{course.id}_{user_id}_secret"
        
        return PaymentIntentResponse(
            client_secret=client_secret,
            amount=amount_cents,
            currency="usd"
        )
    
    def enroll_with_payment(
        self, 
        user_id: int, 
        enrollment_data: EnrollmentCreate, 
        payment_intent_id: str
    ) -> Enrollment:
        """
        Enroll user after successful payment verification.
        
        Args:
            user_id: ID of the user to enroll
            enrollment_data: Enrollment creation data
            payment_intent_id: Payment intent ID to verify
            
        Returns:
            Enrollment: Created enrollment
            
        Raises:
            HTTPException: If payment verification fails or enrollment issues
        """
        # In a real implementation, this would verify the payment with Stripe
        # For now, we'll just check if the payment_intent_id follows our mock format
        if not payment_intent_id.startswith("pi_mock_"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment intent"
            )
        
        # Extract course_id from mock payment intent
        try:
            parts = payment_intent_id.split("_")
            course_id_from_payment = int(parts[2])
            if course_id_from_payment != enrollment_data.course_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment intent does not match course"
                )
        except (IndexError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payment intent format"
            )
        
        # Create enrollment (similar to free enrollment but with payment verification)
        course = self.db.query(Course).filter(
            and_(
                Course.id == enrollment_data.course_id,
                Course.status == CourseStatus.PUBLISHED
            )
        ).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found or not available for enrollment"
            )
        
        # Check if user is already enrolled
        existing_enrollment = self.get_enrollment(user_id, enrollment_data.course_id)
        if existing_enrollment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already enrolled in this course"
            )
        
        # Create enrollment
        enrollment = Enrollment(
            user_id=user_id,
            course_id=enrollment_data.course_id
        )
        self.db.add(enrollment)
        
        # Create initial course progress
        course_progress = CourseProgress(
            user_id=user_id,
            course_id=enrollment_data.course_id,
            total_lectures=course.total_lectures,
            total_quizzes=0  # Will be updated when quizzes are implemented
        )
        self.db.add(course_progress)
        
        # In a real implementation, we would also create a transaction record here
        # to track the payment details
        
        self.db.commit()
        self.db.refresh(enrollment)
        return enrollment
    
    def get_dashboard_summary(self, user_id: int) -> dict:
        """
        Get dashboard summary statistics for a user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            dict: Dashboard summary data
        """
        # Get total enrollments
        total_enrollments = self.db.query(Enrollment).filter(
            Enrollment.user_id == user_id
        ).count()
        
        # Get completed courses
        completed_courses = self.db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.is_completed == True
            )
        ).count()
        
        # Get in-progress courses
        in_progress_courses = self.db.query(Enrollment).filter(
            and_(
                Enrollment.user_id == user_id,
                Enrollment.is_completed == False,
                Enrollment.progress_percentage > 0
            )
        ).count()
        
        # Get total watch time
        total_watch_time = self.db.query(CourseProgress).filter(
            CourseProgress.user_id == user_id
        ).with_entities(CourseProgress.total_watch_time).all()
        
        total_minutes = sum(wt[0] for wt in total_watch_time if wt[0])
        
        # Get certificates earned (placeholder for when certificates are implemented)
        certificates_earned = 0  # Will be updated when certificate system is implemented
        
        return {
            "total_enrollments": total_enrollments,
            "completed_courses": completed_courses,
            "in_progress_courses": in_progress_courses,
            "total_watch_time_minutes": total_minutes,
            "certificates_earned": certificates_earned,
            "completion_rate": (completed_courses / total_enrollments * 100) if total_enrollments > 0 else 0
        }
    
    def get_recent_activity(self, user_id: int, limit: int = 5) -> List[dict]:
        """
        Get recent learning activity for a user.
        
        Args:
            user_id: ID of the user
            limit: Number of recent activities to return
            
        Returns:
            List[dict]: Recent activity data
        """
        from ..models.course import Course, Section, Lecture
        
        # Get recent lecture progress updates
        recent_progress = self.db.query(LectureProgress).join(
            Lecture, LectureProgress.lecture_id == Lecture.id
        ).join(
            Section, Lecture.section_id == Section.id
        ).join(
            Course, Section.course_id == Course.id
        ).filter(
            LectureProgress.user_id == user_id
        ).order_by(
            LectureProgress.last_accessed.desc()
        ).limit(limit).all()
        
        activities = []
        for progress in recent_progress:
            lecture = progress.lecture
            section = lecture.section
            course = section.course
            
            activity_type = "completed" if progress.is_completed else "watched"
            
            activities.append({
                "type": activity_type,
                "course_id": course.id,
                "course_title": course.title,
                "lecture_id": lecture.id,
                "lecture_title": lecture.title,
                "section_title": section.title,
                "timestamp": progress.last_accessed,
                "watch_time": progress.watch_time,
                "is_completed": progress.is_completed
            })
        
        return activities
    
    def get_enrolled_courses_with_progress(self, user_id: int) -> List[dict]:
        """
        Get enrolled courses with detailed progress information for dashboard.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List[dict]: Enrolled courses with progress data
        """
        from ..models.course import Course
        
        # Get enrollments with course and progress data
        enrollments = self.db.query(Enrollment).join(
            Course, Enrollment.course_id == Course.id
        ).filter(
            Enrollment.user_id == user_id
        ).order_by(
            Enrollment.last_accessed.desc().nullslast(),
            Enrollment.enrolled_at.desc()
        ).all()
        
        courses_data = []
        for enrollment in enrollments:
            course = enrollment.course
            progress = self.get_course_progress(user_id, course.id)
            
            # Get next lecture to continue
            next_lecture = None
            if progress and progress.current_lecture_id:
                from ..models.course import Lecture
                next_lecture = self.db.query(Lecture).filter(
                    Lecture.id == progress.current_lecture_id
                ).first()
            
            course_data = {
                "enrollment_id": enrollment.id,
                "course_id": course.id,
                "course_title": course.title,
                "course_description": course.short_description or course.description[:200] + "...",
                "instructor_name": f"{course.instructor.first_name} {course.instructor.last_name}",
                "thumbnail_url": course.thumbnail_url,
                "progress_percentage": enrollment.progress_percentage,
                "is_completed": enrollment.is_completed,
                "enrolled_at": enrollment.enrolled_at,
                "last_accessed": enrollment.last_accessed,
                "completed_at": enrollment.completed_at,
                "total_duration": course.total_duration,
                "total_lectures": course.total_lectures,
                "next_lecture": {
                    "id": next_lecture.id,
                    "title": next_lecture.title,
                    "section_title": next_lecture.section.title
                } if next_lecture else None,
                "progress_details": {
                    "completed_lectures": progress.completed_lectures if progress else 0,
                    "total_lectures": progress.total_lectures if progress else course.total_lectures,
                    "total_watch_time": progress.total_watch_time if progress else 0
                } if progress else None
            }
            courses_data.append(course_data)
        
        return courses_data