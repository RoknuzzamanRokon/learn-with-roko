"""
Unit tests for EnrollmentService.
"""
import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from decimal import Decimal
from datetime import datetime

from app.services.enrollment_service import EnrollmentService
from app.schemas.enrollment import EnrollmentCreate, LectureProgressUpdate
from app.models.enrollment import Enrollment, CourseProgress
from app.models.course import Course, CourseStatus, DifficultyLevel
from app.models.user import User
from faker import Faker

fake = Faker()


class TestEnrollmentService:
    """Test cases for EnrollmentService."""
    
    def test_enroll_user_in_free_course_success(self, db_session: Session, test_user: User, test_instructor: User):
        """Test successful enrollment in a free course."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create a free published course
        free_course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("0.00"),  # Free course
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        db_session.add(free_course)
        db_session.commit()
        db_session.refresh(free_course)
        
        enrollment_data = EnrollmentCreate(course_id=free_course.id)
        enrollment = enrollment_service.enroll_user_in_course(test_user.id, enrollment_data)
        
        assert enrollment.user_id == test_user.id
        assert enrollment.course_id == free_course.id
        assert enrollment.enrolled_at is not None
        assert enrollment.progress_percentage == 0.0
        assert enrollment.completed_at is None
    
    def test_enroll_user_in_paid_course_without_payment(self, db_session: Session, test_user: User, test_course: Course):
        """Test enrollment in paid course without payment should fail."""
        enrollment_service = EnrollmentService(db_session)
        
        # Ensure course is paid and published
        test_course.price = Decimal("99.99")
        test_course.status = CourseStatus.PUBLISHED
        db_session.commit()
        
        enrollment_data = EnrollmentCreate(course_id=test_course.id)
        
        with pytest.raises(HTTPException) as exc_info:
            enrollment_service.enroll_user_in_course(test_user.id, enrollment_data)
        
        assert exc_info.value.status_code == 400
        assert "Payment required for paid course" in str(exc_info.value.detail)
    
    def test_enroll_user_in_unpublished_course(self, db_session: Session, test_user: User, test_instructor: User):
        """Test enrollment in unpublished course should fail."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create unpublished course
        unpublished_course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("0.00"),
            status=CourseStatus.DRAFT,  # Not published
            difficulty_level=DifficultyLevel.BEGINNER
        )
        db_session.add(unpublished_course)
        db_session.commit()
        
        enrollment_data = EnrollmentCreate(course_id=unpublished_course.id)
        
        with pytest.raises(HTTPException) as exc_info:
            enrollment_service.enroll_user_in_course(test_user.id, enrollment_data)
        
        assert exc_info.value.status_code == 404
        assert "Course not found or not available for enrollment" in str(exc_info.value.detail)
    
    def test_enroll_user_already_enrolled(self, db_session: Session, test_user: User, test_instructor: User):
        """Test enrolling user who is already enrolled should fail."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create a free published course
        free_course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("0.00"),
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        db_session.add(free_course)
        db_session.commit()
        
        # Create existing enrollment
        existing_enrollment = Enrollment(
            user_id=test_user.id,
            course_id=free_course.id,
            enrolled_at=datetime.utcnow()
        )
        db_session.add(existing_enrollment)
        db_session.commit()
        
        enrollment_data = EnrollmentCreate(course_id=free_course.id)
        
        with pytest.raises(HTTPException) as exc_info:
            enrollment_service.enroll_user_in_course(test_user.id, enrollment_data)
        
        assert exc_info.value.status_code == 400
        assert "User is already enrolled in this course" in str(exc_info.value.detail)
    
    def test_get_user_enrollments(self, db_session: Session, test_user: User, test_instructor: User):
        """Test getting user's enrollments."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create multiple courses and enrollments
        courses = []
        for i in range(3):
            course = Course(
                title=f"Course {i+1}",
                description=fake.text(),
                instructor_id=test_instructor.id,
                price=Decimal("0.00"),
                status=CourseStatus.PUBLISHED,
                difficulty_level=DifficultyLevel.BEGINNER
            )
            db_session.add(course)
            courses.append(course)
        
        db_session.commit()
        
        # Create enrollments
        for course in courses:
            enrollment = Enrollment(
                user_id=test_user.id,
                course_id=course.id,
                enrolled_at=datetime.utcnow()
            )
            db_session.add(enrollment)
        
        db_session.commit()
        
        enrollments = enrollment_service.get_user_enrollments(test_user.id)
        
        assert len(enrollments) == 3
        for enrollment in enrollments:
            assert enrollment.user_id == test_user.id
    
    def test_get_course_enrollments(self, db_session: Session, test_course: Course, test_instructor: User):
        """Test getting course enrollments."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create multiple users and enroll them
        users = []
        for i in range(3):
            user = User(
                email=f"user{i}@example.com",
                username=f"user{i}",
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
                role="learner",
                is_active=True
            )
            db_session.add(user)
            users.append(user)
        
        db_session.commit()
        
        # Set course as free and published
        test_course.price = Decimal("0.00")
        test_course.status = CourseStatus.PUBLISHED
        db_session.commit()
        
        # Create enrollments
        for user in users:
            enrollment = Enrollment(
                user_id=user.id,
                course_id=test_course.id,
                enrolled_at=datetime.utcnow()
            )
            db_session.add(enrollment)
        
        db_session.commit()
        
        enrollments = enrollment_service.get_course_enrollments(test_course.id)
        
        assert len(enrollments) == 3
        for enrollment in enrollments:
            assert enrollment.course_id == test_course.id
    
    def test_update_course_progress(self, db_session: Session, test_user: User, test_instructor: User):
        """Test updating course progress."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create course and enrollment
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("0.00"),
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        db_session.add(course)
        db_session.commit()
        
        enrollment = Enrollment(
            user_id=test_user.id,
            course_id=course.id,
            enrolled_at=datetime.utcnow()
        )
        db_session.add(enrollment)
        db_session.commit()
        
        # Update progress
        new_progress = 75.5
        updated_enrollment = enrollment_service.update_course_progress(
            test_user.id, 
            course.id, 
            new_progress
        )
        
        assert updated_enrollment.progress_percentage == new_progress
        assert updated_enrollment.last_accessed is not None
    
    def test_complete_course(self, db_session: Session, test_user: User, test_instructor: User):
        """Test completing a course."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create course and enrollment
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("0.00"),
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        db_session.add(course)
        db_session.commit()
        
        enrollment = Enrollment(
            user_id=test_user.id,
            course_id=course.id,
            enrolled_at=datetime.utcnow(),
            progress_percentage=95.0  # Almost complete
        )
        db_session.add(enrollment)
        db_session.commit()
        
        # Complete the course
        completed_enrollment = enrollment_service.complete_course(test_user.id, course.id)
        
        assert completed_enrollment.progress_percentage == 100.0
        assert completed_enrollment.completed_at is not None
        assert completed_enrollment.certificate_issued is True
    
    def test_get_enrollment_statistics(self, db_session: Session, test_course: Course):
        """Test getting enrollment statistics."""
        enrollment_service = EnrollmentService(db_session)
        
        stats = enrollment_service.get_enrollment_statistics(test_course.id)
        
        assert "total_enrollments" in stats
        assert "active_learners" in stats
        assert "completion_rate" in stats
        assert "average_progress" in stats
        assert isinstance(stats["total_enrollments"], int)
        assert isinstance(stats["completion_rate"], (int, float))
    
    def test_unenroll_user_success(self, db_session: Session, test_user: User, test_instructor: User):
        """Test successful user unenrollment."""
        enrollment_service = EnrollmentService(db_session)
        
        # Create course and enrollment
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("0.00"),
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        db_session.add(course)
        db_session.commit()
        
        enrollment = Enrollment(
            user_id=test_user.id,
            course_id=course.id,
            enrolled_at=datetime.utcnow()
        )
        db_session.add(enrollment)
        db_session.commit()
        
        # Unenroll user
        result = enrollment_service.unenroll_user(test_user.id, course.id)
        
        assert result is True
        
        # Verify enrollment is removed
        remaining_enrollment = db_session.query(Enrollment).filter(
            and_(Enrollment.user_id == test_user.id, Enrollment.course_id == course.id)
        ).first()
        assert remaining_enrollment is None
    
    def test_unenroll_user_not_enrolled(self, db_session: Session, test_user: User, test_course: Course):
        """Test unenrolling user who is not enrolled."""
        enrollment_service = EnrollmentService(db_session)
        
        with pytest.raises(HTTPException) as exc_info:
            enrollment_service.unenroll_user(test_user.id, test_course.id)
        
        assert exc_info.value.status_code == 404
        assert "Enrollment not found" in str(exc_info.value.detail)