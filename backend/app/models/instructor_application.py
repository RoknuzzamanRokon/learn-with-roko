"""
Instructor application model for handling instructor role requests.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class ApplicationStatus(enum.Enum):
    """Status of instructor application."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class InstructorApplication(Base):
    """
    Model for instructor role applications.
    Allows learners to apply to become instructors.
    """
    __tablename__ = "instructor_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Application details
    motivation = Column(Text, nullable=False)  # Why they want to be an instructor
    experience = Column(Text, nullable=False)  # Their relevant experience
    expertise_areas = Column(Text, nullable=False)  # Areas they want to teach
    sample_course_outline = Column(Text, nullable=True)  # Optional course outline
    
    # Application status
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    
    # Admin review
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    review_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    applicant = relationship("User", foreign_keys=[user_id], back_populates="instructor_applications")
    reviewer = relationship("User", foreign_keys=[reviewed_by])

    def __repr__(self):
        return f"<InstructorApplication(id={self.id}, user_id={self.user_id}, status='{self.status.value}')>"