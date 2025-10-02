"""
Content moderation service for admin course management.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from ..models.user import User, UserRole
from ..models.course import Course, CourseStatus
from ..models.enrollment import Enrollment


class ModerationService:
    """Service for course and content moderation."""

    @staticmethod
    def get_courses_for_review(
        db: Session,
        status: Optional[str] = None,
        search: Optional[str] = None,
        instructor_id: Optional[int] = None,
        limit: int = 50,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Get courses that need review or moderation.
        
        Args:
            db: Database session
            status: Filter by course status
            search: Search term for course title or description
            instructor_id: Filter by instructor
            limit: Number of courses to return
            offset: Offset for pagination
            
        Returns:
            Dict containing courses and pagination info
        """
        query = db.query(Course).join(User, Course.instructor_id == User.id)
        
        # Apply filters
        if status:
            try:
                course_status = CourseStatus(status)
                query = query.filter(Course.status == course_status)
            except ValueError:
                pass  # Invalid status, ignore filter
        
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Course.title.ilike(search_term),
                    Course.description.ilike(search_term),
                    User.first_name.ilike(search_term),
                    User.last_name.ilike(search_term)
                )
            )
        
        if instructor_id:
            query = query.filter(Course.instructor_id == instructor_id)
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination and ordering
        courses = query.order_by(desc(Course.created_at)).offset(offset).limit(limit).all()
        
        # Format course data with additional info
        course_data = []
        for course in courses:
            enrollment_count = db.query(Enrollment).filter(
                Enrollment.course_id == course.id
            ).count()
            
            course_data.append({
                "id": course.id,
                "title": course.title,
                "description": course.description,
                "short_description": course.short_description,
                "status": course.status.value,
                "difficulty_level": course.difficulty_level.value,
                "price": float(course.price),
                "is_featured": course.is_featured,
                "thumbnail_url": course.thumbnail_url,
                "total_duration": course.total_duration,
                "total_lectures": course.total_lectures,
                "created_at": course.created_at.isoformat(),
                "updated_at": course.updated_at.isoformat(),
                "published_at": course.published_at.isoformat() if course.published_at else None,
                "instructor": {
                    "id": course.instructor.id,
                    "name": course.instructor.full_name,
                    "email": course.instructor.email
                },
                "category": {
                    "id": course.category.id,
                    "name": course.category.name
                } if course.category else None,
                "enrollment_count": enrollment_count
            })
        
        return {
            "courses": course_data,
            "pagination": {
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_next": offset + limit < total_count,
                "has_prev": offset > 0
            }
        }

    @staticmethod
    def update_course_status(
        db: Session,
        course_id: int,
        status: str,
        admin_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update course status (approve, reject, hide, etc.).
        
        Args:
            db: Database session
            course_id: Course ID to update
            status: New status for the course
            admin_notes: Optional admin notes for the status change
            
        Returns:
            Dict containing updated course info
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError("Course not found")
        
        try:
            new_status = CourseStatus(status)
        except ValueError:
            raise ValueError(f"Invalid status: {status}")
        
        old_status = course.status
        course.status = new_status
        
        # Set published_at when publishing
        if new_status == CourseStatus.PUBLISHED and old_status != CourseStatus.PUBLISHED:
            course.published_at = datetime.utcnow()
        
        # Clear published_at when unpublishing
        if new_status != CourseStatus.PUBLISHED and old_status == CourseStatus.PUBLISHED:
            course.published_at = None
        
        course.updated_at = datetime.utcnow()
        
        # TODO: Add admin action logging here if needed
        # This could include storing admin_notes in a separate table
        
        db.commit()
        db.refresh(course)
        
        return {
            "id": course.id,
            "title": course.title,
            "status": course.status.value,
            "published_at": course.published_at.isoformat() if course.published_at else None,
            "updated_at": course.updated_at.isoformat()
        }

    @staticmethod
    def toggle_course_featured(
        db: Session,
        course_id: int,
        is_featured: bool
    ) -> Dict[str, Any]:
        """
        Toggle course featured status.
        
        Args:
            db: Database session
            course_id: Course ID to update
            is_featured: Whether to feature or unfeature the course
            
        Returns:
            Dict containing updated course info
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError("Course not found")
        
        course.is_featured = is_featured
        course.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(course)
        
        return {
            "id": course.id,
            "title": course.title,
            "is_featured": course.is_featured,
            "updated_at": course.updated_at.isoformat()
        }

    @staticmethod
    def get_course_details_for_review(
        db: Session,
        course_id: int
    ) -> Dict[str, Any]:
        """
        Get detailed course information for review.
        
        Args:
            db: Database session
            course_id: Course ID to get details for
            
        Returns:
            Dict containing detailed course information
        """
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            raise ValueError("Course not found")
        
        # Get enrollment statistics
        total_enrollments = db.query(Enrollment).filter(
            Enrollment.course_id == course_id
        ).count()
        
        completed_enrollments = db.query(Enrollment).filter(
            and_(
                Enrollment.course_id == course_id,
                Enrollment.is_completed == True
            )
        ).count()
        
        # Get sections and lectures count
        sections_count = len(course.sections)
        lectures_count = sum(len(section.lectures) for section in course.sections)
        
        return {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "short_description": course.short_description,
            "status": course.status.value,
            "difficulty_level": course.difficulty_level.value,
            "price": float(course.price),
            "is_featured": course.is_featured,
            "thumbnail_url": course.thumbnail_url,
            "preview_video_url": course.preview_video_url,
            "total_duration": course.total_duration,
            "total_lectures": course.total_lectures,
            "language": course.language,
            "allow_qa": course.allow_qa,
            "allow_notes": course.allow_notes,
            "created_at": course.created_at.isoformat(),
            "updated_at": course.updated_at.isoformat(),
            "published_at": course.published_at.isoformat() if course.published_at else None,
            "instructor": {
                "id": course.instructor.id,
                "name": course.instructor.full_name,
                "email": course.instructor.email,
                "role": course.instructor.role.value,
                "created_at": course.instructor.created_at.isoformat()
            },
            "category": {
                "id": course.category.id,
                "name": course.category.name,
                "description": course.category.description
            } if course.category else None,
            "statistics": {
                "total_enrollments": total_enrollments,
                "completed_enrollments": completed_enrollments,
                "completion_rate": (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0,
                "sections_count": sections_count,
                "lectures_count": lectures_count
            },
            "sections": [
                {
                    "id": section.id,
                    "title": section.title,
                    "description": section.description,
                    "order_index": section.order_index,
                    "total_duration": section.total_duration,
                    "total_lectures": section.total_lectures,
                    "lectures": [
                        {
                            "id": lecture.id,
                            "title": lecture.title,
                            "description": lecture.description,
                            "lecture_type": lecture.lecture_type.value,
                            "order_index": lecture.order_index,
                            "duration": lecture.duration,
                            "is_preview": lecture.is_preview,
                            "is_downloadable": lecture.is_downloadable
                        }
                        for lecture in section.lectures
                    ]
                }
                for section in course.sections
            ]
        }

    @staticmethod
    def get_moderation_statistics(db: Session) -> Dict[str, Any]:
        """
        Get moderation statistics for admin dashboard.
        
        Args:
            db: Database session
            
        Returns:
            Dict containing moderation statistics
        """
        # Course status counts
        draft_courses = db.query(Course).filter(Course.status == CourseStatus.DRAFT).count()
        published_courses = db.query(Course).filter(Course.status == CourseStatus.PUBLISHED).count()
        archived_courses = db.query(Course).filter(Course.status == CourseStatus.ARCHIVED).count()
        
        # Featured courses
        featured_courses = db.query(Course).filter(Course.is_featured == True).count()
        
        # Recent course submissions (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_submissions = db.query(Course).filter(
            Course.created_at >= seven_days_ago
        ).count()
        
        # Courses needing review (draft courses older than 1 day)
        one_day_ago = datetime.utcnow() - timedelta(days=1)
        courses_needing_review = db.query(Course).filter(
            and_(
                Course.status == CourseStatus.DRAFT,
                Course.created_at <= one_day_ago
            )
        ).count()
        
        return {
            "course_status": {
                "draft": draft_courses,
                "published": published_courses,
                "archived": archived_courses
            },
            "featured_courses": featured_courses,
            "recent_submissions": recent_submissions,
            "courses_needing_review": courses_needing_review
        }

    @staticmethod
    def bulk_update_courses(
        db: Session,
        course_ids: List[int],
        action: str,
        value: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Perform bulk actions on multiple courses.
        
        Args:
            db: Database session
            course_ids: List of course IDs to update
            action: Action to perform (publish, archive, feature, unfeature)
            value: Optional value for the action
            
        Returns:
            Dict containing results of bulk operation
        """
        if not course_ids:
            return {"updated": 0, "errors": []}
        
        courses = db.query(Course).filter(Course.id.in_(course_ids)).all()
        updated_count = 0
        errors = []
        
        for course in courses:
            try:
                if action == "publish":
                    if course.status != CourseStatus.PUBLISHED:
                        course.status = CourseStatus.PUBLISHED
                        course.published_at = datetime.utcnow()
                        updated_count += 1
                elif action == "archive":
                    if course.status != CourseStatus.ARCHIVED:
                        course.status = CourseStatus.ARCHIVED
                        course.published_at = None
                        updated_count += 1
                elif action == "feature":
                    if not course.is_featured:
                        course.is_featured = True
                        updated_count += 1
                elif action == "unfeature":
                    if course.is_featured:
                        course.is_featured = False
                        updated_count += 1
                else:
                    errors.append(f"Unknown action: {action}")
                    continue
                
                course.updated_at = datetime.utcnow()
                
            except Exception as e:
                errors.append(f"Error updating course {course.id}: {str(e)}")
        
        if updated_count > 0:
            db.commit()
        
        return {
            "updated": updated_count,
            "errors": errors
        }