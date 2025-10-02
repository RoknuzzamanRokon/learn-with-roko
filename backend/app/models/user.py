"""
User model and related entities for the Learning Management System.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class UserRole(enum.Enum):
    """User roles in the system."""
    SUPER_ADMIN = "super_admin"
    INSTRUCTOR = "instructor"
    LEARNER = "learner"


class User(Base):
    """
    User model representing all users in the system.
    Supports role-based access control with Super Admin, Instructor, and Learner roles.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.LEARNER, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    profile_image = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    created_courses = relationship("Course", back_populates="instructor", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="user", cascade="all, delete-orphan")
    course_progress = relationship("CourseProgress", back_populates="user", cascade="all, delete-orphan")
    lecture_progress = relationship("LectureProgress", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    qa_questions = relationship("QAQuestion", back_populates="user", cascade="all, delete-orphan")
    qa_answers = relationship("QAAnswer", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    certificates = relationship("Certificate", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    instructor_applications = relationship("InstructorApplication", foreign_keys="InstructorApplication.user_id", back_populates="applicant", cascade="all, delete-orphan")
    resource_downloads = relationship("ResourceDownload", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', role='{self.role.value}')>"

    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}"

    def has_permission(self, permission) -> bool:
        """
        Check if user has a specific permission based on their role.
        
        Args:
            permission: Permission enum or string to check
            
        Returns:
            bool: True if user has the permission, False otherwise
        """
        from ..permissions import Permission, PermissionChecker
        
        # Handle string permissions for backward compatibility
        if isinstance(permission, str):
            try:
                permission = Permission(permission)
            except ValueError:
                return False
        
        return PermissionChecker.has_permission(self.role, permission)
    
    def get_permissions(self) -> set:
        """
        Get all permissions for this user's role.
        
        Returns:
            set: Set of Permission enums
        """
        from ..permissions import PermissionChecker
        return PermissionChecker.get_role_permissions(self.role)