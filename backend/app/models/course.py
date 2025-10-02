"""
Course-related models for the Learning Management System.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class DifficultyLevel(enum.Enum):
    """Course difficulty levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourseStatus(enum.Enum):
    """Course publication status."""
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CourseCategory(Base):
    """
    Course categories for organizing courses.
    """
    __tablename__ = "course_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("course_categories.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Self-referential relationship for subcategories
    parent = relationship("CourseCategory", remote_side=[id], back_populates="subcategories")
    subcategories = relationship("CourseCategory", back_populates="parent", cascade="all, delete-orphan")
    
    # Relationship with courses
    courses = relationship("Course", back_populates="category")

    def __repr__(self):
        return f"<CourseCategory(id={self.id}, name='{self.name}')>"


class Course(Base):
    """
    Course model representing courses created by instructors.
    """
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    
    # Foreign keys
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("course_categories.id"), nullable=True)
    
    # Course details
    price = Column(DECIMAL(10, 2), default=0.00, nullable=False)
    status = Column(Enum(CourseStatus), default=CourseStatus.DRAFT, nullable=False)
    difficulty_level = Column(Enum(DifficultyLevel), default=DifficultyLevel.BEGINNER, nullable=False)
    
    # Media and content
    thumbnail_url = Column(String(500), nullable=True)
    preview_video_url = Column(String(500), nullable=True)
    
    # Course metadata
    total_duration = Column(Integer, default=0, nullable=False)  # in minutes
    total_lectures = Column(Integer, default=0, nullable=False)
    language = Column(String(10), default="en", nullable=False)
    
    # Course settings
    is_featured = Column(Boolean, default=False, nullable=False)
    allow_qa = Column(Boolean, default=True, nullable=False)
    allow_notes = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    instructor = relationship("User", back_populates="created_courses")
    category = relationship("CourseCategory", back_populates="courses")
    sections = relationship("Section", back_populates="course", cascade="all, delete-orphan", order_by="Section.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    course_progress = relationship("CourseProgress", back_populates="course", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="course", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="course", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Course(id={self.id}, title='{self.title}', status='{self.status.value}')>"

    @property
    def is_free(self):
        """Check if the course is free."""
        return self.price == 0

    @property
    def is_published(self):
        """Check if the course is published."""
        return self.status == CourseStatus.PUBLISHED


class Section(Base):
    """
    Course sections for organizing lectures within a course.
    """
    __tablename__ = "sections"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign key
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Section ordering
    order_index = Column(Integer, nullable=False, default=0)
    
    # Section metadata
    total_duration = Column(Integer, default=0, nullable=False)  # in minutes
    total_lectures = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    course = relationship("Course", back_populates="sections")
    lectures = relationship("Lecture", back_populates="section", cascade="all, delete-orphan", order_by="Lecture.order_index")

    def __repr__(self):
        return f"<Section(id={self.id}, title='{self.title}', course_id={self.course_id})>"


class LectureType(enum.Enum):
    """Types of lectures."""
    VIDEO = "video"
    TEXT = "text"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    RESOURCE = "resource"


class Lecture(Base):
    """
    Individual lectures within course sections.
    """
    __tablename__ = "lectures"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Foreign key
    section_id = Column(Integer, ForeignKey("sections.id"), nullable=False)
    
    # Lecture details
    lecture_type = Column(Enum(LectureType), default=LectureType.VIDEO, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    duration = Column(Integer, default=0, nullable=False)  # in minutes
    
    # Content URLs
    video_url = Column(String(500), nullable=True)
    content_url = Column(String(500), nullable=True)  # For PDFs, documents, etc.
    
    # Lecture settings
    is_preview = Column(Boolean, default=False, nullable=False)  # Free preview
    is_downloadable = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    section = relationship("Section", back_populates="lectures")
    lecture_progress = relationship("LectureProgress", back_populates="lecture", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="lecture", cascade="all, delete-orphan")
    qa_questions = relationship("QAQuestion", back_populates="lecture", cascade="all, delete-orphan")
    resources = relationship("LectureResource", back_populates="lecture", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Lecture(id={self.id}, title='{self.title}', type='{self.lecture_type.value}')>"