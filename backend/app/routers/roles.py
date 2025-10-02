"""
Role management API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ..database import get_db
from ..models.user import User, UserRole
from ..schemas.auth import UserResponse, MessageResponse
from ..services.role_service import RoleService
from ..dependencies import get_current_active_user
from ..middleware.auth_middleware import require_permission
from ..permissions import Permission

router = APIRouter(prefix="/roles", tags=["Role Management"])


class RoleAssignmentRequest(BaseModel):
    """Schema for role assignment request."""
    user_id: int
    new_role: UserRole


class RoleStatisticsResponse(BaseModel):
    """Schema for role statistics response."""
    super_admin: int
    instructor: int
    learner: int
    total: int


@router.post("/assign", response_model=UserResponse)
def assign_role(
    role_data: RoleAssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ASSIGN_ROLE))
):
    """
    Assign a role to a user.
    
    Requires ASSIGN_ROLE permission (Super Admin only).
    
    - **user_id**: ID of the user to assign role to
    - **new_role**: New role to assign (super_admin, instructor, learner)
    
    Returns the updated user information.
    """
    role_service = RoleService(db)
    updated_user = role_service.assign_role(
        role_data.user_id, 
        role_data.new_role, 
        current_user
    )
    return UserResponse.from_orm(updated_user)


@router.post("/promote/{user_id}", response_model=UserResponse)
def promote_to_instructor(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ASSIGN_ROLE))
):
    """
    Promote a learner to instructor role.
    
    Requires ASSIGN_ROLE permission (Super Admin only).
    
    - **user_id**: ID of the learner to promote
    
    Returns the updated user information.
    """
    role_service = RoleService(db)
    updated_user = role_service.promote_to_instructor(user_id, current_user)
    return UserResponse.from_orm(updated_user)


@router.post("/demote/{user_id}", response_model=UserResponse)
def demote_to_learner(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.ASSIGN_ROLE))
):
    """
    Demote an instructor to learner role.
    
    Requires ASSIGN_ROLE permission (Super Admin only).
    
    - **user_id**: ID of the instructor to demote
    
    Returns the updated user information.
    """
    role_service = RoleService(db)
    updated_user = role_service.demote_to_learner(user_id, current_user)
    return UserResponse.from_orm(updated_user)


@router.get("/users/{role}", response_model=List[UserResponse])
def get_users_by_role(
    role: UserRole,
    limit: int = Query(default=100, le=1000),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.READ_ALL_USERS))
):
    """
    Get users by their role.
    
    Requires READ_ALL_USERS permission (Super Admin only).
    
    - **role**: Role to filter by (super_admin, instructor, learner)
    - **limit**: Maximum number of users to return (max 1000)
    - **offset**: Number of users to skip for pagination
    
    Returns a list of users with the specified role.
    """
    role_service = RoleService(db)
    users = role_service.get_users_by_role(role, limit, offset)
    return [UserResponse.from_orm(user) for user in users]


@router.get("/statistics", response_model=RoleStatisticsResponse)
def get_role_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.VIEW_PLATFORM_ANALYTICS))
):
    """
    Get statistics about user roles.
    
    Requires VIEW_PLATFORM_ANALYTICS permission (Super Admin only).
    
    Returns counts of users in each role.
    """
    role_service = RoleService(db)
    stats = role_service.get_role_statistics()
    
    return RoleStatisticsResponse(
        super_admin=stats.get('super_admin', 0),
        instructor=stats.get('instructor', 0),
        learner=stats.get('learner', 0),
        total=sum(stats.values())
    )


@router.get("/permissions", response_model=List[str])
def get_user_permissions(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all permissions for the current user.
    
    Returns a list of permission strings that the current user has.
    """
    role_service = RoleService(None)  # No DB operations needed for this
    permissions = role_service.get_user_permissions(current_user)
    return permissions


@router.get("/permissions/{user_id}", response_model=List[str])
def get_user_permissions_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission(Permission.READ_ALL_USERS))
):
    """
    Get all permissions for a specific user.
    
    Requires READ_ALL_USERS permission (Super Admin only).
    
    - **user_id**: ID of the user to get permissions for
    
    Returns a list of permission strings for the specified user.
    """
    # Get the target user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    role_service = RoleService(None)  # No DB operations needed for this
    permissions = role_service.get_user_permissions(user)
    return permissions