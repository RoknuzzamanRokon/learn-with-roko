"""
User management API endpoints for CRUD operations, search, and administration.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..schemas.user import (
    UserCreate,
    UserUpdate,
    UserRoleUpdate,
    UserPasswordUpdate,
    UserDetailResponse,
    UserListResponse,
    UserSearchFilters,
    UserListPaginatedResponse,
    UserStatsResponse
)
from ..schemas.auth import MessageResponse
from ..services.user_service import UserService
from ..dependencies import (
    get_current_active_user,
    get_current_super_admin,
    get_current_instructor
)
from ..models.user import User, UserRole
from ..permissions import Permission

router = APIRouter(prefix="/users", tags=["User Management"])


@router.post("/", response_model=UserDetailResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Create a new user (Super Admin only).
    
    - **email**: User's email address (must be unique)
    - **username**: Unique username (3-50 characters)
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **password**: Password (minimum 6 characters)
    - **role**: User's role (defaults to learner)
    - **bio**: Optional user bio
    - **is_active**: Whether user is active (defaults to true)
    
    Returns the created user data (without password).
    Only Super Admins can create users with any role.
    """
    user_service = UserService(db)
    user = user_service.create_user(user_data)
    return UserDetailResponse.from_orm(user)


@router.get("/", response_model=UserListPaginatedResponse)
def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Users per page"),
    search: Optional[str] = Query(None, description="Search term for name, email, or username"),
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    List all users with search and filtering (Super Admin only).
    
    Supports pagination, search, and filtering by:
    - **search**: Search in name, email, or username
    - **role**: Filter by user role
    - **is_active**: Filter by active status
    - **page**: Page number (starts from 1)
    - **per_page**: Number of users per page (max 100)
    
    Returns paginated list of users with metadata.
    """
    filters = UserSearchFilters(
        search=search,
        role=role,
        is_active=is_active
    )
    
    user_service = UserService(db)
    users, total = user_service.search_users(filters, page, per_page)
    
    # Calculate pagination metadata
    total_pages = (total + per_page - 1) // per_page
    has_next = page < total_pages
    has_prev = page > 1
    
    return UserListPaginatedResponse(
        users=[UserListResponse.from_orm(user) for user in users],
        total=total,
        page=page,
        per_page=per_page,
        total_pages=total_pages,
        has_next=has_next,
        has_prev=has_prev
    )


@router.get("/stats", response_model=UserStatsResponse)
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Get user statistics (Super Admin only).
    
    Returns comprehensive user statistics including:
    - Total users count
    - Active/inactive users
    - Users by role
    - New users this month/week
    """
    user_service = UserService(db)
    return user_service.get_user_stats()


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get user details by ID.
    
    - **user_id**: ID of the user to retrieve
    
    Users can view their own profile.
    Super Admins can view any user profile.
    Instructors can view basic user info for their students.
    """
    user_service = UserService(db)
    user = user_service.get_user_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can view any user
        pass
    elif current_user.id == user_id:
        # Users can view their own profile
        pass
    elif current_user.role == UserRole.INSTRUCTOR:
        # Instructors can view basic user info (this could be expanded with enrollment checks)
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user"
        )
    
    return UserDetailResponse.from_orm(user)


@router.put("/{user_id}", response_model=UserDetailResponse)
def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update user information.
    
    - **user_id**: ID of the user to update
    - **email**: New email address (optional)
    - **username**: New username (optional)
    - **first_name**: New first name (optional)
    - **last_name**: New last name (optional)
    - **bio**: New bio (optional)
    - **profile_image**: New profile image URL (optional)
    - **is_active**: New active status (Super Admin only)
    
    Users can update their own profile.
    Super Admins can update any user profile.
    """
    user_service = UserService(db)
    
    # Check permissions
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can update any user
        pass
    elif current_user.id == user_id:
        # Users can update their own profile, but not is_active
        if user_data.is_active is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot modify active status"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    user = user_service.update_user(user_id, user_data)
    return UserDetailResponse.from_orm(user)


@router.put("/{user_id}/role", response_model=UserDetailResponse)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Update user role (Super Admin only).
    
    - **user_id**: ID of the user to update
    - **role**: New role to assign
    
    Only Super Admins can change user roles.
    This endpoint is used for role assignments and instructor approvals.
    """
    user_service = UserService(db)
    user = user_service.update_user_role(user_id, role_data.role)
    return UserDetailResponse.from_orm(user)


@router.put("/{user_id}/password", response_model=MessageResponse)
def update_user_password(
    user_id: int,
    password_data: UserPasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update user password.
    
    - **user_id**: ID of the user to update
    - **current_password**: Current password for verification
    - **new_password**: New password (minimum 6 characters)
    
    Users can update their own password.
    Super Admins can update any user's password (current_password not required for admins).
    """
    user_service = UserService(db)
    
    # Check permissions
    if current_user.role == UserRole.SUPER_ADMIN:
        # Super admin can update any user's password without current password
        user = user_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        from ..auth import get_password_hash
        user.hashed_password = get_password_hash(password_data.new_password)
        user_service.db.commit()
    elif current_user.id == user_id:
        # Users can update their own password with current password verification
        user_service.update_user_password(
            user_id, 
            password_data.current_password, 
            password_data.new_password
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's password"
        )
    
    return MessageResponse(message="Password updated successfully")


@router.put("/{user_id}/suspend", response_model=UserDetailResponse)
def suspend_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Suspend a user (Super Admin only).
    
    - **user_id**: ID of the user to suspend
    
    Sets the user's is_active status to False.
    Suspended users cannot log in or access the system.
    """
    user_service = UserService(db)
    user = user_service.suspend_user(user_id)
    return UserDetailResponse.from_orm(user)


@router.put("/{user_id}/activate", response_model=UserDetailResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Activate a user (Super Admin only).
    
    - **user_id**: ID of the user to activate
    
    Sets the user's is_active status to True.
    Activated users can log in and access the system.
    """
    user_service = UserService(db)
    user = user_service.activate_user(user_id)
    return UserDetailResponse.from_orm(user)


@router.delete("/{user_id}", response_model=MessageResponse)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_super_admin)
):
    """
    Delete a user (Super Admin only).
    
    - **user_id**: ID of the user to delete
    
    Permanently deletes the user and all associated data.
    This action cannot be undone.
    """
    user_service = UserService(db)
    
    # Prevent self-deletion
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    user_service.delete_user(user_id)
    return MessageResponse(message="User deleted successfully")


@router.get("/profile/me", response_model=UserDetailResponse)
def get_my_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current user's profile.
    
    Returns the authenticated user's complete profile information.
    """
    return UserDetailResponse.from_orm(current_user)


@router.put("/profile/me", response_model=UserDetailResponse)
def update_my_profile(
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Update current user's profile.
    
    Allows users to update their own profile information.
    Cannot modify is_active status through this endpoint.
    """
    # Remove is_active from update data for self-updates
    if user_data.is_active is not None:
        user_data.is_active = None
    
    user_service = UserService(db)
    user = user_service.update_user(current_user.id, user_data)
    return UserDetailResponse.from_orm(user)