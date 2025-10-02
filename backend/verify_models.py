#!/usr/bin/env python3
"""
Model verification script for the Learning Management System.
This script tests that all models and relationships are working correctly.
"""

import sys
import os
from sqlalchemy.orm import sessionmaker

# Add the current directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine
from app.models import *

def verify_models():
    """
    Verify that all models and relationships work correctly.
    """
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        print("Verifying database models and relationships...")
        
        # Test basic queries
        print("\n1. Testing basic model queries:")
        
        # Users
        users = db.query(User).all()
        print(f"   - Users: {len(users)} found")
        
        # Categories
        categories = db.query(CourseCategory).all()
        print(f"   - Course Categories: {len(categories)} found")
        
        # Courses
        courses = db.query(Course).all()
        print(f"   - Courses: {len(courses)} found")
        
        # Test relationships
        print("\n2. Testing model relationships:")
        
        if users:
            user = users[0]
            print(f"   - User '{user.full_name}' has role: {user.role.value}")
            print(f"   - User created courses: {len(user.created_courses)}")
            print(f"   - User enrollments: {len(user.enrollments)}")
        
        if categories:
            category = categories[0]
            print(f"   - Category '{category.name}' has {len(category.courses)} courses")
        
        # Test enum values
        print("\n3. Testing enum values:")
        print(f"   - User roles: {[role.value for role in UserRole]}")
        print(f"   - Course statuses: {[status.value for status in CourseStatus]}")
        print(f"   - Difficulty levels: {[level.value for level in DifficultyLevel]}")
        print(f"   - Lecture types: {[type.value for type in LectureType]}")
        print(f"   - Question types: {[type.value for type in QuestionType]}")
        print(f"   - Transaction statuses: {[status.value for status in TransactionStatus]}")
        print(f"   - Payment methods: {[method.value for method in PaymentMethod]}")
        
        # Test model properties
        print("\n4. Testing model properties:")
        
        if users:
            user = users[0]
            print(f"   - User has_permission('create_course'): {user.has_permission('create_course')}")
        
        # Test table creation by checking if we can create sample objects
        print("\n5. Testing model creation (without saving):")
        
        # Create a sample course (don't save)
        if users and categories:
            instructor = next((u for u in users if u.role == UserRole.INSTRUCTOR), users[0])
            category = categories[0]
            
            sample_course = Course(
                title="Test Course",
                description="A test course",
                instructor_id=instructor.id,
                category_id=category.id,
                price=99.99,
                status=CourseStatus.DRAFT,
                difficulty_level=DifficultyLevel.BEGINNER
            )
            print(f"   - Sample course created: {sample_course.title}")
            print(f"   - Course is_free: {sample_course.is_free}")
            print(f"   - Course is_published: {sample_course.is_published}")
        
        print("\n✅ All model verifications passed!")
        return True
        
    except Exception as e:
        print(f"\n❌ Model verification failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

def main():
    """
    Main verification function.
    """
    print("Learning Management System - Model Verification")
    print("=" * 50)
    
    success = verify_models()
    
    if success:
        print("\nDatabase models are working correctly!")
    else:
        print("\nModel verification failed. Please check the errors above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)