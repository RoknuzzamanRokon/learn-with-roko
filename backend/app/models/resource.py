"""
Resource models for downloadable course materials.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class ResourceType(enum.Enum):
    """Types of downloadable resources."""
    PDF = "pdf"
    DOCUMENT = "document"
    PRESENTATION = "presentation"
    SPREADSHEET = "spreadsheet"
    ARCHIVE = "archive"
    CODE = "code"
    IMAGE = "image"
    AUDIO = "audio"
    OTHER = "other"


class LectureResource(Base):
    """
    Downloadable resources attached to lectures.
    """
    __tablename__ = "lecture_resources"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    lecture_id = Column(Integer, ForeignKey("lectures.id"), nullable=False)
    
    # Resource details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    resource_type = Column(Enum(ResourceType), default=ResourceType.OTHER, nullable=False)
    
    # File information
    file_url = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer, nullable=True)  # Size in bytes
    mime_type = Column(String(100), nullable=True)
    
    # Resource settings
    is_downloadable = Column(Boolean, default=True, nullable=False)
    download_count = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    lecture = relationship("Lecture", back_populates="resources")
    downloads = relationship("ResourceDownload", back_populates="resource", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<LectureResource(id={self.id}, title='{self.title}', type='{self.resource_type.value}')>"


class ResourceDownload(Base):
    """
    Track resource downloads by users.
    """
    __tablename__ = "resource_downloads"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("lecture_resources.id"), nullable=False)
    
    # Download metadata
    ip_address = Column(String(45), nullable=True)  # IPv6 support
    user_agent = Column(String(500), nullable=True)
    
    # Timestamps
    downloaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="resource_downloads")
    resource = relationship("LectureResource", back_populates="downloads")

    def __repr__(self):
        return f"<ResourceDownload(id={self.id}, user_id={self.user_id}, resource_id={self.resource_id})>"