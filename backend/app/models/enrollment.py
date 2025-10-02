"""
Enrollment and progress tracking models for the Learning Management System.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Enrollment(Base):
    """
    User enrollment in courses.
    """
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Enrollment details
    progress_percentage = Column(Float, default=0.0, nullable=False)
    is_completed = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_accessed = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

    def __repr__(self):
        return f"<Enrollment(id={self.id}, user_id={self.user_id}, course_id={self.course_id}, progress={self.progress_percentage}%)>"


class CourseProgress(Base):
    """
    Detailed progress tracking for users in courses.
    """
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Progress details
    completed_lectures = Column(Integer, default=0, nullable=False)
    total_lectures = Column(Integer, default=0, nullable=False)
    completed_quizzes = Column(Integer, default=0, nullable=False)
    total_quizzes = Column(Integer, default=0, nullable=False)
    
    # Time tracking
    total_watch_time = Column(Integer, default=0, nullable=False)  # in minutes
    
    # Current position
    current_section_id = Column(Integer, ForeignKey("sections.id"), nullable=True)
    current_lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="course_progress")
    course = relationship("Course", back_populates="course_progress")
    current_section = relationship("Section", foreign_keys=[current_section_id])
    current_lecture = relationship("Lecture", foreign_keys=[current_lecture_id])

    def __repr__(self):
        return f"<CourseProgress(id={self.id}, user_id={self.user_id}, course_id={self.course_id})>"

    @property
    def completion_percentage(self):
        """Calculate completion percentage based on lectures and quizzes."""
        if self.total_lectures == 0 and self.total_quizzes == 0:
            return 0.0
        
        total_items = self.total_lectures + self.total_quizzes
        completed_items = self.completed_lectures + self.completed_quizzes
        
        return (completed_items / total_items) * 100 if total_items > 0 else 0.0


class LectureProgress(Base):
    """
    Individual lecture progress tracking.
    """
    __tablename__ = "lecture_progress"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    
    # Progress details
    is_completed = Column(Boolean, default=False, nullable=False)
    watch_time = Column(Integer, default=0, nullable=False)  # in seconds
    last_position = Column(Integer, default=0, nullable=False)  # in seconds for video position
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="lecture_progress")
    lecture = relationship("Lecture", back_populates="lecture_progress")

    def __repr__(self):
        return f"<LectureProgress(id={self.id}, user_id={self.user_id}, lecture_id={self.lecture_id}, completed={self.is_completed})>"