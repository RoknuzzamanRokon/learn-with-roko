# Database Setup - Learning Management System

This document describes the database schema and setup for the Learning Management System.

## Overview

The database schema has been successfully implemented with all core models and relationships. The system uses MySQL as the primary database with SQLAlchemy ORM and Alembic for migrations.

## Database Models

### Core Models Implemented

1. **User Model** (`app/models/user.py`)

   - Supports three roles: Super Admin, Instructor, Learner
   - Includes profile information, authentication fields, and role-based permissions
   - Relationships with courses, enrollments, progress tracking, and interactions

2. **Course Models** (`app/models/course.py`)

   - **Course**: Main course entity with pricing, status, and metadata
   - **CourseCategory**: Hierarchical category system for course organization
   - **Section**: Course sections for organizing content
   - **Lecture**: Individual lectures with support for videos, text, quizzes, and resources

3. **Enrollment Models** (`app/models/enrollment.py`)

   - **Enrollment**: User enrollment in courses
   - **CourseProgress**: Detailed progress tracking at course level
   - **LectureProgress**: Individual lecture progress with video position tracking

4. **Assessment Models** (`app/models/assessment.py`)

   - **Quiz**: Course quizzes with time limits and attempt restrictions
   - **Question**: Quiz questions supporting multiple choice, true/false, short answer, and essay
   - **QuizAttempt**: User quiz attempts with scoring and answer storage

5. **Interaction Models** (`app/models/interaction.py`)

   - **Note**: Timestamped user notes on lectures
   - **QAQuestion**: Student questions on lectures
   - **QAAnswer**: Instructor and peer answers to questions

6. **Certificate Model** (`app/models/certificate.py`)

   - **Certificate**: Course completion certificates with verification codes

7. **Transaction Models** (`app/models/transaction.py`)
   - **Transaction**: Payment transactions for course purchases
   - **InstructorPayout**: Instructor commission payouts

## Database Configuration

### Environment Variables

The database connection is configured using environment variables in `.env`:

```env
DB_NAME=learn_with_roko
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
```

### Connection Details

- **Database**: MySQL
- **ORM**: SQLAlchemy
- **Migration Tool**: Alembic
- **Connection Pooling**: Enabled with pre-ping and recycle settings

## Database Management Scripts

### 1. Database Management (`manage_db.py`)

Main script for database operations:

```bash
# Check database connection and migration status
pipenv run python manage_db.py check

# Run migrations
pipenv run python manage_db.py migrate

# Initialize database with seed data
pipenv run python manage_db.py init

# Create new migration
pipenv run python manage_db.py create-migration -m "Migration message"

# Reset database (WARNING: Deletes all data)
pipenv run python manage_db.py reset
```

### 2. Database Initialization (`app/init_db.py`)

Initializes the database with:

- All table creation
- Default course categories (Programming, Data Science, Design, Business, Marketing)
- Sample users for each role (Super Admin, Instructor, Learner)

### 3. Model Verification (`verify_models.py`)

Tests all models and relationships:

```bash
pipenv run python verify_models.py
```

## Migration System

### Alembic Configuration

- **Configuration**: `alembic.ini`
- **Environment**: `alembic/env.py` (configured to use our models and database URL)
- **Migrations**: `alembic/versions/`

### Current Migration

- **Initial Schema**: `8ef003ba979b_initial_database_schema.py`
- **Status**: Applied successfully
- **Tables Created**: 15 tables with all relationships and indexes

## Key Features Implemented

### 1. Role-Based Access Control

- Three user roles with different permissions
- Permission checking system in User model
- Role-based relationships and access patterns

### 2. Comprehensive Course Structure

- Hierarchical course organization (Course → Section → Lecture)
- Multiple lecture types (video, text, quiz, assignment, resource)
- Course status management (draft, published, archived)
- Difficulty levels and categorization

### 3. Progress Tracking

- Course-level progress with completion percentages
- Lecture-level progress with video position tracking
- Quiz attempt tracking with scoring

### 4. Content Interaction

- Timestamped note-taking on lectures
- Q&A system with instructor responses
- Discussion threading support

### 5. Assessment System

- Flexible quiz system with multiple question types
- Attempt limiting and time restrictions
- Automatic scoring and feedback

### 6. Financial Management

- Transaction tracking for course purchases
- Instructor payout system with commission rates
- Multiple payment method support

### 7. Certification System

- Automatic certificate generation on course completion
- Verification codes for certificate authenticity
- Certificate expiration support

## Database Schema Relationships

```
Users (1) ←→ (M) Courses (instructor relationship)
Users (1) ←→ (M) Enrollments ←→ (M) Courses
Courses (1) ←→ (M) Sections (1) ←→ (M) Lectures
Users (1) ←→ (M) CourseProgress ←→ (1) Courses
Users (1) ←→ (M) LectureProgress ←→ (1) Lectures
Courses (1) ←→ (M) Quizzes (1) ←→ (M) Questions
Users (1) ←→ (M) QuizAttempts ←→ (1) Quizzes
Users (1) ←→ (M) Notes ←→ (1) Lectures
Users (1) ←→ (M) QAQuestions ←→ (1) Lectures
Users (1) ←→ (M) Certificates ←→ (1) Courses
Users (1) ←→ (M) Transactions ←→ (1) Courses
CourseCategories (1) ←→ (M) Courses
```

## Next Steps

The database schema is now complete and ready for the next implementation tasks:

1. **Authentication System** (Task 2.1-2.3)
2. **User Management APIs** (Task 3.1-3.3)
3. **Course Management APIs** (Task 4.1-4.3)

All models include proper relationships, indexes, and constraints to support the full Learning Management System functionality as specified in the requirements and design documents.

## Verification

The database setup has been verified with:

- ✅ All tables created successfully
- ✅ All relationships working correctly
- ✅ All enum values properly defined
- ✅ Model properties and methods functioning
- ✅ Migration system operational
- ✅ Seed data inserted successfully

The database is ready for application development!
