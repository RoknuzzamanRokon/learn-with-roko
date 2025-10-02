"""
Unit tests for Course model and related entities.
"""
import pytest
from datetime import datetime
from decimal import Decimal
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.course import Course, CourseCategory, CourseStatus, DifficultyLevel, Section, Lecture
from app.models.user import User, UserRole
from faker import Faker

fake = Faker()


class TestCourseModel:
    """Test cases for Course model."""
    
    def test_create_course_success(self, db_session: Session, test_instructor: User):
        """Test successful course creation."""
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99"),
            difficulty_level=DifficultyLevel.BEGINNER,
            thumbnail_url=fake.image_url()
        )
        
        db_session.add(course)
        db_session.commit()
        db_session.refresh(course)
        
        assert course.id is not None
        assert course.instructor_id == test_instructor.id
        assert course.status == CourseStatus.DRAFT  # Default status
        assert course.is_published is False  # Default value
        assert course.created_at is not None
        assert course.updated_at is not None
    
    def test_course_required_fields(self, db_session: Session, test_instructor: User):
        """Test that required fields cannot be null."""
        # Test missing title
        with pytest.raises(IntegrityError):
            course = Course(
                description=fake.text(),
                instructor_id=test_instructor.id,
                price=Decimal("99.99")
                # title is missing
            )
            db_session.add(course)
            db_session.commit()
        
        db_session.rollback()
        
        # Test missing instructor_id
        with pytest.raises(IntegrityError):
            course = Course(
                title=fake.sentence(nb_words=4),
                description=fake.text(),
                price=Decimal("99.99")
                # instructor_id is missing
            )
            db_session.add(course)
            db_session.commit()
    
    def test_course_price_precision(self, db_session: Session, test_instructor: User):
        """Test that course price handles decimal precision correctly."""
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99"),
            difficulty_level=DifficultyLevel.BEGINNER
        )
        
        db_session.add(course)
        db_session.commit()
        db_session.refresh(course)
        
        assert course.price == Decimal("99.99")
        assert isinstance(course.price, Decimal)
    
    def test_course_status_enum_values(self, db_session: Session, test_instructor: User):
        """Test that course status accepts valid enum values."""
        statuses_to_test = [CourseStatus.DRAFT, CourseStatus.PUBLISHED, CourseStatus.ARCHIVED]
        
        for status in statuses_to_test:
            course = Course(
                title=fake.sentence(nb_words=4),
                description=fake.text(),
                instructor_id=test_instructor.id,
                price=Decimal("99.99"),
                status=status
            )
            
            db_session.add(course)
            db_session.commit()
            db_session.refresh(course)
            
            assert course.status == status
            
            # Clean up for next iteration
            db_session.delete(course)
            db_session.commit()
    
    def test_course_difficulty_enum_values(self, db_session: Session, test_instructor: User):
        """Test that difficulty level accepts valid enum values."""
        difficulties_to_test = [DifficultyLevel.BEGINNER, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
        
        for difficulty in difficulties_to_test:
            course = Course(
                title=fake.sentence(nb_words=4),
                description=fake.text(),
                instructor_id=test_instructor.id,
                price=Decimal("99.99"),
                difficulty_level=difficulty
            )
            
            db_session.add(course)
            db_session.commit()
            db_session.refresh(course)
            
            assert course.difficulty_level == difficulty
            
            # Clean up for next iteration
            db_session.delete(course)
            db_session.commit()
    
    def test_course_instructor_relationship(self, db_session: Session, test_instructor: User):
        """Test course-instructor relationship."""
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99")
        )
        
        db_session.add(course)
        db_session.commit()
        db_session.refresh(course)
        
        # Test relationship
        assert course.instructor is not None
        assert course.instructor.id == test_instructor.id
        assert course.instructor.role == UserRole.INSTRUCTOR
    
    def test_course_timestamps_auto_generated(self, db_session: Session, test_instructor: User):
        """Test that timestamps are automatically generated."""
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99")
        )
        
        db_session.add(course)
        db_session.commit()
        db_session.refresh(course)
        
        assert course.created_at is not None
        assert course.updated_at is not None
        assert isinstance(course.created_at, datetime)
        assert isinstance(course.updated_at, datetime)
    
    def test_course_updated_at_changes_on_update(self, db_session: Session, test_instructor: User):
        """Test that updated_at changes when course is updated."""
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99")
        )
        
        db_session.add(course)
        db_session.commit()
        db_session.refresh(course)
        
        original_updated_at = course.updated_at
        
        # Update course
        course.title = "Updated Course Title"
        db_session.commit()
        db_session.refresh(course)
        
        assert course.updated_at > original_updated_at


