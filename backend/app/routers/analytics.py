"""
Analytics router for admin dashboard endpoints.
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.analytics_service import AnalyticsService
from ..schemas.analytics import (
    DashboardMetrics,
    RecentActivity,
    SystemHealth,
    RevenueAnalytics,
    UserRegistrationAnalytics,
    CourseCreationAnalytics,
    AnalyticsFilters
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


def require_admin(current_user: User = Depends(get_current_user)):
    """Dependency to require admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get key metrics for admin dashboard.
    
    Returns:
        Dashboard metrics including users, courses, revenue, etc.
    """
    try:
        metrics = AnalyticsService.get_dashboard_metrics(db)
        return DashboardMetrics(**metrics)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch dashboard metrics: {str(e)}"
        )


@router.get("/activity", response_model=RecentActivity)
async def get_recent_activity(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get recent platform activity for activity feed.
    
    Args:
        limit: Number of activities to return (1-100)
        
    Returns:
        List of recent platform activities
    """
    try:
        activities = AnalyticsService.get_recent_activity(db, limit)
        return RecentActivity(activities=activities)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recent activity: {str(e)}"
        )


@router.get("/health", response_model=SystemHealth)
async def get_system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get system health indicators and alerts.
    
    Returns:
        System health status with alerts and metrics
    """
    try:
        health = AnalyticsService.get_system_health(db)
        return SystemHealth(**health)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch system health: {str(e)}"
        )


@router.get("/revenue", response_model=RevenueAnalytics)
async def get_revenue_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_by: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get revenue analytics with time-based grouping.
    
    Args:
        start_date: Start date for analytics (ISO format)
        end_date: End date for analytics (ISO format)
        group_by: Grouping period (day, week, month)
        
    Returns:
        Revenue analytics with chart data and summary
    """
    try:
        analytics = AnalyticsService.get_revenue_analytics(
            db, start_date, end_date, group_by
        )
        return RevenueAnalytics(**analytics)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch revenue analytics: {str(e)}"
        )


@router.get("/users", response_model=UserRegistrationAnalytics)
async def get_user_registration_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_by: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get user registration analytics with time-based grouping.
    
    Args:
        start_date: Start date for analytics (ISO format)
        end_date: End date for analytics (ISO format)
        group_by: Grouping period (day, week, month)
        
    Returns:
        User registration analytics with chart data and summary
    """
    try:
        analytics = AnalyticsService.get_user_registration_analytics(
            db, start_date, end_date, group_by
        )
        return UserRegistrationAnalytics(**analytics)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user registration analytics: {str(e)}"
        )


@router.get("/courses", response_model=CourseCreationAnalytics)
async def get_course_creation_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    group_by: str = Query("day", regex="^(day|week|month)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """
    Get course creation analytics with time-based grouping.
    
    Args:
        start_date: Start date for analytics (ISO format)
        end_date: End date for analytics (ISO format)
        group_by: Grouping period (day, week, month)
        
    Returns:
        Course creation analytics with chart data and summary
    """
    try:
        analytics = AnalyticsService.get_course_creation_analytics(
            db, start_date, end_date, group_by
        )
        return CourseCreationAnalytics(**analytics)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch course creation analytics: {str(e)}"
        )