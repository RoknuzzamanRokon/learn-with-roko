"""
Database initialization script for the Learning Management System.
This script creates the database tables and optionally seeds initial data.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv

# Add the parent directory to the path so we can import our app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, DATABASE_URL
from app.models import *  # Import all models

# Load environment variables
load_dotenv()

def create_database_if_not_exists():
    """
    Create the database if it doesn't exist.
    """
    try:
        # Extract database name from URL
        db_name = os.getenv("DB_NAME", "learn_with_roko")
        db_user = os.getenv("DB_USER", "root")
        db_password = os.getenv("DB_PASSWORD", "")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "3306")
        
        # Create connection without database name
        base_url = f"mysql://{db_user}:{db_password}@{db_host}:{db_port}"
        base_engine = create_engine(base_url)
        
        # Create database if it doesn't exist
        with base_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE IF NOT EXISTS {db_name}"))
            print(f"Database '{db_name}' created or already exists.")
            
        base_engine.dispose()
        
    except OperationalError as e:
        print(f"Error creating database: {e}")
        print("Please ensure MySQL is running and credentials are correct.")
        return False
    
    return True

def create_tables():
    """
    Create all database tables.
    """
    try:
        Base.metadata.create_all(bind=engine)
        print("All database tables created successfully.")
        return True
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False

def seed_initial_data():
    """
    Seed the database with initial data.
    """
    from sqlalchemy.orm import sessionmaker
    from datetime import datetime
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if we already have data
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Database already contains data. Skipping seed.")
            return True
        
        # Create default categories
        categories = [
            CourseCategory(name="Programming", description="Programming and software development courses"),
            CourseCategory(name="Data Science", description="Data science and analytics courses"),
            CourseCategory(name="Design", description="Design and creative courses"),
            CourseCategory(name="Business", description="Business and entrepreneurship courses"),
            CourseCategory(name="Marketing", description="Marketing and digital marketing courses"),
        ]
        
        for category in categories:
            db.add(category)
        
        # Create a super admin user (password will be hashed properly in authentication system)
        super_admin = User(
            email="admin@learnwithroko.com",
            username="admin",
            first_name="Super",
            last_name="Admin",
            hashed_password="$2b$12$placeholder_hash_will_be_replaced_by_auth_system",  # Placeholder
            role=UserRole.SUPER_ADMIN,
            is_active=True,
            is_verified=True,
            bio="System Administrator"
        )
        db.add(super_admin)
        
        # Create a sample instructor
        instructor = User(
            email="instructor@learnwithroko.com",
            username="instructor",
            first_name="John",
            last_name="Instructor",
            hashed_password="$2b$12$placeholder_hash_will_be_replaced_by_auth_system",  # Placeholder
            role=UserRole.INSTRUCTOR,
            is_active=True,
            is_verified=True,
            bio="Sample instructor for testing"
        )
        db.add(instructor)
        
        # Create a sample learner
        learner = User(
            email="learner@learnwithroko.com",
            username="learner",
            first_name="Jane",
            last_name="Learner",
            hashed_password="$2b$12$placeholder_hash_will_be_replaced_by_auth_system",  # Placeholder
            role=UserRole.LEARNER,
            is_active=True,
            is_verified=True,
            bio="Sample learner for testing"
        )
        db.add(learner)
        
        db.commit()
        print("Initial data seeded successfully.")
        print("\nDefault users created:")
        print("Super Admin - Email: admin@learnwithroko.com")
        print("Instructor - Email: instructor@learnwithroko.com")
        print("Learner - Email: learner@learnwithroko.com")
        print("\n⚠️  NOTE: Passwords will be set up when authentication system is implemented.")
        
        return True
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def main():
    """
    Main initialization function.
    """
    print("Initializing Learning Management System Database...")
    print(f"Database URL: {DATABASE_URL}")
    
    # Step 1: Create database if it doesn't exist
    if not create_database_if_not_exists():
        print("Failed to create database. Exiting.")
        return False
    
    # Step 2: Create tables
    if not create_tables():
        print("Failed to create tables. Exiting.")
        return False
    
    # Step 3: Seed initial data
    if not seed_initial_data():
        print("Failed to seed initial data. Exiting.")
        return False
    
    print("\n✅ Database initialization completed successfully!")
    print("You can now start the FastAPI application.")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)