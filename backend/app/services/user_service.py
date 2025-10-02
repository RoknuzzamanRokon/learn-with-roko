"""
User service for handling user management business logic.
"""

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, extract
from fastapi import HTTPException, status
from datetime import datetime, timedelta

from ..models.user import User, UserRole
from ..schemas.user import (
    UserCreate, 
    UserUpdate, 
    UserSearchFilters,
    UserStatsResponse
)
from ..auth import get_password_hash, verify_password


class UserService:
    """Service class for user management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_user(self, user_data: UserCreate) -> User:
        """
        Create a new user.
        
        Args:
            user_data: User creation data
            
        Returns:
            User: Created user
            
        Raises:
            HTTPException: If email or username already exists
        """
        # Check if email already exists
        existing_user = self.db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
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
        
        # Hash password
        hashed_password = get_password_hash(user_data.password)
        
        # Create user
        db_user = User(
            email=user_data.email,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            hashed_password=hashed_password,
            role=user_data.role,
            bio=user_data.bio,
            is_active=user_data.is_active
        )
        
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        
        return db_user
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Get user by ID.
        
        Args:
            user_id: User ID
            
        Returns:
            Optional[User]: User if found, None otherwise
        """
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """
        Get user by email.
        
        Args:
            email: User email
            
        Returns:
            Optional[User]: User if found, None otherwise
        """
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user by username.
        
        Args:
            username: Username
            
        Returns:
            Optional[User]: User if found, None otherwise
        """
        return self.db.query(User).filter(User.username == username).first()
    
    def update_user(self, user_id: int, user_data: UserUpdate) -> User:
        """
        Update user information.
        
        Args:
            user_id: User ID to update
            user_data: Updated user data
            
        Returns:
            User: Updated user
            
        Raises:
            HTTPException: If user not found or email/username conflicts
        """
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check for email conflicts
        if user_data.email and user_data.email != user.email:
            existing_email = self.db.query(User).filter(
                and_(User.email == user_data.email, User.id != user_id)
            ).first()
            if existing_email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Check for username conflicts
        if user_data.username and user_data.username != user.username:
            existing_username = self.db.query(User).filter(
                and_(User.username == user_data.username, User.id != user_id)
            ).first()
            if existing_username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Update user fields
        update_data = user_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def update_user_role(self, user_id: int, new_role: UserRole) -> User:
        """
        Update user role.
        
        Args:
            user_id: User ID
            new_role: New role to assign
            
        Returns:
            User: Updated user
            
        Raises:
            HTTPException: If user not found
        """
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.role = new_role
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def update_user_password(self, user_id: int, current_password: str, new_password: str) -> User:
        """
        Update user password.
        
        Args:
            user_id: User ID
            current_password: Current password for verification
            new_password: New password
            
        Returns:
            User: Updated user
            
        Raises:
            HTTPException: If user not found or current password is incorrect
        """
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def suspend_user(self, user_id: int) -> User:
        """
        Suspend a user (set is_active to False).
        
        Args:
            user_id: User ID to suspend
            
        Returns:
            User: Suspended user
            
        Raises:
            HTTPException: If user not found
        """
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def activate_user(self, user_id: int) -> User:
        """
        Activate a user (set is_active to True).
        
        Args:
            user_id: User ID to activate
            
        Returns:
            User: Activated user
            
        Raises:
            HTTPException: If user not found
        """
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """
        Delete a user.
        
        Args:
            user_id: User ID to delete
            
        Returns:
            bool: True if deleted successfully
            
        Raises:
            HTTPException: If user not found
        """
        user = self.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        self.db.delete(user)
        self.db.commit()
        
        return True
    
    def search_users(
        self, 
        filters: UserSearchFilters, 
        page: int = 1, 
        per_page: int = 20
    ) -> Tuple[List[User], int]:
        """
        Search and filter users with pagination.
        
        Args:
            filters: Search and filter criteria
            page: Page number (1-based)
            per_page: Number of users per page
            
        Returns:
            Tuple[List[User], int]: List of users and total count
        """
        query = self.db.query(User)
        
        # Apply search filter
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term),
                    User.email.ilike(search_term),
                    User.username.ilike(search_term)
                )
            )
        
        # Apply role filter
        if filters.role:
            query = query.filter(User.role == filters.role)
        
        # Apply active status filter
        if filters.is_active is not None:
            query = query.filter(User.is_active == filters.is_active)
        
        # Apply date filters
        if filters.created_after:
            query = query.filter(User.created_at >= filters.created_after)
        
        if filters.created_before:
            query = query.filter(User.created_at <= filters.created_before)
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * per_page
        users = query.order_by(User.created_at.desc()).offset(offset).limit(per_page).all()
        
        return users, total
    
    def get_user_stats(self) -> UserStatsResponse:
        """
        Get user statistics.
        
        Returns:
            UserStatsResponse: User statistics
        """
        # Get current date for time-based filters
        now = datetime.utcnow()
        month_ago = now - timedelta(days=30)
        week_ago = now - timedelta(days=7)
        
        # Total users
        total_users = self.db.query(User).count()
        
        # Active/inactive users
        active_users = self.db.query(User).filter(User.is_active == True).count()
        inactive_users = total_users - active_users
        
        # Users by role
        super_admins = self.db.query(User).filter(User.role == UserRole.SUPER_ADMIN).count()
        instructors = self.db.query(User).filter(User.role == UserRole.INSTRUCTOR).count()
        learners = self.db.query(User).filter(User.role == UserRole.LEARNER).count()
        
        # New users
        new_users_this_month = self.db.query(User).filter(User.created_at >= month_ago).count()
        new_users_this_week = self.db.query(User).filter(User.created_at >= week_ago).count()
        
        return UserStatsResponse(
            total_users=total_users,
            active_users=active_users,
            inactive_users=inactive_users,
            super_admins=super_admins,
            instructors=instructors,
            learners=learners,
            new_users_this_month=new_users_this_month,
            new_users_this_week=new_users_this_week
        )