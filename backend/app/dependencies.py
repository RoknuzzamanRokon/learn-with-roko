"""
FastAPI dependencies for authentication and authorization.
"""

from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from .database import get_db
from .auth import verify_token, extract_user_id_from_token
from .models.user import User, UserRole
from .services.auth_service import AuthService
from .permissions import Permission

# Security scheme for JWT tokens
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    Get the current authenticated user from JWT token.

    Args:
        credentials: HTTP Bearer credentials
        db: Database session

    Returns:
        User: Current authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials
    user_id = extract_user_id_from_token(token)

    auth_service = AuthService(db)
    user = auth_service.get_user_by_id(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Get the current active user.

    Args:
        current_user: Current user from token

    Returns:
        User: Current active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    return current_user


def get_current_super_admin(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get the current user if they are a Super Admin.

    Args:
        current_user: Current active user

    Returns:
        User: Current user if Super Admin

    Raises:
        HTTPException: If user is not Super Admin
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Super Admin access required"
        )
    return current_user


def get_current_instructor(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """
    Get the current user if they are an Instructor or Super Admin.

    Args:
        current_user: Current active user

    Returns:
        User: Current user if Instructor or Super Admin

    Raises:
        HTTPException: If user is not Instructor or Super Admin
    """
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Instructor access required"
        )
    return current_user


def get_current_learner(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Get the current user if they are a Learner (any role can access learner features).

    Args:
        current_user: Current active user

    Returns:
        User: Current user
    """
    return current_user


def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise return None.
    Useful for endpoints that work for both authenticated and anonymous users.

    Args:
        credentials: Optional HTTP Bearer credentials
        db: Database session

    Returns:
        Optional[User]: Current user if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        user_id = extract_user_id_from_token(token)

        auth_service = AuthService(db)
        user = auth_service.get_user_by_id(user_id)

        if user and user.is_active:
            return user
    except HTTPException:
        # Invalid token, return None instead of raising exception
        pass

    return None


def require_permission(permission: Permission):
    """
    Dependency factory that creates a dependency requiring a specific permission.

    Args:
        permission: The permission required to access the endpoint

    Returns:
        Callable: Dependency function that checks for the permission
    """

    def permission_dependency(
        current_user: User = Depends(get_current_active_user),
    ) -> User:
        """
        Check if the current user has the required permission.

        Args:
            current_user: Current authenticated user

        Returns:
            User: Current user if they have the permission

        Raises:
            HTTPException: If user doesn't have the required permission
        """
        if not current_user.has_permission(permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission required: {permission.value}",
            )
        return current_user

    return permission_dependency
