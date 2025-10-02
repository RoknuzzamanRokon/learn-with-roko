"""
Test configuration and fixtures for the LMS backend tests.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base
from app.models.user import User, UserRole
from app.models.course import Course
from app.models.enrollment import Enrollment
from app.auth import create_access_token
from faker import Faker
import os

# Test database URL
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

fake = Faker()

@pytest.fixture(scope="session")
def db_engine():
    """Create test database engine."""
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(db_engine):
    """Create a fresh database session for each test."""
    connection = db_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    """Create a test client with database session override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        email=fake.email(),
        username=fake.user_name(),
        first_name=fake.first_name(),
        last_name=fake.last_name(),
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        role=UserRole.LEARNER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def test_instructor(db_session):
    """Create a test instructor."""
    instructor = User(
        email=fake.email(),
        username=fake.user_name(),
        first_name=fake.first_name(),
        last_name=fake.last_name(),
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        role=UserRole.INSTRUCTOR,
        is_active=True
    )
    db_session.add(instructor)
    db_session.commit()
    db_session.refresh(instructor)
    return instructor

@pytest.fixture
def test_admin(db_session):
    """Create a test admin user."""
    admin = User(
        email=fake.email(),
        username=fake.user_name(),
        first_name=fake.first_name(),
        last_name=fake.last_name(),
        hashed_password="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        role=UserRole.SUPER_ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin

@pytest.fixture
def test_course(db_session, test_instructor):
    """Create a test course."""
    from app.models.course import CourseStatus, DifficultyLevel
    course = Course(
        title=fake.sentence(nb_words=4),
        description=fake.text(),
        instructor_id=test_instructor.id,
        price=99.99,
        status=CourseStatus.PUBLISHED,
        thumbnail_url=fake.image_url(),
        difficulty_level=DifficultyLevel.BEGINNER
    )
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    return course

@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def instructor_auth_headers(test_instructor):
    """Create authentication headers for test instructor."""
    token = create_access_token(data={"sub": str(test_instructor.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(test_admin):
    """Create authentication headers for test admin."""
    token = create_access_token(data={"sub": str(test_admin.id)})
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(autouse=True)
def cleanup_files():
    """Clean up test files after each test."""
    yield
    # Clean up any test files created during tests
    test_files = ["test.db", "test.db-journal"]
    for file in test_files:
        if os.path.exists(file):
            try:
                os.remove(file)
            except:
                pass