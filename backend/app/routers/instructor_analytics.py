"""
Instructor analytics router for course performance and student management.
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.instructor_analytics_service import InstructorAnalyticsService
from ..schemas.instructor_analytics import (
    InstructorDashboardMetrics,
    CoursePerformanceAnalytics,
    StudentProgressTracking,
    QuizScoreAnalytics,
    StudentEngagementMetrics,
    InstructorRevenueAnalytics,
    InstructorStudentManagement
)

router = APIRouter(prefix="/instructor/analytics", tags=["instructor-analytics"])


def require_instructor(current_user: User = Depends(get_current_user)):
    """Dependency to require instructor or admin role."""
    if current_user.role not in [UserRole.INSTRUCTOR, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=403,
            detail="Instructor access required"
        )
    return current_user


@router.get("/dashboard", response_model=InstructorDashboardMetrics)
async def get_instructor_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Get key metrics for instructor dashboard.
    
    Returns:
        Dashboard metrics including courses, students, revenue, and engagement
    """
    try:
        metrics = InstructorAnalyticsService.get_instructor_dashboard_metrics(
            db, current_user.id
        )
        return InstructorDashboardMetrics(**metrics)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch instructor dashboard metrics: {str(e)}"
        )


@router.get("/course-performance", response_model=CoursePerformanceAnalytics)
async def get_course_performance_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Get performance analytics for instructor's courses.
    
    Args:
        start_date: Start date for analytics (ISO format)
        end_date: End date for analytics (ISO format)
        
    Returns:
        Course performance analytics with enrollment and revenue data
    """
    try:
        courses = InstructorAnalyticsService.get_course_performance_analytics(
            db, current_user.id, start_date, end_date
        )
        
        # Calculate summary statistics
        total_enrollments = sum(course["total_enrollments"] for course in courses)
        total_revenue = sum(course["revenue"] for course in courses)
        avg_completion_rate = (
            sum(course["completion_rate"] for course in courses) / len(courses)
            if courses else 0.0
        )
        
        summary = {
            "total_courses": len(courses),
            "total_enrollments": total_enrollments,
            "total_revenue": total_revenue,
            "avg_completion_rate": round(avg_completion_rate, 2),
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            }
        }
        
        return CoursePerformanceAnalytics(courses=courses, summary=summary)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch course performance analytics: {str(e)}"
        )


@router.get("/student-progress", response_model=StudentProgressTracking)
async def get_student_progress_tracking(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Get student progress tracking for instructor's courses.
    
    Args:
        course_id: Optional specific course ID to filter by
        
    Returns:
        Student progress tracking data with completion and engagement metrics
    """
    try:
        students = InstructorAnalyticsService.get_student_progress_tracking(
            db, current_user.id, course_id
        )
        
        # Calculate summary statistics
        total_students = len(students)
        completed_students = len([s for s in students if s["is_completed"]])
        avg_progress = (
            sum(s["progress_percentage"] for s in students) / total_students
            if total_students > 0 else 0.0
        )
        
        summary = {
            "total_students": total_students,
            "completed_students": completed_students,
            "completion_rate": (completed_students / total_students * 100) if total_students > 0 else 0.0,
            "avg_progress": round(avg_progress, 2),
            "course_filter": course_id
        }
        
        return StudentProgressTracking(students=students, summary=summary)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch student progress tracking: {str(e)}"
        )


@router.get("/quiz-scores", response_model=QuizScoreAnalytics)
async def get_quiz_score_analysis(
    course_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Get quiz score analysis for instructor's courses.
    
    Args:
        course_id: Optional specific course ID to filter by
        
    Returns:
        Quiz score analytics with performance breakdown by quiz
    """
    try:
        analytics = InstructorAnalyticsService.get_quiz_score_analysis(
            db, current_user.id, course_id
        )
        return QuizScoreAnalytics(**analytics)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch quiz score analysis: {str(e)}"
        )


@router.get("/student-engagement", response_model=StudentEngagementMetrics)
async def get_student_engagement_metrics(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Get student engagement metrics for instructor's courses.
    
    Args:
        days: Number of days to analyze (1-365)
        
    Returns:
        Student engagement metrics including activity patterns and top performers
    """
    try:
        metrics = InstructorAnalyticsService.get_student_engagement_metrics(
            db, current_user.id, days
        )
        return StudentEngagementMetrics(**metrics)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch student engagement metrics: {str(e)}"
        )


@router.get("/revenue", response_model=InstructorRevenueAnalytics)
async def get_instructor_revenue_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_by: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Get revenue analytics for instructor's courses.
    
    Args:
        start_date: Start date for analytics (ISO format)
        end_date: End date for analytics (ISO format)
        group_by: Grouping period (day, week, month)
        
    Returns:
        Revenue analytics with time-based grouping and enrollment data
    """
    try:
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        if not end_date:
            end_date = datetime.utcnow()
        
        # This would need to be implemented in the service
        # For now, return a placeholder response
        chart_data = []
        total_revenue = 0.0
        total_enrollments = 0
        
        return InstructorRevenueAnalytics(
            chart_data=chart_data,
            total_revenue=total_revenue,
            total_enrollments=total_enrollments,
            avg_revenue_per_enrollment=0.0,
            period={
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "group_by": group_by
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch instructor revenue analytics: {str(e)}"
        )


@router.get("/students", response_model=InstructorStudentManagement)
async def get_instructor_student_management(
    course_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_instructor)
):
    """
    Get comprehensive student management data for instructor.
    
    Args:
        course_id: Optional specific course ID to filter by
        limit: Number of students to return (1-200)
        offset: Number of students to skip
        
    Returns:
        Comprehensive student management data with performance metrics
    """
    try:
        # This would need to be implemented in the service
        # For now, return a placeholder response
        students = []
        summary = {
            "total_students": 0,
            "active_students": 0,
            "avg_completion_rate": 0.0,
            "course_filter": course_id
        }
        
        return InstructorStudentManagement(students=students, summary=summary)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch instructor student management data: {str(e)}"
        )