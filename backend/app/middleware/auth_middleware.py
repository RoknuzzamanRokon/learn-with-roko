"""
Authentication and authorization middleware for route protection.
"""

from typing import List, Optional, Callable, Any
from functools import wraps
from fastapi import HTTPException, status, Depends

from ..models.user import User, UserRole
from ..permissions import Permission, PermissionChecker
from ..dependencies import get_current_active_user


def require_permissions(
    permissions: List[Permission], 
    require_all: bool = False
) -> Callable:
    """
    Decorator to require specific permissions for an endpoint.
    
    Args:
        permissions: List of permissions required
        require_all: If True, user must have ALL permissions. If False, user needs ANY permission.
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs (injected by FastAPI dependency)
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            # Check permissions
            if require_all:
                has_access = PermissionChecker.requires_all_permissions(
                    current_user.role, permissions
                )
            else:
                has_access = PermissionChecker.can_access_resource(
                    current_user.role, permissions
                )
            
            if not has_access:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(allowed_roles: List[UserRole]) -> Callable:
    """
    Decorator to require specific roles for an endpoint.
    
    Args:
        allowed_roles: List of roles that can access the endpoint
        
    Returns:
        Decorator function
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get current user from kwargs
            current_user = None
            for key, value in kwargs.items():
                if isinstance(value, User):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            if current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_super_admin(func: Callable) -> Callable:
    """
    Decorator to require Super Admin role.
    
    Args:
        func: Function to decorate
        
    Returns:
        Decorated function
    """
    return require_role([UserRole.SUPER_ADMIN])(func)


def require_instructor_or_admin(func: Callable) -> Callable:
    """
    Decorator to require Instructor or Super Admin role.
    
    Args:
        func: Function to decorate
        
    Returns:
        Decorated function
    """
    return require_role([UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN])(func)


# FastAPI dependency functions for permission checking
def require_permission(permission: Permission):
    """
    FastAPI dependency to require a specific permission.
    
    Args:
        permission: Required permission
        
    Returns:
        Dependency function
    """
    def check_permission(current_user: User = Depends(get_current_active_user)) -> User:
        if not PermissionChecker.has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission.value}"
            )
        return current_user
    
    return check_permission


def require_any_permission(permissions: List[Permission]):
    """
    FastAPI dependency to require any of the specified permissions.
    
    Args:
        permissions: List of permissions (user needs at least one)
        
    Returns:
        Dependency function
    """
    def check_permissions(current_user: User = Depends(get_current_active_user)) -> User:
        if not PermissionChecker.can_access_resource(current_user.role, permissions):
            permission_names = [p.value for p in permissions]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these permissions required: {permission_names}"
            )
        return current_user
    
    return check_permissions


def require_all_permissions(permissions: List[Permission]):
    """
    FastAPI dependency to require all specified permissions.
    
    Args:
        permissions: List of permissions (user needs all of them)
        
    Returns:
        Dependency function
    """
    def check_permissions(current_user: User = Depends(get_current_active_user)) -> User:
        if not PermissionChecker.requires_all_permissions(current_user.role, permissions):
            permission_names = [p.value for p in permissions]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"All of these permissions required: {permission_names}"
            )
        return current_user
    
    return check_permissions


def require_role_dependency(allowed_roles: List[UserRole]):
    """
    FastAPI dependency to require specific roles.
    
    Args:
        allowed_roles: List of allowed roles
        
    Returns:
        Dependency function
    """
    def check_role(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            role_names = [role.value for role in allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"One of these roles required: {role_names}"
            )
        return current_user
    
    return check_role