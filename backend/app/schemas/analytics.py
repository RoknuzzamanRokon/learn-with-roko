"""
Analytics schemas for API responses.
"""

from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    """Dashboard metrics response schema."""
    users: Dict[str, int]
    courses: Dict[str, int]
    enrollments: Dict[str, Any]
    revenue: Dict[str, Any]
    certificates: Dict[str, int]


class ActivityItem(BaseModel):
    """Individual activity item schema."""
    type: str
    message: str
    timestamp: datetime
    user_id: Optional[int] = None
    user_name: Optional[str] = None
    course_id: Optional[int] = None
    course_title: Optional[str] = None


class RecentActivity(BaseModel):
    """Recent activity response schema."""
    activities: List[ActivityItem]


class HealthAlert(BaseModel):
    """System health alert schema."""
    type: str
    severity: str
    message: str
    count: Optional[int] = None


class SystemHealth(BaseModel):
    """System health response schema."""
    overall_status: str
    alerts: List[HealthAlert]
    metrics: Dict[str, Any]


class ChartDataPoint(BaseModel):
    """Chart data point schema."""
    period: Optional[str]
    revenue: Optional[float] = None
    transaction_count: Optional[int] = None
    registrations: Optional[int] = None
    courses_created: Optional[int] = None


class AnalyticsSummary(BaseModel):
    """Analytics summary schema."""
    total_revenue: Optional[float] = None
    total_transactions: Optional[int] = None
    average_transaction: Optional[float] = None
    total_registrations: Optional[int] = None
    total_courses: Optional[int] = None
    period: Dict[str, str]


class RevenueAnalytics(BaseModel):
    """Revenue analytics response schema."""
    chart_data: List[ChartDataPoint]
    summary: AnalyticsSummary


class UserRegistrationAnalytics(BaseModel):
    """User registration analytics response schema."""
    chart_data: List[ChartDataPoint]
    summary: AnalyticsSummary


class CourseCreationAnalytics(BaseModel):
    """Course creation analytics response schema."""
    chart_data: List[ChartDataPoint]
    summary: AnalyticsSummary


class AnalyticsFilters(BaseModel):
    """Analytics filters request schema."""
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    group_by: str = "day"  # day, week, month
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }