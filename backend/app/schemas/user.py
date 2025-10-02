"""
Pydantic schemas for user management endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from ..models.user import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr = Field(..., description="User's email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    first_name: str = Field(..., min_length=1, max_length=100, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User's last name")
    password: str = Field(..., min_length=6, description="User's password")
    role: Optional[UserRole] = Field(UserRole.LEARNER, description="User's role")
    bio: Optional[str] = Field(None, max_length=1000, description="User's bio")
    is_active: Optional[bool] = Field(True, description="Whether user is active")


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    email: Optional[EmailStr] = Field(None, description="User's email address")
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Unique username")
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="User's last name")
    bio: Optional[str] = Field(None, max_length=1000, description="User's bio")
    profile_image: Optional[str] = Field(None, description="Profile image URL")
    is_active: Optional[bool] = Field(None, description="Whether user is active")


class UserRoleUpdate(BaseModel):
    """Schema for updating user role."""
    role: UserRole = Field(..., description="New role for the user")


class UserPasswordUpdate(BaseModel):
    """Schema for updating user password."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=6, description="New password")


class UserDetailResponse(BaseModel):
    """Schema for detailed user response."""
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
    bio: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for user list response."""
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime]
    
    class Config:
        from_attributes = True


class UserSearchFilters(BaseModel):
    """Schema for user search and filtering."""
    search: Optional[str] = Field(None, description="Search term for name, email, or username")
    role: Optional[UserRole] = Field(None, description="Filter by user role")
    is_active: Optional[bool] = Field(None, description="Filter by active status")
    created_after: Optional[datetime] = Field(None, description="Filter users created after this date")
    created_before: Optional[datetime] = Field(None, description="Filter users created before this date")


class UserListPaginatedResponse(BaseModel):
    """Schema for paginated user list response."""
    users: List[UserListResponse]
    total: int
    page: int
    per_page: int
    total_pages: int
    has_next: bool
    has_prev: bool


class UserStatsResponse(BaseModel):
    """Schema for user statistics response."""
    total_users: int
    active_users: int
    inactive_users: int
    super_admins: int
    instructors: int
    learners: int
    new_users_this_month: int
    new_users_this_week: int