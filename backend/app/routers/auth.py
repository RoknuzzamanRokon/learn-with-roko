"""
Authentication API endpoints for login, register, refresh token, and logout.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.auth import (
    UserLogin, 
    UserRegister, 
    LoginResponse, 
    TokenResponse, 
    RefreshTokenRequest,
    MessageResponse,
    UserResponse
)
from ..services.auth_service import AuthService
from ..dependencies import get_current_active_user
from ..models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """
    Register a new user in the system.
    
    - **email**: User's email address (must be unique)
    - **username**: Unique username (3-50 characters)
    - **first_name**: User's first name
    - **last_name**: User's last name
    - **password**: Password (minimum 6 characters)
    - **bio**: Optional user bio
    
    Returns the created user data (without password).
    Default role is assigned as 'learner' as per requirements.
    """
    auth_service = AuthService(db)
    user = auth_service.register_user(user_data)
    return UserResponse.from_orm(user)


@router.post("/login", response_model=LoginResponse)
def login_user(
    login_data: UserLogin,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access and refresh tokens.
    
    - **email**: User's email address
    - **password**: User's password
    
    Returns user data and JWT tokens for authentication.
    Access token expires in 30 minutes, refresh token in 7 days.
    """
    auth_service = AuthService(db)
    user, tokens = auth_service.login_user(login_data)
    
    return LoginResponse(
        user=UserResponse.from_orm(user),
        tokens=tokens
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a new access token using a valid refresh token.
    
    - **refresh_token**: Valid JWT refresh token
    
    Returns new access and refresh tokens.
    This endpoint allows users to get new access tokens without re-authenticating.
    """
    auth_service = AuthService(db)
    tokens = auth_service.refresh_access_token(refresh_data.refresh_token)
    return tokens


@router.post("/logout", response_model=MessageResponse)
def logout_user(
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout the current user.
    
    Note: Since JWT tokens are stateless, this endpoint primarily serves
    as a confirmation. The client should discard the tokens.
    In a production system, you might want to implement token blacklisting.
    """
    return MessageResponse(message="Successfully logged out")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user's information.
    
    Returns the current user's profile data.
    Requires valid authentication token.
    """
    return UserResponse.from_orm(current_user)


@router.get("/verify-token", response_model=MessageResponse)
def verify_token_endpoint(
    current_user: User = Depends(get_current_active_user)
):
    """
    Verify if the current token is valid.
    
    Returns success message if token is valid and user is active.
    Useful for frontend token validation.
    """
    return MessageResponse(message="Token is valid")