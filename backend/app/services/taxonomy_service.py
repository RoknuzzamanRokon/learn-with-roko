"""
Taxonomy service for handling tag and difficulty configuration management.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc
from fastapi import HTTPException, status

from ..models.taxonomy import Tag, DifficultyConfiguration, course_tags
from ..models.course import Course
from ..schemas.taxonomy import (
    TagCreate,
    TagUpdate,
    TagAssignment,
    DifficultyConfigurationCreate,
    DifficultyConfigurationUpdate
)


class TaxonomyService:
    """Service class for taxonomy management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Tag Management Methods
    def create_tag(self, tag_data: TagCreate) -> Tag:
        """
        Create a new tag.
        
        Args:
            tag_data: Tag creation data
            
        Returns:
            Tag: Created tag
            
        Raises:
            HTTPException: If tag name already exists
        """
        # Check if tag name already exists
        existing_tag = self.db.query(Tag).filter(
            Tag.name.ilike(tag_data.name)  # Case-insensitive check
        ).first()
        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag name already exists"
            )
        
        tag = Tag(**tag_data.model_dump())
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag
    
    def get_tags(self, include_inactive: bool = False) -> List[Tag]:
        """Get all tags."""
        query = self.db.query(Tag)
        if not include_inactive:
            query = query.filter(Tag.is_active == True)
        return query.order_by(Tag.name).all()
    
    def get_tag_by_id(self, tag_id: int) -> Optional[Tag]:
        """Get tag by ID."""
        return self.db.query(Tag).filter(Tag.id == tag_id).first()
    
    def update_tag(self, tag_id: int, tag_data: TagUpdate) -> Tag:
        """Update tag."""
        tag = self.get_tag_by_id(tag_id)
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found"
            )
        
        # Check name uniqueness if name is being updated
        if tag_data.name and tag_data.name.lower() != tag.name.lower():
            existing_tag = self.db.query(Tag).filter(
                and_(
                    Tag.name.ilike(tag_data.name),
                    Tag.id != tag_id
                )
            ).first()
            if existing_tag:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tag name already exists"
                )
        
        # Update tag fields
        update_data = tag_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tag, field, value)
        
        self.db.commit()
        self.db.refresh(tag)
        return tag
    
    def delete_tag(self, tag_id: int) -> bool:
        """Delete tag."""
        tag = self.get_tag_by_id(tag_id)
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Tag not found"
            )
        
        # Check if tag is used by any courses
        course_count = self.db.query(course_tags).filter(
            course_tags.c.tag_id == tag_id
        ).count()
        
        if course_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete tag that is used by {course_count} course(s). Remove tag from courses first."
            )
        
        self.db.delete(tag)
        self.db.commit()
        return True
    
    def assign_tags_to_course(self, course_id: int, tag_assignment: TagAssignment) -> Course:
        """Assign tags to a course."""
        course = self.db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        # Validate all tag IDs exist and are active
        tags = self.db.query(Tag).filter(
            and_(
                Tag.id.in_(tag_assignment.tag_ids),
                Tag.is_active == True
            )
        ).all()
        
        if len(tags) != len(tag_assignment.tag_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more tags not found or inactive"
            )
        
        # Replace existing tags with new ones
        course.tags = tags
        self.db.commit()
        self.db.refresh(course)
        return course
    
    def get_course_tags(self, course_id: int) -> List[Tag]:
        """Get all tags assigned to a course."""
        course = self.db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        return course.tags
    
    def get_popular_tags(self, limit: int = 10) -> List[Tuple[Tag, int]]:
        """Get most popular tags by usage count."""
        result = self.db.query(
            Tag,
            func.count(course_tags.c.course_id).label('usage_count')
        ).join(
            course_tags, Tag.id == course_tags.c.tag_id
        ).filter(
            Tag.is_active == True
        ).group_by(
            Tag.id
        ).order_by(
            desc('usage_count')
        ).limit(limit).all()
        
        return [(tag, count) for tag, count in result]
    
    # Difficulty Configuration Methods
    def create_difficulty_configuration(self, config_data: DifficultyConfigurationCreate) -> DifficultyConfiguration:
        """
        Create a new difficulty configuration.
        
        Args:
            config_data: Difficulty configuration creation data
            
        Returns:
            DifficultyConfiguration: Created configuration
            
        Raises:
            HTTPException: If level_key already exists
        """
        # Check if level_key already exists
        existing_config = self.db.query(DifficultyConfiguration).filter(
            DifficultyConfiguration.level_key.ilike(config_data.level_key)
        ).first()
        if existing_config:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Difficulty level key already exists"
            )
        
        config = DifficultyConfiguration(**config_data.model_dump())
        self.db.add(config)
        self.db.commit()
        self.db.refresh(config)
        return config
    
    def get_difficulty_configurations(self, include_inactive: bool = False) -> List[DifficultyConfiguration]:
        """Get all difficulty configurations."""
        query = self.db.query(DifficultyConfiguration)
        if not include_inactive:
            query = query.filter(DifficultyConfiguration.is_active == True)
        return query.order_by(DifficultyConfiguration.order_index, DifficultyConfiguration.display_name).all()
    
    def get_difficulty_configuration_by_id(self, config_id: int) -> Optional[DifficultyConfiguration]:
        """Get difficulty configuration by ID."""
        return self.db.query(DifficultyConfiguration).filter(DifficultyConfiguration.id == config_id).first()
    
    def get_difficulty_configuration_by_key(self, level_key: str) -> Optional[DifficultyConfiguration]:
        """Get difficulty configuration by level key."""
        return self.db.query(DifficultyConfiguration).filter(
            DifficultyConfiguration.level_key.ilike(level_key)
        ).first()
    
    def update_difficulty_configuration(self, config_id: int, config_data: DifficultyConfigurationUpdate) -> DifficultyConfiguration:
        """Update difficulty configuration."""
        config = self.get_difficulty_configuration_by_id(config_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Difficulty configuration not found"
            )
        
        # Check level_key uniqueness if being updated
        if config_data.level_key and config_data.level_key.lower() != config.level_key.lower():
            existing_config = self.db.query(DifficultyConfiguration).filter(
                and_(
                    DifficultyConfiguration.level_key.ilike(config_data.level_key),
                    DifficultyConfiguration.id != config_id
                )
            ).first()
            if existing_config:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Difficulty level key already exists"
                )
        
        # Update configuration fields
        update_data = config_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        
        self.db.commit()
        self.db.refresh(config)
        return config
    
    def delete_difficulty_configuration(self, config_id: int) -> bool:
        """Delete difficulty configuration."""
        config = self.get_difficulty_configuration_by_id(config_id)
        if not config:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Difficulty configuration not found"
            )
        
        # Check if configuration is used by any courses
        course_count = self.db.query(Course).filter(
            Course.difficulty_level.ilike(config.level_key)
        ).count()
        
        if course_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete difficulty configuration that is used by {course_count} course(s)"
            )
        
        self.db.delete(config)
        self.db.commit()
        return True
    
    # Statistics and Analytics
    def get_taxonomy_stats(self) -> dict:
        """Get taxonomy statistics."""
        total_tags = self.db.query(Tag).count()
        active_tags = self.db.query(Tag).filter(Tag.is_active == True).count()
        
        total_difficulty_levels = self.db.query(DifficultyConfiguration).count()
        active_difficulty_levels = self.db.query(DifficultyConfiguration).filter(
            DifficultyConfiguration.is_active == True
        ).count()
        
        popular_tags = self.get_popular_tags(5)
        most_used_tags = [
            {
                "tag": tag,
                "usage_count": count
            }
            for tag, count in popular_tags
        ]
        
        return {
            "total_tags": total_tags,
            "active_tags": active_tags,
            "total_difficulty_levels": total_difficulty_levels,
            "active_difficulty_levels": active_difficulty_levels,
            "most_used_tags": most_used_tags
        }