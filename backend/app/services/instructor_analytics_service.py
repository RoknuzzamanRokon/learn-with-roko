"""
Instructor-specific analytics service for course performance and student management.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, case
from ..models.user import User, UserRole
from ..models.course import Course, CourseStatus
from ..models.enrollment import Enrollment, CourseProgress, LectureProgress
from ..models.transaction import Transaction, TransactionStatus
from ..models.assessment import Quiz, QuizAttempt
from ..models.certificate import Certificate


class InstructorAnalyticsService:
    """Service for generating instructor-specific analytics and metrics."""

    @staticmethod
    def get_instructor_dashboard_metrics(db: Session, instructor_id: int) -> Dict[str, Any]:
        """
        Get key metrics for instructor dashboard.
        
        Args:
            db: Database session
            instructor_id: ID of the instructor
            
        Returns:
            Dict containing instructor dashboard metrics
        """
        # Get instructor's courses
        instructor_courses = db.query(Course).filter(
            Course.instructor_id == instructor_id
        ).all()
        course_ids = [course.id for course in instructor_courses]
        
        if not course_ids:
            return {
                "courses": {"total": 0, "published": 0, "draft": 0},
                "students": {"total": 0, "active": 0, "completed": 0},
                "revenue": {"total": 0.0, "this_month": 0.0, "currency": "USD"},
                "engagement": {"avg_completion_rate": 0.0, "avg_rating": 0.0}
            }
        
        # Course metrics
        total_courses = len(instructor_courses)
        published_courses = len([c for c in instructor_courses if c.status == CourseStatus.PUBLISHED])
        draft_courses = total_courses - published_courses
        
        # Student metrics
        total_students = db.query(Enrollment).filter(
            Enrollment.course_id.in_(course_ids)
        ).count()
        
        # Active students (accessed course in last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_students = db.query(Enrollment).filter(
            and_(
                Enrollment.course_id.in_(course_ids),
                Enrollment.last_accessed >= thirty_days_ago
            )
        ).count()
        
        # Completed students
        completed_students = db.query(Enrollment).filter(
            and_(
                Enrollment.course_id.in_(course_ids),
                Enrollment.is_completed == True
            )
        ).count()
        
        # Revenue metrics
        total_revenue_query = db.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.course_id.in_(course_ids),
                Transaction.status == TransactionStatus.COMPLETED
            )
        ).scalar()
        total_revenue = float(total_revenue_query) if total_revenue_query else 0.0
        
        # This month's revenue
        first_of_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_revenue_query = db.query(func.sum(Transaction.amount)).filter(
            and_(
                Transaction.course_id.in_(course_ids),
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.created_at >= first_of_month
            )
        ).scalar()
        month_revenue = float(month_revenue_query) if month_revenue_query else 0.0
        
        # Engagement metrics
        avg_completion_rate = 0.0
        if total_students > 0:
            completion_rates = db.query(Enrollment.progress_percentage).filter(
                Enrollment.course_id.in_(course_ids)
            ).all()
            avg_completion_rate = sum(rate[0] for rate in completion_rates) / len(completion_rates)
        
        return {
            "courses": {
                "total": total_courses,
                "published": published_courses,
                "draft": draft_courses
            },
            "students": {
                "total": total_students,
                "active": active_students,
                "completed": completed_students
            },
            "revenue": {
                "total": total_revenue,
                "this_month": month_revenue,
                "currency": "USD"
            },
            "engagement": {
                "avg_completion_rate": round(avg_completion_rate, 2),
                "avg_rating": 4.5  # Placeholder - would need rating system
            }
        }

    @staticmethod
    def get_course_performance_analytics(
        db: Session, 
        instructor_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict[str, Any]]:
        """
        Get performance analytics for instructor's courses.
        
        Args:
            db: Database session
            instructor_id: ID of the instructor
            start_date: Start date for analytics
            end_date: End date for analytics
            
        Returns:
            List of course performance data
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Get instructor's courses with enrollment and revenue data
        courses_query = db.query(
            Course.id,
            Course.title,
            Course.price,
            Course.status,
            Course.created_at,
            func.count(Enrollment.id).label('total_enrollments'),
            func.count(case([(Enrollment.is_completed == True, 1)])).label('completed_enrollments'),
            func.avg(Enrollment.progress_percentage).label('avg_progress'),
            func.sum(Transaction.amount).label('revenue')
        ).outerjoin(Enrollment, Course.id == Enrollment.course_id)\
         .outerjoin(Transaction, and_(
             Course.id == Transaction.course_id,
             Transaction.status == TransactionStatus.COMPLETED,
             Transaction.created_at >= start_date,
             Transaction.created_at <= end_date
         )).filter(Course.instructor_id == instructor_id)\
         .group_by(Course.id, Course.title, Course.price, Course.status, Course.created_at)\
         .all()
        
        course_performance = []
        for course in courses_query:
            completion_rate = 0.0
            if course.total_enrollments > 0:
                completion_rate = (course.completed_enrollments / course.total_enrollments) * 100
            
            course_performance.append({
                "course_id": course.id,
                "title": course.title,
                "price": float(course.price),
                "status": course.status.value,
                "created_at": course.created_at.isoformat(),
                "total_enrollments": course.total_enrollments,
                "completed_enrollments": course.completed_enrollments,
                "completion_rate": round(completion_rate, 2),
                "avg_progress": round(float(course.avg_progress or 0), 2),
                "revenue": float(course.revenue or 0)
            })
        
        return course_performance

    @staticmethod
    def get_student_progress_tracking(
        db: Session, 
        instructor_id: int, 
        course_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Get student progress tracking for instructor's courses.
        
        Args:
            db: Database session
            instructor_id: ID of the instructor
            course_id: Optional specific course ID
            
        Returns:
            List of student progress data
        """
        # Base query for instructor's courses
        courses_filter = Course.instructor_id == instructor_id
        if course_id:
            courses_filter = and_(courses_filter, Course.id == course_id)
        
        # Get student progress data
        progress_query = db.query(
            User.id.label('student_id'),
            User.first_name,
            User.last_name,
            User.email,
            Course.id.label('course_id'),
            Course.title.label('course_title'),
            Enrollment.enrolled_at,
            Enrollment.progress_percentage,
            Enrollment.is_completed,
            Enrollment.completed_at,
            Enrollment.last_accessed,
            CourseProgress.total_watch_time,
            CourseProgress.completed_lectures,
            CourseProgress.total_lectures
        ).join(Course, Course.instructor_id == instructor_id)\
         .join(Enrollment, Course.id == Enrollment.course_id)\
         .join(User, Enrollment.user_id == User.id)\
         .outerjoin(CourseProgress, and_(
             CourseProgress.user_id == User.id,
             CourseProgress.course_id == Course.id
         )).filter(courses_filter)\
         .order_by(desc(Enrollment.enrolled_at))\
         .all()
        
        student_progress = []
        for progress in progress_query:
            student_progress.append({
                "student_id": progress.student_id,
                "student_name": f"{progress.first_name} {progress.last_name}",
                "student_email": progress.email,
                "course_id": progress.course_id,
                "course_title": progress.course_title,
                "enrolled_at": progress.enrolled_at.isoformat(),
                "progress_percentage": round(progress.progress_percentage, 2),
                "is_completed": progress.is_completed,
                "completed_at": progress.completed_at.isoformat() if progress.completed_at else None,
                "last_accessed": progress.last_accessed.isoformat() if progress.last_accessed else None,
                "total_watch_time": progress.total_watch_time or 0,
                "completed_lectures": progress.completed_lectures or 0,
                "total_lectures": progress.total_lectures or 0
            })
        
        return student_progress

    @staticmethod
    def get_quiz_score_analysis(
        db: Session, 
        instructor_id: int, 
        course_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Get quiz score analysis for instructor's courses.
        
        Args:
            db: Database session
            instructor_id: ID of the instructor
            course_id: Optional specific course ID
            
        Returns:
            Dict containing quiz score analytics
        """
        # Base query for instructor's courses
        courses_filter = Course.instructor_id == instructor_id
        if course_id:
            courses_filter = and_(courses_filter, Course.id == course_id)
        
        # Get quiz attempts data
        quiz_attempts = db.query(
            Quiz.id.label('quiz_id'),
            Quiz.title.label('quiz_title'),
            Course.id.label('course_id'),
            Course.title.label('course_title'),
            QuizAttempt.score,
            QuizAttempt.is_passed,
            QuizAttempt.attempt_number,
            QuizAttempt.completed_at,
            User.first_name,
            User.last_name
        ).join(Course, Quiz.course_id == Course.id)\
         .join(QuizAttempt, Quiz.id == QuizAttempt.quiz_id)\
         .join(User, QuizAttempt.user_id == User.id)\
         .filter(and_(
             courses_filter,
             QuizAttempt.is_completed == True
         )).all()
        
        if not quiz_attempts:
            return {
                "total_attempts": 0,
                "average_score": 0.0,
                "pass_rate": 0.0,
                "quiz_breakdown": []
            }
        
        # Calculate overall statistics
        total_attempts = len(quiz_attempts)
        total_score = sum(attempt.score for attempt in quiz_attempts if attempt.score)
        average_score = total_score / total_attempts if total_attempts > 0 else 0.0
        
        passed_attempts = len([a for a in quiz_attempts if a.is_passed])
        pass_rate = (passed_attempts / total_attempts) * 100 if total_attempts > 0 else 0.0
        
        # Group by quiz for breakdown
        quiz_breakdown = {}
        for attempt in quiz_attempts:
            quiz_key = f"{attempt.quiz_id}_{attempt.quiz_title}"
            if quiz_key not in quiz_breakdown:
                quiz_breakdown[quiz_key] = {
                    "quiz_id": attempt.quiz_id,
                    "quiz_title": attempt.quiz_title,
                    "course_title": attempt.course_title,
                    "attempts": [],
                    "average_score": 0.0,
                    "pass_rate": 0.0
                }
            
            quiz_breakdown[quiz_key]["attempts"].append({
                "student_name": f"{attempt.first_name} {attempt.last_name}",
                "score": attempt.score,
                "is_passed": attempt.is_passed,
                "attempt_number": attempt.attempt_number,
                "completed_at": attempt.completed_at.isoformat() if attempt.completed_at else None
            })
        
        # Calculate quiz-specific statistics
        quiz_stats = []
        for quiz_data in quiz_breakdown.values():
            attempts = quiz_data["attempts"]
            if attempts:
                avg_score = sum(a["score"] for a in attempts if a["score"]) / len(attempts)
                pass_count = len([a for a in attempts if a["is_passed"]])
                pass_rate = (pass_count / len(attempts)) * 100
                
                quiz_stats.append({
                    "quiz_id": quiz_data["quiz_id"],
                    "quiz_title": quiz_data["quiz_title"],
                    "course_title": quiz_data["course_title"],
                    "total_attempts": len(attempts),
                    "average_score": round(avg_score, 2),
                    "pass_rate": round(pass_rate, 2),
                    "recent_attempts": sorted(attempts, key=lambda x: x["completed_at"] or "", reverse=True)[:5]
                })
        
        return {
            "total_attempts": total_attempts,
            "average_score": round(average_score, 2),
            "pass_rate": round(pass_rate, 2),
            "quiz_breakdown": quiz_stats
        }

    @staticmethod
    def get_student_engagement_metrics(
        db: Session, 
        instructor_id: int,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get student engagement metrics for instructor's courses.
        
        Args:
            db: Database session
            instructor_id: ID of the instructor
            days: Number of days to analyze
            
        Returns:
            Dict containing engagement metrics
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get instructor's course IDs
        course_ids = db.query(Course.id).filter(
            Course.instructor_id == instructor_id
        ).subquery()
        
        # Daily active students
        daily_activity = db.query(
            func.date(Enrollment.last_accessed).label('date'),
            func.count(func.distinct(Enrollment.user_id)).label('active_students')
        ).filter(
            and_(
                Enrollment.course_id.in_(course_ids),
                Enrollment.last_accessed >= start_date
            )
        ).group_by(func.date(Enrollment.last_accessed))\
         .order_by(func.date(Enrollment.last_accessed))\
         .all()
        
        # Average session duration (from lecture progress)
        avg_session_duration = db.query(
            func.avg(LectureProgress.watch_time)
        ).join(Enrollment, LectureProgress.user_id == Enrollment.user_id)\
         .filter(
             and_(
                 Enrollment.course_id.in_(course_ids),
                 LectureProgress.last_accessed >= start_date
             )
         ).scalar()
        
        # Most active students
        most_active = db.query(
            User.first_name,
            User.last_name,
            func.count(LectureProgress.id).label('lecture_views'),
            func.sum(LectureProgress.watch_time).label('total_watch_time')
        ).join(LectureProgress, User.id == LectureProgress.user_id)\
         .join(Enrollment, User.id == Enrollment.user_id)\
         .filter(
             and_(
                 Enrollment.course_id.in_(course_ids),
                 LectureProgress.last_accessed >= start_date
             )
         ).group_by(User.id, User.first_name, User.last_name)\
         .order_by(desc('total_watch_time'))\
         .limit(10)\
         .all()
        
        return {
            "period_days": days,
            "daily_activity": [
                {
                    "date": activity.date.isoformat() if activity.date else None,
                    "active_students": activity.active_students
                }
                for activity in daily_activity
            ],
            "avg_session_duration": round(float(avg_session_duration or 0) / 60, 2),  # Convert to minutes
            "most_active_students": [
                {
                    "name": f"{student.first_name} {student.last_name}",
                    "lecture_views": student.lecture_views,
                    "total_watch_time": round(student.total_watch_time / 60, 2)  # Convert to minutes
                }
                for student in most_active
            ]
        }