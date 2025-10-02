"""
Instructor analytics schemas for API responses.
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel


class InstructorDashboardMetrics(BaseModel):
    """Instructor dashboard metrics response schema."""
    courses: Dict[str, int]
    students: Dict[str, int]
    revenue: Dict[str, Any]
    engagement: Dict[str, float]


class CoursePerformance(BaseModel):
    """Individual course performance schema."""
    course_id: int
    title: str
    price: float
    status: str
    created_at: str
    total_enrollments: int
    completed_enrollments: int
    completion_rate: float
    avg_progress: float
    revenue: float


class CoursePerformanceAnalytics(BaseModel):
    """Course performance analytics response schema."""
    courses: List[CoursePerformance]
    summary: Dict[str, Any]


class StudentProgress(BaseModel):
    """Individual student progress schema."""
    student_id: int
    student_name: str
    student_email: str
    course_id: int
    course_title: str
    enrolled_at: str
    progress_percentage: float
    is_completed: bool
    completed_at: Optional[str] = None
    last_accessed: Optional[str] = None
    total_watch_time: int
    completed_lectures: int
    total_lectures: int


class StudentProgressTracking(BaseModel):
    """Student progress tracking response schema."""
    students: List[StudentProgress]
    summary: Dict[str, Any]


class QuizAttemptDetail(BaseModel):
    """Individual quiz attempt detail schema."""
    student_name: str
    score: Optional[float]
    is_passed: bool
    attempt_number: int
    completed_at: Optional[str] = None


class QuizBreakdown(BaseModel):
    """Quiz breakdown statistics schema."""
    quiz_id: int
    quiz_title: str
    course_title: str
    total_attempts: int
    average_score: float
    pass_rate: float
    recent_attempts: List[QuizAttemptDetail]


class QuizScoreAnalytics(BaseModel):
    """Quiz score analytics response schema."""
    total_attempts: int
    average_score: float
    pass_rate: float
    quiz_breakdown: List[QuizBreakdown]


class DailyActivity(BaseModel):
    """Daily activity data point schema."""
    date: Optional[str]
    active_students: int


class ActiveStudent(BaseModel):
    """Most active student schema."""
    name: str
    lecture_views: int
    total_watch_time: float


class StudentEngagementMetrics(BaseModel):
    """Student engagement metrics response schema."""
    period_days: int
    daily_activity: List[DailyActivity]
    avg_session_duration: float
    most_active_students: List[ActiveStudent]


class RevenueAnalyticsData(BaseModel):
    """Revenue analytics data point schema."""
    period: str
    revenue: float
    enrollments: int


class InstructorRevenueAnalytics(BaseModel):
    """Instructor revenue analytics response schema."""
    chart_data: List[RevenueAnalyticsData]
    total_revenue: float
    total_enrollments: int
    avg_revenue_per_enrollment: float
    period: Dict[str, str]


class StudentPerformanceMetrics(BaseModel):
    """Student performance metrics schema."""
    student_id: int
    student_name: str
    student_email: str
    courses_enrolled: int
    courses_completed: int
    avg_completion_rate: float
    total_quiz_attempts: int
    avg_quiz_score: float
    total_watch_time: int
    last_activity: Optional[str] = None


class InstructorStudentManagement(BaseModel):
    """Instructor student management response schema."""
    students: List[StudentPerformanceMetrics]
    summary: Dict[str, Any]