"""
Taxonomy models for course organization (tags, difficulty levels, etc.).
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


# Association table for many-to-many relationship between courses and tags
course_tags = Table(
    'course_tags',
    Base.metadata,
    Column('course_id', Integer, ForeignKey('courses.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True)
)


class Tag(Base):
    """
    Tags for categorizing and organizing courses.
    """
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), nullable=True)  # Hex color code like #FF5733
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Many-to-many relationship with courses
    courses = relationship("Course", secondary=course_tags, back_populates="tags")

    def __repr__(self):
        return f"<Tag(id={self.id}, name='{self.name}')>"


class DifficultyConfiguration(Base):
    """
    Configuration for course difficulty levels.
    Allows customization of difficulty levels beyond the default enum.
    """
    __tablename__ = "difficulty_configurations"

    id = Column(Integer, primary_key=True, index=True)
    level_key = Column(String(50), unique=True, nullable=False, index=True)  # e.g., 'beginner', 'intermediate'
    display_name = Column(String(100), nullable=False)  # e.g., 'Beginner Friendly'
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0, nullable=False)  # For ordering in UI
    color = Column(String(7), nullable=True)  # Hex color code
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<DifficultyConfiguration(id={self.id}, level_key='{self.level_key}', display_name='{self.display_name}')>"