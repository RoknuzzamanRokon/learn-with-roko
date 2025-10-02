"""
Analytics service for admin dashboard metrics and KPIs.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from ..models.user import User, UserRole
from ..models.course import Course, CourseStatus
from ..models.enrollment import Enrollment
from ..models.transaction import Transaction, TransactionStatus
from ..models.certificate import Certificate


class AnalyticsService:
    """Service for generating analytics data and metrics."""

    @staticmethod
    def get_dashboard_metrics(db: Session) -> Dict[str, Any]:
        """
        Get key metrics for admin dashboard.
        
        Args:
            db: Database session
            
        Returns:
            Dict containing dashboard metrics
        """
        # Total users by role
        total_users = db.query(User).filter(User.is_active == True).count()
        total_learners = db.query(User).filter(
            and_(User.role == UserRole.LEARNER, User.is_active == True)
        ).count()
        total_instructors = db.query(User).filter(
            and_(User.role == UserRole.INSTRUCTOR, User.is_active == True)
        ).count()
        
        # Course metrics
        total_courses = db.query(Course).count()
        published_courses = db.query(Course).filter(
            Course.status == CourseStatus.PUBLISHED
        ).count()
        
        # Enrollment metrics
        total_enrollments = db.query(Enrollment).count()
        completed_enrollments = db.query(Enrollment).filter(
            Enrollment.is_completed == True
        ).count()
        
        # Revenue metrics
        revenue_query = db.query(func.sum(Transaction.amount)).filter(
            Transaction.status == TransactionStatus.COMPLETED
        ).scalar()
        total_revenue = float(revenue_query) if revenue_query else 0.0
        
        # Recent signups (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_signups = db.query(User).filter(
            and_(
                User.created_at >= thirty_days_ago,
                User.is_active == True
            )
        ).count()
        
        # Certificates issued
        total_certificates = db.query(Certificate).count()
        
        return {
            "users": {
                "total": total_users,
                "learners": total_learners,
                "instructors": total_instructors,
                "recent_signups": recent_signups
            },
            "courses": {
                "total": total_courses,
                "published": published_courses,
                "draft": total_courses - published_courses
            },
            "enrollments": {
                "total": total_enrollments,
                "completed": completed_enrollments,
                "completion_rate": (completed_enrollments / total_enrollments * 100) if total_enrollments > 0 else 0
            },
            "revenue": {
                "total": total_revenue,
                "currency": "USD"
            },
            "certificates": {
                "total": total_certificates
            }
        }

    @staticmethod
    def get_recent_activity(db: Session, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get recent platform activity for activity feed.
        
        Args:
            db: Database session
            limit: Number of activities to return
            
        Returns:
            List of recent activities
        """
        activities = []
        
        # Recent user registrations
        recent_users = db.query(User).filter(
            User.is_active == True
        ).order_by(desc(User.created_at)).limit(5).all()
        
        for user in recent_users:
            activities.append({
                "type": "user_registration",
                "message": f"New user {user.full_name} registered",
                "timestamp": user.created_at,
                "user_id": user.id,
                "user_name": user.full_name
            })
        
        # Recent course creations
        recent_courses = db.query(Course).order_by(desc(Course.created_at)).limit(5).all()
        
        for course in recent_courses:
            activities.append({
                "type": "course_creation",
                "message": f"New course '{course.title}' created by {course.instructor.full_name}",
                "timestamp": course.created_at,
                "course_id": course.id,
                "course_title": course.title,
                "instructor_name": course.instructor.full_name
            })
        
        # Recent enrollments
        recent_enrollments = db.query(Enrollment).join(User).join(Course).order_by(
            desc(Enrollment.enrolled_at)
        ).limit(5).all()
        
        for enrollment in recent_enrollments:
            activities.append({
                "type": "enrollment",
                "message": f"{enrollment.user.full_name} enrolled in '{enrollment.course.title}'",
                "timestamp": enrollment.enrolled_at,
                "user_id": enrollment.user_id,
                "user_name": enrollment.user.full_name,
                "course_id": enrollment.course_id,
                "course_title": enrollment.course.title
            })
        
        # Recent course completions
        recent_completions = db.query(Enrollment).join(User).join(Course).filter(
            Enrollment.is_completed == True
        ).order_by(desc(Enrollment.completed_at)).limit(5).all()
        
        for completion in recent_completions:
            activities.append({
                "type": "course_completion",
                "message": f"{completion.user.full_name} completed '{completion.course.title}'",
                "timestamp": completion.completed_at,
                "user_id": completion.user_id,
                "user_name": completion.user.full_name,
                "course_id": completion.course_id,
                "course_title": completion.course.title
            })
        
        # Sort all activities by timestamp and limit
        activities.sort(key=lambda x: x["timestamp"], reverse=True)
        return activities[:limit]

    @staticmethod
    def get_system_health(db: Session) -> Dict[str, Any]:
        """
        Get system health indicators and alerts.
        
        Args:
            db: Database session
            
        Returns:
            Dict containing system health status
        """
        health_status = {
            "overall_status": "healthy",
            "alerts": [],
            "metrics": {}
        }
        
        # Check for failed transactions in last 24 hours
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        failed_transactions = db.query(Transaction).filter(
            and_(
                Transaction.status == TransactionStatus.FAILED,
                Transaction.created_at >= twenty_four_hours_ago
            )
        ).count()
        
        if failed_transactions > 10:
            health_status["alerts"].append({
                "type": "payment_failures",
                "severity": "warning",
                "message": f"{failed_transactions} failed transactions in the last 24 hours",
                "count": failed_transactions
            })
            health_status["overall_status"] = "warning"
        
        # Check for inactive instructors (no course activity in 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        inactive_instructors = db.query(User).filter(
            and_(
                User.role == UserRole.INSTRUCTOR,
                User.is_active == True,
                User.last_login < thirty_days_ago
            )
        ).count()
        
        if inactive_instructors > 5:
            health_status["alerts"].append({
                "type": "inactive_instructors",
                "severity": "info",
                "message": f"{inactive_instructors} instructors haven't logged in for 30+ days",
                "count": inactive_instructors
            })
        
        # Database connection health (basic check)
        try:
            db.execute("SELECT 1")
            health_status["metrics"]["database"] = "connected"
        except Exception:
            health_status["alerts"].append({
                "type": "database_connection",
                "severity": "critical",
                "message": "Database connection issues detected"
            })
            health_status["overall_status"] = "critical"
            health_status["metrics"]["database"] = "disconnected"
        
        return health_status

    @staticmethod
    def get_revenue_analytics(
        db: Session, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_by: str = "day"
    ) -> Dict[str, Any]:
        """
        Get revenue analytics with time-based grouping.
        
        Args:
            db: Database session
            start_date: Start date for analytics
            end_date: End date for analytics
            group_by: Grouping period (day, week, month)
            
        Returns:
            Dict containing revenue analytics
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Base query for completed transactions
        base_query = db.query(Transaction).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.created_at >= start_date,
                Transaction.created_at <= end_date
            )
        )
        
        # Group by time period
        if group_by == "day":
            date_format = func.date(Transaction.created_at)
        elif group_by == "week":
            date_format = func.date_trunc('week', Transaction.created_at)
        else:  # month
            date_format = func.date_trunc('month', Transaction.created_at)
        
        revenue_data = base_query.with_entities(
            date_format.label('period'),
            func.sum(Transaction.amount).label('revenue'),
            func.count(Transaction.id).label('transaction_count')
        ).group_by(date_format).order_by(date_format).all()
        
        # Format data for charts
        chart_data = []
        for row in revenue_data:
            chart_data.append({
                "period": row.period.isoformat() if row.period else None,
                "revenue": float(row.revenue) if row.revenue else 0.0,
                "transaction_count": row.transaction_count
            })
        
        # Calculate totals
        total_revenue = sum(item["revenue"] for item in chart_data)
        total_transactions = sum(item["transaction_count"] for item in chart_data)
        
        return {
            "chart_data": chart_data,
            "summary": {
                "total_revenue": total_revenue,
                "total_transactions": total_transactions,
                "average_transaction": total_revenue / total_transactions if total_transactions > 0 else 0,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "group_by": group_by
                }
            }
        }

    @staticmethod
    def get_user_registration_analytics(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_by: str = "day"
    ) -> Dict[str, Any]:
        """
        Get user registration analytics with time-based grouping.
        
        Args:
            db: Database session
            start_date: Start date for analytics
            end_date: End date for analytics
            group_by: Grouping period (day, week, month)
            
        Returns:
            Dict containing user registration analytics
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Group by time period
        if group_by == "day":
            date_format = func.date(User.created_at)
        elif group_by == "week":
            date_format = func.date_trunc('week', User.created_at)
        else:  # month
            date_format = func.date_trunc('month', User.created_at)
        
        registration_data = db.query(
            date_format.label('period'),
            func.count(User.id).label('registrations')
        ).filter(
            and_(
                User.created_at >= start_date,
                User.created_at <= end_date,
                User.is_active == True
            )
        ).group_by(date_format).order_by(date_format).all()
        
        # Format data for charts
        chart_data = []
        for row in registration_data:
            chart_data.append({
                "period": row.period.isoformat() if row.period else None,
                "registrations": row.registrations
            })
        
        total_registrations = sum(item["registrations"] for item in chart_data)
        
        return {
            "chart_data": chart_data,
            "summary": {
                "total_registrations": total_registrations,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "group_by": group_by
                }
            }
        }

    @staticmethod
    def get_course_creation_analytics(
        db: Session,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        group_by: str = "day"
    ) -> Dict[str, Any]:
        """
        Get course creation analytics with time-based grouping.
        
        Args:
            db: Database session
            start_date: Start date for analytics
            end_date: End date for analytics
            group_by: Grouping period (day, week, month)
            
        Returns:
            Dict containing course creation analytics
        """
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # Group by time period
        if group_by == "day":
            date_format = func.date(Course.created_at)
        elif group_by == "week":
            date_format = func.date_trunc('week', Course.created_at)
        else:  # month
            date_format = func.date_trunc('month', Course.created_at)
        
        course_data = db.query(
            date_format.label('period'),
            func.count(Course.id).label('courses_created')
        ).filter(
            and_(
                Course.created_at >= start_date,
                Course.created_at <= end_date
            )
        ).group_by(date_format).order_by(date_format).all()
        
        # Format data for charts
        chart_data = []
        for row in course_data:
            chart_data.append({
                "period": row.period.isoformat() if row.period else None,
                "courses_created": row.courses_created
            })
        
        total_courses = sum(item["courses_created"] for item in chart_data)
        
        return {
            "chart_data": chart_data,
            "summary": {
                "total_courses": total_courses,
                "period": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                    "group_by": group_by
                }
            }
        }