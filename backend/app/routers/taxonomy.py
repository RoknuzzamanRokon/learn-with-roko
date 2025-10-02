"""
Taxonomy management API endpoints (tags, difficulty configurations).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.taxonomy_service import TaxonomyService
from ..schemas.taxonomy import (
    TagCreate,
    TagUpdate,
    TagResponse,
    TagAssignment,
    DifficultyConfigurationCreate,
    DifficultyConfigurationUpdate,
    DifficultyConfigurationResponse,
    CourseTaxonomyResponse,
    TaxonomyStatsResponse
)

router = APIRouter(prefix="/taxonomy", tags=["taxonomy"])


# Tag Management Endpoints
@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new tag. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create tags"
        )
    
    service = TaxonomyService(db)
    return service.create_tag(tag_data)


@router.get("/tags", response_model=List[TagResponse])
async def get_tags(
    include_inactive: bool = Query(False, description="Include inactive tags"),
    db: Session = Depends(get_db)
):
    """Get all tags."""
    service = TaxonomyService(db)
    return service.get_tags(include_inactive=include_inactive)


@router.get("/tags/popular", response_model=List[dict])
async def get_popular_tags(
    limit: int = Query(10, ge=1, le=50, description="Number of popular tags to return"),
    db: Session = Depends(get_db)
):
    """Get most popular tags by usage count."""
    service = TaxonomyService(db)
    popular_tags = service.get_popular_tags(limit=limit)
    return [
        {
            "tag": TagResponse.model_validate(tag),
            "usage_count": count
        }
        for tag, count in popular_tags
    ]


@router.get("/tags/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: int,
    db: Session = Depends(get_db)
):
    """Get tag by ID."""
    service = TaxonomyService(db)
    tag = service.get_tag_by_id(tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    return tag


@router.put("/tags/{tag_id}", response_model=TagResponse)
async def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update tag. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update tags"
        )
    
    service = TaxonomyService(db)
    return service.update_tag(tag_id, tag_data)


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete tag. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete tags"
        )
    
    service = TaxonomyService(db)
    service.delete_tag(tag_id)


# Course Tag Assignment Endpoints
@router.put("/courses/{course_id}/tags", response_model=List[TagResponse])
async def assign_tags_to_course(
    course_id: int,
    tag_assignment: TagAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign tags to a course. Requires Instructor or Super Admin role."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Instructors and Super Admins can assign tags to courses"
        )
    
    service = TaxonomyService(db)
    course = service.assign_tags_to_course(course_id, tag_assignment)
    return course.tags


@router.get("/courses/{course_id}/tags", response_model=List[TagResponse])
async def get_course_tags(
    course_id: int,
    db: Session = Depends(get_db)
):
    """Get all tags assigned to a course."""
    service = TaxonomyService(db)
    return service.get_course_tags(course_id)


# Difficulty Configuration Endpoints
@router.post("/difficulty-levels", response_model=DifficultyConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_difficulty_configuration(
    config_data: DifficultyConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new difficulty configuration. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create difficulty configurations"
        )
    
    service = TaxonomyService(db)
    return service.create_difficulty_configuration(config_data)


@router.get("/difficulty-levels", response_model=List[DifficultyConfigurationResponse])
async def get_difficulty_configurations(
    include_inactive: bool = Query(False, description="Include inactive difficulty levels"),
    db: Session = Depends(get_db)
):
    """Get all difficulty configurations."""
    service = TaxonomyService(db)
    return service.get_difficulty_configurations(include_inactive=include_inactive)


@router.get("/difficulty-levels/{config_id}", response_model=DifficultyConfigurationResponse)
async def get_difficulty_configuration(
    config_id: int,
    db: Session = Depends(get_db)
):
    """Get difficulty configuration by ID."""
    service = TaxonomyService(db)
    config = service.get_difficulty_configuration_by_id(config_id)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Difficulty configuration not found"
        )
    return config


@router.put("/difficulty-levels/{config_id}", response_model=DifficultyConfigurationResponse)
async def update_difficulty_configuration(
    config_id: int,
    config_data: DifficultyConfigurationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update difficulty configuration. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update difficulty configurations"
        )
    
    service = TaxonomyService(db)
    return service.update_difficulty_configuration(config_id, config_data)


@router.delete("/difficulty-levels/{config_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_difficulty_configuration(
    config_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete difficulty configuration. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete difficulty configurations"
        )
    
    service = TaxonomyService(db)
    service.delete_difficulty_configuration(config_id)


# Combined Taxonomy Endpoints
@router.get("/overview", response_model=CourseTaxonomyResponse)
async def get_taxonomy_overview(
    db: Session = Depends(get_db)
):
    """Get overview of all taxonomy data (tags and difficulty levels)."""
    service = TaxonomyService(db)
    tags = service.get_tags()
    difficulty_levels = service.get_difficulty_configurations()
    
    return CourseTaxonomyResponse(
        tags=[TagResponse.model_validate(tag) for tag in tags],
        difficulty_levels=[DifficultyConfigurationResponse.model_validate(config) for config in difficulty_levels]
    )


@router.get("/stats", response_model=TaxonomyStatsResponse)
async def get_taxonomy_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get taxonomy statistics. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view taxonomy statistics"
        )
    
    service = TaxonomyService(db)
    stats = service.get_taxonomy_stats()
    return TaxonomyStatsResponse(**stats)