"""
Pydantic schemas for taxonomy management (tags, difficulty configurations).
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Tag Schemas
class TagCreate(BaseModel):
    """Schema for creating a new tag."""
    name: str = Field(..., min_length=1, max_length=50, description="Tag name")
    description: Optional[str] = Field(None, description="Tag description")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex color code")


class TagUpdate(BaseModel):
    """Schema for updating a tag."""
    name: Optional[str] = Field(None, min_length=1, max_length=50, description="Tag name")
    description: Optional[str] = Field(None, description="Tag description")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex color code")
    is_active: Optional[bool] = Field(None, description="Whether tag is active")


class TagResponse(BaseModel):
    """Schema for tag response."""
    id: int
    name: str
    description: Optional[str]
    color: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class TagAssignment(BaseModel):
    """Schema for assigning tags to courses."""
    tag_ids: List[int] = Field(..., description="List of tag IDs to assign")


# Difficulty Configuration Schemas
class DifficultyConfigurationCreate(BaseModel):
    """Schema for creating a new difficulty configuration."""
    level_key: str = Field(..., min_length=1, max_length=50, description="Difficulty level key")
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name")
    description: Optional[str] = Field(None, description="Difficulty description")
    order_index: int = Field(0, ge=0, description="Order index for UI display")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex color code")


class DifficultyConfigurationUpdate(BaseModel):
    """Schema for updating a difficulty configuration."""
    level_key: Optional[str] = Field(None, min_length=1, max_length=50, description="Difficulty level key")
    display_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Display name")
    description: Optional[str] = Field(None, description="Difficulty description")
    order_index: Optional[int] = Field(None, ge=0, description="Order index for UI display")
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$', description="Hex color code")
    is_active: Optional[bool] = Field(None, description="Whether difficulty level is active")


class DifficultyConfigurationResponse(BaseModel):
    """Schema for difficulty configuration response."""
    id: int
    level_key: str
    display_name: str
    description: Optional[str]
    order_index: int
    color: Optional[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Combined schemas for course taxonomy
class CourseTaxonomyResponse(BaseModel):
    """Schema for course taxonomy information."""
    tags: List[TagResponse] = []
    difficulty_levels: List[DifficultyConfigurationResponse] = []


class TaxonomyStatsResponse(BaseModel):
    """Schema for taxonomy statistics."""
    total_tags: int
    active_tags: int
    total_difficulty_levels: int
    active_difficulty_levels: int
    most_used_tags: List[dict] = []  # List of {tag: TagResponse, usage_count: int}