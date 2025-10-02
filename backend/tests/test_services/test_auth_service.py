"""
Unit tests for AuthService.
"""
import pytest
from unittest.mock import patch
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.services.auth_service import AuthService
from app.schemas.auth import UserRegister, UserLogin
from app.models.user import User, UserRole
from faker import Faker

fake = Faker()


class TestAuthService:
    """Test cases for AuthService."""
    
    def test_register_user_success(self, db_session: Session):
        """Test successful user registration."""
        auth_service = AuthService(db_session)
        
        user_data = UserRegister(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            password="testpassword123",
            bio=fake.text()
        )
        
        user = auth_service.register_user(user_data)
        
        assert user.email == user_data.email
        assert user.username == user_data.username
        assert user.first_name == user_data.first_name
        assert user.last_name == user_data.last_name
        assert user.role == UserRole.LEARNER
        assert user.is_active is True
        assert user.hashed_password != user_data.password  # Password should be hashed
    
    def test_register_user_duplicate_email(self, db_session: Session, test_user: User):
        """Test registration with duplicate email."""
        auth_service = AuthService(db_session)
        
        user_data = UserRegister(
            email=test_user.email,  # Use existing email
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            password="testpassword123",
            bio=fake.text()
        )
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.register_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "Email already registered" in str(exc_info.value.detail)
    
    def test_register_user_duplicate_username(self, db_session: Session, test_user: User):
        """Test registration with duplicate username."""
        auth_service = AuthService(db_session)
        
        user_data = UserRegister(
            email=fake.email(),
            username=test_user.username,  # Use existing username
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            password="testpassword123",
            bio=fake.text()
        )
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.register_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "Username already taken" in str(exc_info.value.detail)
    
    def test_authenticate_user_success(self, db_session: Session, test_user: User):
        """Test successful user authentication."""
        auth_service = AuthService(db_session)
        
        # The test_user fixture uses "secret" as password
        authenticated_user = auth_service.authenticate_user(test_user.email, "secret")
        
        assert authenticated_user is not None
        assert authenticated_user.id == test_user.id
        assert authenticated_user.email == test_user.email
    
    def test_authenticate_user_wrong_password(self, db_session: Session, test_user: User):
        """Test authentication with wrong password."""
        auth_service = AuthService(db_session)
        
        authenticated_user = auth_service.authenticate_user(test_user.email, "wrongpassword")
        
        assert authenticated_user is None
    
    def test_authenticate_user_nonexistent_email(self, db_session: Session):
        """Test authentication with non-existent email."""
        auth_service = AuthService(db_session)
        
        authenticated_user = auth_service.authenticate_user("nonexistent@example.com", "password")
        
        assert authenticated_user is None
    
    def test_authenticate_user_inactive_user(self, db_session: Session):
        """Test authentication with inactive user."""
        auth_service = AuthService(db_session)
        
        # Create inactive user
        inactive_user = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
            role=UserRole.LEARNER,
            is_active=False  # Inactive user
        )
        db_session.add(inactive_user)
        db_session.commit()
        
        authenticated_user = auth_service.authenticate_user(inactive_user.email, "secret")
        
        assert authenticated_user is None
    
    def test_login_user_success(self, db_session: Session, test_user: User):
        """Test successful user login."""
        auth_service = AuthService(db_session)
        
        login_data = UserLogin(email=test_user.email, password="secret")
        user, tokens = auth_service.login_user(login_data)
        
        assert user.id == test_user.id
        assert tokens.access_token is not None
        assert tokens.refresh_token is not None
        assert tokens.token_type == "bearer"
        assert tokens.expires_in > 0
    
    def test_login_user_invalid_credentials(self, db_session: Session, test_user: User):
        """Test login with invalid credentials."""
        auth_service = AuthService(db_session)
        
        login_data = UserLogin(email=test_user.email, password="wrongpassword")
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.login_user(login_data)
        
        assert exc_info.value.status_code == 401
        assert "Incorrect email or password" in str(exc_info.value.detail)
    
    @patch('app.services.auth_service.verify_token')
    def test_refresh_access_token_success(self, mock_verify_token, db_session: Session, test_user: User):
        """Test successful token refresh."""
        auth_service = AuthService(db_session)
        
        # Mock the token verification
        mock_verify_token.return_value = {
            "sub": str(test_user.id),
            "email": test_user.email,
            "role": test_user.role.value
        }
        
        refresh_token = "valid_refresh_token"
        new_tokens = auth_service.refresh_access_token(refresh_token)
        
        assert new_tokens.access_token is not None
        assert new_tokens.refresh_token is not None
        assert new_tokens.token_type == "bearer"
        mock_verify_token.assert_called_once_with(refresh_token, token_type="refresh")
    
    @patch('app.services.auth_service.verify_token')
    def test_refresh_access_token_invalid_token(self, mock_verify_token, db_session: Session):
        """Test token refresh with invalid token."""
        auth_service = AuthService(db_session)
        
        # Mock invalid token
        mock_verify_token.return_value = {"sub": None}
        
        refresh_token = "invalid_refresh_token"
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.refresh_access_token(refresh_token)
        
        assert exc_info.value.status_code == 401
        assert "Invalid refresh token" in str(exc_info.value.detail)
    
    @patch('app.services.auth_service.verify_token')
    def test_refresh_access_token_user_not_found(self, mock_verify_token, db_session: Session):
        """Test token refresh with non-existent user."""
        auth_service = AuthService(db_session)
        
        # Mock token for non-existent user
        mock_verify_token.return_value = {
            "sub": "999999",  # Non-existent user ID
            "email": "nonexistent@example.com",
            "role": "learner"
        }
        
        refresh_token = "valid_refresh_token"
        
        with pytest.raises(HTTPException) as exc_info:
            auth_service.refresh_access_token(refresh_token)
        
        assert exc_info.value.status_code == 401
        assert "User not found or inactive" in str(exc_info.value.detail)
    
    def test_get_user_by_id_success(self, db_session: Session, test_user: User):
        """Test getting user by ID."""
        auth_service = AuthService(db_session)
        
        user = auth_service.get_user_by_id(test_user.id)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email
    
    def test_get_user_by_id_not_found(self, db_session: Session):
        """Test getting user by non-existent ID."""
        auth_service = AuthService(db_session)
        
        user = auth_service.get_user_by_id(999999)
        
        assert user is None
    
    def test_get_user_by_email_success(self, db_session: Session, test_user: User):
        """Test getting user by email."""
        auth_service = AuthService(db_session)
        
        user = auth_service.get_user_by_email(test_user.email)
        
        assert user is not None
        assert user.id == test_user.id
        assert user.email == test_user.email
    
    def test_get_user_by_email_not_found(self, db_session: Session):
        """Test getting user by non-existent email."""
        auth_service = AuthService(db_session)
        
        user = auth_service.get_user_by_email("nonexistent@example.com")
        
        assert user is None