"""
Unit tests for User model.
"""
import pytest
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from faker import Faker

fake = Faker()


class TestUserModel:
    """Test cases for User model."""
    
    def test_create_user_success(self, db_session: Session):
        """Test successful user creation."""
        user = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password(),
            bio=fake.text()
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.id is not None
        assert user.role == UserRole.LEARNER  # Default role
        assert user.is_active is True  # Default value
        assert user.is_verified is False  # Default value
        assert user.created_at is not None
        assert user.updated_at is not None
    
    def test_user_email_unique_constraint(self, db_session: Session):
        """Test that email must be unique."""
        email = fake.email()
        
        # Create first user
        user1 = User(
            email=email,
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password()
        )
        db_session.add(user1)
        db_session.commit()
        
        # Try to create second user with same email
        user2 = User(
            email=email,  # Same email
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password()
        )
        db_session.add(user2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_username_unique_constraint(self, db_session: Session):
        """Test that username must be unique."""
        username = fake.user_name()
        
        # Create first user
        user1 = User(
            email=fake.email(),
            username=username,
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password()
        )
        db_session.add(user1)
        db_session.commit()
        
        # Try to create second user with same username
        user2 = User(
            email=fake.email(),
            username=username,  # Same username
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password()
        )
        db_session.add(user2)
        
        with pytest.raises(IntegrityError):
            db_session.commit()
    
    def test_user_role_enum_values(self, db_session: Session):
        """Test that user role accepts valid enum values."""
        roles_to_test = [UserRole.SUPER_ADMIN, UserRole.INSTRUCTOR, UserRole.LEARNER]
        
        for role in roles_to_test:
            user = User(
                email=fake.email(),
                username=fake.user_name(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                hashed_password=fake.password(),
                role=role
            )
            
            db_session.add(user)
            db_session.commit()
            db_session.refresh(user)
            
            assert user.role == role
            
            # Clean up for next iteration
            db_session.delete(user)
            db_session.commit()
    
    def test_user_required_fields(self, db_session: Session):
        """Test that required fields cannot be null."""
        # Test missing email
        with pytest.raises(IntegrityError):
            user = User(
                username=fake.user_name(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                hashed_password=fake.password()
                # email is missing
            )
            db_session.add(user)
            db_session.commit()
        
        db_session.rollback()
        
        # Test missing username
        with pytest.raises(IntegrityError):
            user = User(
                email=fake.email(),
                first_name=fake.first_name(),
                last_name=fake.last_name(),
                hashed_password=fake.password()
                # username is missing
            )
            db_session.add(user)
            db_session.commit()
        
        db_session.rollback()
        
        # Test missing first_name
        with pytest.raises(IntegrityError):
            user = User(
                email=fake.email(),
                username=fake.user_name(),
                last_name=fake.last_name(),
                hashed_password=fake.password()
                # first_name is missing
            )
            db_session.add(user)
            db_session.commit()
    
    def test_user_optional_fields(self, db_session: Session):
        """Test that optional fields can be null."""
        user = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password(),
            # Optional fields not set: profile_image, bio, last_login
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.profile_image is None
        assert user.bio is None
        assert user.last_login is None
    
    def test_user_timestamps_auto_generated(self, db_session: Session):
        """Test that timestamps are automatically generated."""
        user = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password()
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        assert user.created_at is not None
        assert user.updated_at is not None
        assert isinstance(user.created_at, datetime)
        assert isinstance(user.updated_at, datetime)
    
    def test_user_updated_at_changes_on_update(self, db_session: Session):
        """Test that updated_at changes when user is updated."""
        user = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password()
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        original_updated_at = user.updated_at
        
        # Update user
        user.first_name = "Updated Name"
        db_session.commit()
        db_session.refresh(user)
        
        assert user.updated_at > original_updated_at
    
    def test_user_string_representation(self, db_session: Session):
        """Test user string representation."""
        user = User(
            email="test@example.com",
            username="testuser",
            first_name="Test",
            last_name="User",
            hashed_password=fake.password()
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # Test that user can be converted to string without error
        str_repr = str(user)
        assert isinstance(str_repr, str)
    
    def test_user_full_name_property(self, db_session: Session):
        """Test user full name property if it exists."""
        user = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name="John",
            last_name="Doe",
            hashed_password=fake.password()
        )
        
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        
        # If the model has a full_name property, test it
        if hasattr(user, 'full_name'):
            assert user.full_name == "John Doe"
    
    def test_user_is_instructor_property(self, db_session: Session):
        """Test user role checking properties if they exist."""
        instructor = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password(),
            role=UserRole.INSTRUCTOR
        )
        
        learner = User(
            email=fake.email(),
            username=fake.user_name(),
            first_name=fake.first_name(),
            last_name=fake.last_name(),
            hashed_password=fake.password(),
            role=UserRole.LEARNER
        )
        
        db_session.add_all([instructor, learner])
        db_session.commit()
        
        # If the model has role checking properties, test them
        if hasattr(instructor, 'is_instructor'):
            assert instructor.is_instructor is True
            assert learner.is_instructor is False
        
        if hasattr(instructor, 'is_admin'):
            assert instructor.is_admin is False