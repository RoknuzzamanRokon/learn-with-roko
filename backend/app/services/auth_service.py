"""
Authentication service layer for user management and authentication operations.
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.user import User, UserRole
from ..schemas.auth import UserRegister, UserLogin, TokenResponse
from ..auth import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    verify_token,
    ACCESS_TOKEN_EXPIRE_MINUTES
)


class AuthService:
    """Service class for authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def register_user(self, user_data: UserRegister) -> User:
        """
        Register a new user in the system.
        
        Args:
            user_data: User registration data
            
        Returns:
            User: Created user object
            
        Raises:
            HTTPException: If email or username already exists
        """
        # Check if email already exists
        existing_email = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check if username already exists
        existing_username = self.db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        
        # Create new user
        hashed_password = get_password_hash(user_data.password)
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            hashed_password=hashed_password,
            bio=user_data.bio,
            role=UserRole.LEARNER  # Default role as per requirements
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        return db_user
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """
        Authenticate a user with email and password.
        
        Args:
            email: User's email
            password: User's plain text password
            
        Returns:
            User: Authenticated user object or None if authentication fails
        """
        user = self.db.query(User).filter(User.email == email).first()
        if not user:
            return None
        
        if not verify_password(password, user.hashed_password):
            return None
        
        if not user.is_active:
            return None
        
        # Update last login
        user.last_login = datetime.utcnow()
        self.db.commit()
        
        return user
    
    def login_user(self, login_data: UserLogin) -> Tuple[User, TokenResponse]:
        """
        Login a user and generate tokens.
        
        Args:
            login_data: User login credentials
            
        Returns:
            Tuple[User, TokenResponse]: User object and tokens
            
        Raises:
            HTTPException: If authentication fails
        """
        user = self.authenticate_user(login_data.email, login_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate tokens
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        tokens = TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
        )
        
        return user, tokens
    
    def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """
        Generate a new access token using a refresh token.
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            TokenResponse: New access token and refresh token
            
        Raises:
            HTTPException: If refresh token is invalid
        """
        # Verify refresh token
        payload = verify_token(refresh_token, token_type="refresh")
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user from database
        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate new tokens
        token_data = {"sub": str(user.id), "email": user.email, "role": user.role.value}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User's ID
            
        Returns:
            User: User object or None if not found
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            email: User's email
            
        Returns:
            User: User object or None if not found
        """
        return self.db.query(User).filter(User.email == email).first()