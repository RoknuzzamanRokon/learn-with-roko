"""
Legal documents and policy management models.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class DocumentType(enum.Enum):
    """Types of legal documents."""
    TERMS_OF_SERVICE = "terms_of_service"
    PRIVACY_POLICY = "privacy_policy"
    COOKIE_POLICY = "cookie_policy"
    REFUND_POLICY = "refund_policy"
    COMMUNITY_GUIDELINES = "community_guidelines"
    INSTRUCTOR_AGREEMENT = "instructor_agreement"
    DATA_PROCESSING_AGREEMENT = "data_processing_agreement"


class LegalDocument(Base):
    """
    Legal documents with version control.
    """
    __tablename__ = "legal_documents"

    id = Column(Integer, primary_key=True, index=True)
    document_type = Column(String(50), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    slug = Column(String(100), nullable=False, index=True)  # URL-friendly identifier
    content = Column(Text, nullable=False)
    
    # Version control
    version = Column(String(20), nullable=False, default="1.0")
    is_current = Column(Boolean, default=True, nullable=False)
    previous_version_id = Column(Integer, ForeignKey("legal_documents.id"), nullable=True)
    
    # Document metadata
    effective_date = Column(DateTime(timezone=True), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Document settings
    is_published = Column(Boolean, default=False, nullable=False)
    requires_acceptance = Column(Boolean, default=True, nullable=False)  # Users must accept this document
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    created_by_user = relationship("User", foreign_keys=[created_by])
    previous_version = relationship("LegalDocument", remote_side=[id], back_populates="next_versions")
    next_versions = relationship("LegalDocument", back_populates="previous_version", cascade="all, delete-orphan")
    user_acceptances = relationship("UserPolicyAcceptance", back_populates="document", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LegalDocument(id={self.id}, type='{self.document_type}', version='{self.version}')>"


class UserPolicyAcceptance(Base):
    """
    Track user acceptance of legal documents.
    """
    __tablename__ = "user_policy_acceptances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("legal_documents.id"), nullable=False)
    
    # Acceptance details
    accepted_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)
    
    # Document version at time of acceptance
    document_version = Column(String(20), nullable=False)
    document_type = Column(String(50), nullable=False)

    # Relationships
    user = relationship("User", back_populates="policy_acceptances")
    document = relationship("LegalDocument", back_populates="user_acceptances")

    def __repr__(self):
        return f"<UserPolicyAcceptance(id={self.id}, user_id={self.user_id}, document_type='{self.document_type}')>"


class PolicyUpdateNotification(Base):
    """
    Track notifications sent to users about policy updates.
    """
    __tablename__ = "policy_update_notifications"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("legal_documents.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Notification details
    notification_type = Column(String(50), nullable=False)  # email, in_app, etc.
    sent_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Response tracking
    viewed_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    document = relationship("LegalDocument")
    user = relationship("User")

    def __repr__(self):
        return f"<PolicyUpdateNotification(id={self.id}, user_id={self.user_id}, document_id={self.document_id})>"