class TestCourseCategoryModel:
    """Test cases for CourseCategory model."""
    
    def test_create_category_success(self, db_session: Session):
        """Test successful category creation."""
        category = CourseCategory(
            name="Programming",
            description="Programming courses"
        )
        
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)
        
        assert category.id is not None
        assert category.name == "Programming"
        assert category.is_active is True  # Default value
        assert category.created_at is not None
    
    def test_category_name_unique_constraint(self, db_session: Session):
        """Test that category name must be unique."""
        category_name = "Programming"
        
        # Create first category
        category1 = CourseCategory(name=category_name, description="First category")
        db_session.add(category1)
        db_session.commit()
        
        # Try to create second category with same name
        category2 = CourseCategory(name=category_name, description="Second category")
        db_session.add(category2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_category_subcategory_relationship(self, db_session: Session):
        """Test parent-child relationship between categories."""
        # Create parent category
        parent_category = CourseCategory(
            name="Technology",
            description="Technology courses"
        )
        db_session.add(parent_category)
        db_session.commit()
        db_session.refresh(parent_category)
        
        # Create subcategory
        subcategory = CourseCategory(
            name="Web Development",
            description="Web development courses",
            parent_id=parent_category.id
        )
        db_session.add(subcategory)
        db_session.commit()
        db_session.refresh(subcategory)
        
        # Test relationships
        assert subcategory.parent is not None
        assert subcategory.parent.id == parent_category.id
        assert len(parent_category.subcategories) == 1
        assert parent_category.subcategories[0].id == subcategory.id
    
    def test_category_course_relationship(self, db_session: Session, test_instructor: User):
        """Test category-course relationship."""
        # Create category
        category = CourseCategory(
            name="Programming",
            description="Programming courses"
        )
        db_session.add(category)
        db_session.commit()
        db_session.refresh(category)
        
        # Create course with category
        course = Course(
            title=fake.sentence(nb_words=4),
            description=fake.text(),
            instructor_id=test_instructor.id,
            price=Decimal("99.99"),
            category_id=category.id
        )
        db_session.add(course)
        db_session.commit()
        db_session.refresh(course)
        
        # Test relationships
        assert course.category is not None
        assert course.category.id == category.id
        assert len(category.courses) == 1
        assert category.courses[0].id == course.id


class TestSectionModel:
    """Test cases for Section model."""
    
    def test_create_section_success(self, db_session: Session, test_course: Course):
        """Test successful section creation."""
        section = Section(
            title="Introduction",
            description="Course introduction",
            course_id=test_course.id,
            order_index=1
        )
        
        db_session.add(section)
        db_session.commit()
        db_session.refresh(section)
        
        assert section.id is not None
        assert section.course_id == test_course.id
        assert section.order_index == 1
        assert section.created_at is not None
    
    def test_section_course_relationship(self, db_session: Session, test_course: Course):
        """Test section-course relationship."""
        section = Section(
            title="Introduction",
            description="Course introduction",
            course_id=test_course.id,
            order_index=1
        )
        
        db_session.add(section)
        db_session.commit()
        db_session.refresh(section)
        
        # Test relationships
        assert section.course is not None
        assert section.course.id == test_course.id
        assert len(test_course.sections) >= 1


class TestLectureModel:
    """Test cases for Lecture model."""
    
    def test_create_lecture_success(self, db_session: Session, test_course: Course):
        """Test successful lecture creation."""
        # Create section first
        section = Section(
            title="Introduction",
            description="Course introduction",
            course_id=test_course.id,
            order_index=1
        )
        db_session.add(section)
        db_session.commit()
        db_session.refresh(section)
        
        # Create lecture
        lecture = Lecture(
            title="Welcome to the Course",
            description="Welcome lecture",
            section_id=section.id,
            order_index=1,
            duration_minutes=10,
            video_url=fake.url()
        )
        
        db_session.add(lecture)
        db_session.commit()
        db_session.refresh(lecture)
        
        assert lecture.id is not None
        assert lecture.section_id == section.id
        assert lecture.order_index == 1
        assert lecture.duration_minutes == 10
        assert lecture.created_at is not None
    
    def test_lecture_section_relationship(self, db_session: Session, test_course: Course):
        """Test lecture-section relationship."""
        # Create section
        section = Section(
            title="Introduction",
            description="Course introduction",
            course_id=test_course.id,
            order_index=1
        )
        db_session.add(section)
        db_session.commit()
        db_session.refresh(section)
        
        # Create lecture
        lecture = Lecture(
            title="Welcome to the Course",
            description="Welcome lecture",
            section_id=section.id,
            order_index=1,
            duration_minutes=10
        )
        db_session.add(lecture)
        db_session.commit()
        db_session.refresh(lecture)
        
        # Test relationships
        assert lecture.section is not None
        assert lecture.section.id == section.id
        assert len(section.lectures) == 1
        assert section.lectures[0].id == lecture.id