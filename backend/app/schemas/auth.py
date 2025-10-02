"""
Pydantic schemas for authentication endpoints.
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from ..models.user import UserRole


class UserLogin(BaseModel):
    """Schema for user login request."""
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="User's password")


class UserRegister(BaseModel):
    """Schema for user registration request."""
    email: EmailStr = Field(..., description="User's email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    first_name: str = Field(..., min_length=1, max_length=100, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User's last name")
    password: str = Field(..., min_length=6, description="User's password")
    bio: Optional[str] = Field(None, max_length=1000, description="User's bio")


class TokenResponse(BaseModel):
    """Schema for token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str = Field(..., description="JWT refresh token")


class UserResponse(BaseModel):
    """Schema for user data response."""
    id: int
    email: str
    username: str
    first_name: str
    last_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    profile_image: Optional[str]
    bio: Optional[str]
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Schema for login response."""
    user: UserResponse
    tokens: TokenResponse


class MessageResponse(BaseModel):
    """Schema for simple message responses."""
    message: str = Field(..., description="Response message")