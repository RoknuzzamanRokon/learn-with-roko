"""
Service for role assignment and validation operations.
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from ..models.user import User, UserRole
from ..permissions import Permission, PermissionChecker


class RoleService:
    """Service class for role management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    def assign_role(self, user_id: int, new_role: UserRole, assigned_by_user: User) -> User:
        """
        Assign a new role to a user.
        
        Args:
            user_id: ID of the user to assign role to
            new_role: New role to assign
            assigned_by_user: User performing the role assignment
            
        Returns:
            User: Updated user object
            
        Raises:
            HTTPException: If user not found or insufficient permissions
        """
        # Check if the assigning user has permission to assign roles
        if not assigned_by_user.has_permission(Permission.ASSIGN_ROLE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to assign roles"
            )
        
        # Get the target user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Prevent non-super-admins from assigning super admin role
        if new_role == UserRole.SUPER_ADMIN and assigned_by_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only Super Admins can assign Super Admin role"
            )
        
        # Prevent users from changing their own role (except super admin)
        if user.id == assigned_by_user.id and assigned_by_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change your own role"
            )
        
        # Update the role
        old_role = user.role
        user.role = new_role
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def validate_role_transition(self, current_role: UserRole, new_role: UserRole) -> bool:
        """
        Validate if a role transition is allowed.
        
        Args:
            current_role: Current user role
            new_role: Desired new role
            
        Returns:
            bool: True if transition is valid, False otherwise
        """
        # Define valid role transitions
        valid_transitions = {
            UserRole.LEARNER: [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN],
            UserRole.INSTRUCTOR: [UserRole.LEARNER, UserRole.SUPER_ADMIN],
            UserRole.SUPER_ADMIN: [UserRole.LEARNER, UserRole.INSTRUCTOR]
        }
        
        allowed_transitions = valid_transitions.get(current_role, [])
        return new_role in allowed_transitions
    
    def get_users_by_role(self, role: UserRole, limit: int = 100, offset: int = 0) -> List[User]:
        """
        Get users by their role.
        
        Args:
            role: Role to filter by
            limit: Maximum number of users to return
            offset: Number of users to skip
            
        Returns:
            List[User]: List of users with the specified role
        """
        return (
            self.db.query(User)
            .filter(User.role == role)
            .offset(offset)
            .limit(limit)
            .all()
        )
    
    def count_users_by_role(self, role: UserRole) -> int:
        """
        Count users by their role.
        
        Args:
            role: Role to count
            
        Returns:
            int: Number of users with the specified role
        """
        return self.db.query(User).filter(User.role == role).count()
    
    def get_role_statistics(self) -> dict:
        """
        Get statistics about user roles.
        
        Returns:
            dict: Dictionary with role counts
        """
        stats = {}
        for role in UserRole:
            stats[role.value] = self.count_users_by_role(role)
        
        return stats
    
    def can_user_access_resource(
        self, 
        user: User, 
        required_permissions: List[Permission],
        require_all: bool = False
    ) -> bool:
        """
        Check if a user can access a resource based on permissions.
        
        Args:
            user: User to check
            required_permissions: List of required permissions
            require_all: If True, user must have all permissions
            
        Returns:
            bool: True if user can access the resource
        """
        if require_all:
            return PermissionChecker.requires_all_permissions(user.role, required_permissions)
        else:
            return PermissionChecker.can_access_resource(user.role, required_permissions)
    
    def get_user_permissions(self, user: User) -> List[str]:
        """
        Get all permissions for a user as strings.
        
        Args:
            user: User to get permissions for
            
        Returns:
            List[str]: List of permission strings
        """
        permissions = PermissionChecker.get_role_permissions(user.role)
        return [permission.value for permission in permissions]
    
    def promote_to_instructor(self, user_id: int, promoted_by_user: User) -> User:
        """
        Promote a learner to instructor role.
        
        Args:
            user_id: ID of the user to promote
            promoted_by_user: User performing the promotion
            
        Returns:
            User: Updated user object
            
        Raises:
            HTTPException: If user not found, not a learner, or insufficient permissions
        """
        # Check permissions
        if not promoted_by_user.has_permission(Permission.ASSIGN_ROLE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to promote users"
            )
        
        # Get the user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user is currently a learner
        if user.role != UserRole.LEARNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only learners can be promoted to instructor"
            )
        
        # Promote to instructor
        user.role = UserRole.INSTRUCTOR
        self.db.commit()
        self.db.refresh(user)
        
        return user
    
    def demote_to_learner(self, user_id: int, demoted_by_user: User) -> User:
        """
        Demote an instructor to learner role.
        
        Args:
            user_id: ID of the user to demote
            demoted_by_user: User performing the demotion
            
        Returns:
            User: Updated user object
            
        Raises:
            HTTPException: If user not found, not an instructor, or insufficient permissions
        """
        # Check permissions
        if not demoted_by_user.has_permission(Permission.ASSIGN_ROLE):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to demote users"
            )
        
        # Get the user
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if user is currently an instructor
        if user.role != UserRole.INSTRUCTOR:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only instructors can be demoted to learner"
            )
        
        # Prevent demoting the last super admin
        if user.role == UserRole.SUPER_ADMIN:
            super_admin_count = self.count_users_by_role(UserRole.SUPER_ADMIN)
            if super_admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot demote the last Super Admin"
                )
        
        # Demote to learner
        user.role = UserRole.LEARNER
        self.db.commit()
        self.db.refresh(user)
        
        return user