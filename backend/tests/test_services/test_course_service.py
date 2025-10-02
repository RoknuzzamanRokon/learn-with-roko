"""
Unit tests for CourseService.
"""
import pytest
from unittest.mock import patch
from fastapi import HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from app.services.course_service import CourseService
from app.schemas.course import CourseCreate, CourseUpdate, CourseStatusUpdate
from app.models.course import Course, CourseStatus, DifficultyLevel
from app.models.user import User, UserRole
from faker import Faker

fake = Faker()


class TestCourseService:
    """Test cases for CourseService."""
    
    def test_create_course_success(self, db_session: Session, test_instructor: User):
        """Test successful course creation."""
        course_service = CourseService(db_session)
        
        course_data = CourseCreate(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            price=Decimal("99.99"),
            difficulty_level="beginner",
            thumbnail_url=fake.image_url()
        )
        
        course = course_service.create_course(course_data, test_instructor.id)
        
        assert course.title == course_data.title
        assert course.description == course_data.description
        assert course.price == course_data.price
        assert course.instructor_id == test_instructor.id
        assert course.difficulty_level == course_data.difficulty_level
        assert course.status == CourseStatus.DRAFT
        assert course.is_published is False
    
    def test_create_course_unauthorized_user(self, db_session: Session, test_user: User):
        """Test course creation by non-instructor user."""
        course_service = CourseService(db_session)
        
        course_data = CourseCreate(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            price=Decimal("99.99"),
            difficulty_level="beginner",
            thumbnail_url=fake.image_url()
        )
        
        with pytest.raises(HTTPException) as exc_info:
            course_service.create_course(course_data, test_user.id)
        
        assert exc_info.value.status_code == 403
        assert "Only instructors can create courses" in str(exc_info.value.detail)
    
    def test_get_course_by_id_success(self, db_session: Session, test_course: Course):
        """Test getting course by ID."""
        course_service = CourseService(db_session)
        
        course = course_service.get_course_by_id(test_course.id)
        
        assert course is not None
        assert course.id == test_course.id
        assert course.title == test_course.title
    
    def test_get_course_by_id_not_found(self, db_session: Session):
        """Test getting non-existent course."""
        course_service = CourseService(db_session)
        
        course = course_service.get_course_by_id(999999)
        
        assert course is None
    
    def test_update_course_success(self, db_session: Session, test_course: Course, test_instructor: User):
        """Test successful course update."""
        course_service = CourseService(db_session)
        
        update_data = CourseUpdate(
            title="Updated Course Title",
            description="Updated description",
            price=Decimal("149.99")
        )
        
        updated_course = course_service.update_course(
            test_course.id, 
            update_data, 
            test_instructor.id
        )
        
        assert updated_course.title == update_data.title
        assert updated_course.description == update_data.description
        assert updated_course.price == update_data.price
    
    def test_update_course_unauthorized(self, db_session: Session, test_course: Course, test_user: User):
        """Test course update by unauthorized user."""
        course_service = CourseService(db_session)
        
        update_data = CourseUpdate(title="Unauthorized Update")
        
        with pytest.raises(HTTPException) as exc_info:
            course_service.update_course(test_course.id, update_data, test_user.id)
        
        assert exc_info.value.status_code == 403
        assert "Not authorized to update this course" in str(exc_info.value.detail)
    
    def test_update_course_not_found(self, db_session: Session, test_instructor: User):
        """Test updating non-existent course."""
        course_service = CourseService(db_session)
        
        update_data = CourseUpdate(title="Non-existent Course")
        
        with pytest.raises(HTTPException) as exc_info:
            course_service.update_course(999999, update_data, test_instructor.id)
        
        assert exc_info.value.status_code == 404
        assert "Course not found" in str(exc_info.value.detail)
    
    def test_delete_course_success(self, db_session: Session, test_course: Course, test_instructor: User):
        """Test successful course deletion."""
        course_service = CourseService(db_session)
        
        result = course_service.delete_course(test_course.id, test_instructor.id)
        
        assert result is True
        
        # Verify course is deleted
        deleted_course = db_session.query(Course).filter(Course.id == test_course.id).first()
        assert deleted_course is None
    
    def test_delete_course_unauthorized(self, db_session: Session, test_course: Course, test_user: User):
        """Test course deletion by unauthorized user."""
        course_service = CourseService(db_session)
        
        with pytest.raises(HTTPException) as exc_info:
            course_service.delete_course(test_course.id, test_user.id)
        
        assert exc_info.value.status_code == 403
        assert "Not authorized to delete this course" in str(exc_info.value.detail)
    
    def test_publish_course_success(self, db_session: Session, test_course: Course, test_instructor: User):
        """Test successful course publishing."""
        course_service = CourseService(db_session)
        
        status_update = CourseStatusUpdate(status=CourseStatus.PUBLISHED)
        updated_course = course_service.update_course_status(
            test_course.id, 
            status_update, 
            test_instructor.id
        )
        
        assert updated_course.status == CourseStatus.PUBLISHED
        assert updated_course.is_published is True
        assert updated_course.published_at is not None
    
    def test_get_instructor_courses(self, db_session: Session, test_instructor: User):
        """Test getting courses by instructor."""
        course_service = CourseService(db_session)
        
        # Create multiple courses for the instructor
        for i in range(3):
            course = Course(
                title=f"Course {i+1}",
                description=fake.text(),
                instructor_id=test_instructor.id,
                price=Decimal("99.99"),
                difficulty_level="beginner"
            )
            db_session.add(course)
        db_session.commit()
        
        courses = course_service.get_instructor_courses(test_instructor.id)
        
        assert len(courses) == 3
        for course in courses:
            assert course.instructor_id == test_instructor.id
    
    def test_search_courses_by_title(self, db_session: Session, test_instructor: User):
        """Test searching courses by title."""
        course_service = CourseService(db_session)
        
        # Create courses with specific titles
        course1 = Course(
            title="Python Programming Basics",
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99"),
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        course2 = Course(
            title="Advanced JavaScript",
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("149.99"),
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.ADVANCED
        )
        db_session.add_all([course1, course2])
        db_session.commit()
        
        # Search for Python courses
        results = course_service.search_courses(search_query="Python")
        
        assert len(results) == 1
        assert results[0].title == "Python Programming Basics"
    
    def test_get_published_courses_only(self, db_session: Session, test_instructor: User):
        """Test getting only published courses."""
        course_service = CourseService(db_session)
        
        # Create published and draft courses
        published_course = Course(
            title="Published Course",
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99"),
            status=CourseStatus.PUBLISHED,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        draft_course = Course(
            title="Draft Course",
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99"),
            status=CourseStatus.DRAFT,
            difficulty_level=DifficultyLevel.BEGINNER
        )
        db_session.add_all([published_course, draft_course])
        db_session.commit()
        
        published_courses = course_service.get_published_courses()
        
        assert len(published_courses) == 1
        assert published_courses[0].title == "Published Course"
        assert published_courses[0].is_published is True
    
    def test_get_course_statistics(self, db_session: Session, test_course: Course):
        """Test getting course statistics."""
        course_service = CourseService(db_session)
        
        stats = course_service.get_course_statistics(test_course.id)
        
        assert "total_enrollments" in stats
        assert "total_revenue" in stats
        assert "average_rating" in stats
        assert "completion_rate" in stats
        assert isinstance(stats["total_enrollments"], int)
        assert isinstance(stats["total_revenue"], (int, float, Decimal))
    
    def test_course_validation_empty_title(self, db_session: Session, test_instructor: User):
        """Test course creation with empty title."""
        course_service = CourseService(db_session)
        
        course_data = CourseCreate(
            title="",  # Empty title
            description=fake.text(),
            price=Decimal("99.99"),
            difficulty_level="beginner"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            course_service.create_course(course_data, test_instructor.id)
        
        assert exc_info.value.status_code == 400
        assert "Title cannot be empty" in str(exc_info.value.detail)
    
    def test_course_validation_negative_price(self, db_session: Session, test_instructor: User):
        """Test course creation with negative price."""
        course_service = CourseService(db_session)
        
        course_data = CourseCreate(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            price=Decimal("-10.00"),  # Negative price
            difficulty_level="beginner"
        )
        
        with pytest.raises(HTTPException) as exc_info:
            course_service.create_course(course_data, test_instructor.id)
        
        assert exc_info.value.status_code == 400
        assert "Price cannot be negative" in str(exc_info.value.detail)