"""
Certificate models for the Learning Management System.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Certificate(Base):
    """
    Certificates issued to users upon course completion.
    """
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Certificate details
    certificate_id = Column(String(100), unique=True, nullable=False, index=True)  # Unique certificate identifier
    title = Column(String(200), nullable=False)  # Certificate title
    description = Column(Text, nullable=True)  # Certificate description
    
    # Certificate file
    certificate_url = Column(String(500), nullable=True)  # URL to generated certificate PDF
    
    # Verification
    verification_code = Column(String(50), unique=True, nullable=False, index=True)
    is_verified = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    issued_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)  # Optional expiration

    # Relationships
    user = relationship("User", back_populates="certificates")
    course = relationship("Course", back_populates="certificates")

    def __repr__(self):
        return f"<Certificate(id={self.id}, certificate_id='{self.certificate_id}', user_id={self.user_id}, course_id={self.course_id})>"

    @property
    def is_expired(self):
        """Check if certificate has expired."""
        if self.expires_at is None:
            return False
        from datetime import datetime
        return datetime.utcnow() > self.expires_at