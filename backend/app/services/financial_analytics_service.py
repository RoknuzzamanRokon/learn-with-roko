"""
Financial analytics and reporting service.
"""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc, extract

from ..models.transaction import Transaction, TransactionStatus, InstructorPayout
from ..models.user import User, UserRole
from ..models.course import Course
from ..models.enrollment import Enrollment

logger = logging.getLogger(__name__)


class FinancialAnalyticsService:
    """Service for financial analytics and reporting."""

    @staticmethod
    def get_revenue_overview(
        db: Session,
        period_start: datetime,
        period_end: datetime
    ) -> Dict:
        """
        Get comprehensive revenue overview for a period.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Dict: Revenue overview data
        """
        # Get all completed transactions in the period
        transactions = db.query(Transaction).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end,
                Transaction.course_id.isnot(None)
            )
        ).all()

        # Calculate basic metrics
        total_transactions = len(transactions)
        gross_revenue = sum(t.amount for t in transactions)
        net_revenue = sum(t.net_amount for t in transactions)
        total_refunds = sum(t.refund_amount for t in transactions)

        # Get instructor payouts for the period
        payouts = db.query(InstructorPayout).filter(
            and_(
                InstructorPayout.status == TransactionStatus.COMPLETED,
                InstructorPayout.processed_at >= period_start,
                InstructorPayout.processed_at <= period_end
            )
        ).all()

        total_instructor_payouts = sum(p.amount for p in payouts)
        platform_revenue = net_revenue - total_instructor_payouts

        # Calculate average transaction value
        avg_transaction_value = gross_revenue / total_transactions if total_transactions > 0 else Decimal("0")

        # Get unique customers
        unique_customers = len(set(t.user_id for t in transactions))

        # Calculate customer lifetime value (simplified)
        customer_ltv = gross_revenue / unique_customers if unique_customers > 0 else Decimal("0")

        return {
            "period_start": period_start,
            "period_end": period_end,
            "total_transactions": total_transactions,
            "gross_revenue": gross_revenue,
            "net_revenue": net_revenue,
            "total_refunds": total_refunds,
            "platform_revenue": platform_revenue,
            "total_instructor_payouts": total_instructor_payouts,
            "avg_transaction_value": avg_transaction_value,
            "unique_customers": unique_customers,
            "customer_ltv": customer_ltv,
            "refund_rate": (total_refunds / gross_revenue * 100) if gross_revenue > 0 else Decimal("0")
        }

    @staticmethod
    def get_revenue_trends(
        db: Session,
        period_start: datetime,
        period_end: datetime,
        interval: str = "daily"
    ) -> List[Dict]:
        """
        Get revenue trends over time.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            interval: Interval for grouping (daily, weekly, monthly)
            
        Returns:
            List[Dict]: Revenue trend data points
        """
        # Determine grouping based on interval
        if interval == "daily":
            date_trunc = func.date(Transaction.completed_at)
            delta = timedelta(days=1)
        elif interval == "weekly":
            date_trunc = func.date_trunc('week', Transaction.completed_at)
            delta = timedelta(weeks=1)
        elif interval == "monthly":
            date_trunc = func.date_trunc('month', Transaction.completed_at)
            delta = timedelta(days=30)  # Approximate
        else:
            raise ValueError("Invalid interval. Use 'daily', 'weekly', or 'monthly'")

        # Query revenue by period
        revenue_data = db.query(
            date_trunc.label('period'),
            func.count(Transaction.id).label('transaction_count'),
            func.sum(Transaction.amount).label('gross_revenue'),
            func.sum(Transaction.net_amount).label('net_revenue'),
            func.sum(Transaction.refund_amount).label('total_refunds')
        ).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end,
                Transaction.course_id.isnot(None)
            )
        ).group_by(date_trunc).order_by(date_trunc).all()

        # Convert to list of dictionaries
        trends = []
        for row in revenue_data:
            trends.append({
                "period": row.period.isoformat() if row.period else None,
                "transaction_count": row.transaction_count or 0,
                "gross_revenue": row.gross_revenue or Decimal("0"),
                "net_revenue": row.net_revenue or Decimal("0"),
                "total_refunds": row.total_refunds or Decimal("0")
            })

        return trends

    @staticmethod
    def get_course_revenue_analysis(
        db: Session,
        period_start: datetime,
        period_end: datetime,
        limit: int = 20
    ) -> List[Dict]:
        """
        Get revenue analysis by course.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            limit: Number of top courses to return
            
        Returns:
            List[Dict]: Course revenue analysis
        """
        course_revenue = db.query(
            Course.id,
            Course.title,
            Course.price,
            User.full_name.label('instructor_name'),
            func.count(Transaction.id).label('sales_count'),
            func.sum(Transaction.amount).label('gross_revenue'),
            func.sum(Transaction.net_amount).label('net_revenue'),
            func.sum(Transaction.refund_amount).label('total_refunds')
        ).join(Transaction).join(User, Course.instructor_id == User.id).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end
            )
        ).group_by(
            Course.id, Course.title, Course.price, User.full_name
        ).order_by(desc('gross_revenue')).limit(limit).all()

        results = []
        for row in course_revenue:
            results.append({
                "course_id": row.id,
                "course_title": row.title,
                "course_price": row.price,
                "instructor_name": row.instructor_name,
                "sales_count": row.sales_count,
                "gross_revenue": row.gross_revenue or Decimal("0"),
                "net_revenue": row.net_revenue or Decimal("0"),
                "total_refunds": row.total_refunds or Decimal("0"),
                "refund_rate": (
                    (row.total_refunds / row.gross_revenue * 100) 
                    if row.gross_revenue and row.gross_revenue > 0 
                    else Decimal("0")
                )
            })

        return results

    @staticmethod
    def get_instructor_revenue_analysis(
        db: Session,
        period_start: datetime,
        period_end: datetime,
        limit: int = 20
    ) -> List[Dict]:
        """
        Get revenue analysis by instructor.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            limit: Number of top instructors to return
            
        Returns:
            List[Dict]: Instructor revenue analysis
        """
        instructor_revenue = db.query(
            User.id,
            User.full_name,
            func.count(func.distinct(Course.id)).label('course_count'),
            func.count(Transaction.id).label('sales_count'),
            func.sum(Transaction.amount).label('gross_revenue'),
            func.sum(Transaction.net_amount).label('net_revenue'),
            func.sum(Transaction.refund_amount).label('total_refunds')
        ).join(Course, User.id == Course.instructor_id).join(Transaction).filter(
            and_(
                User.role == UserRole.INSTRUCTOR,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end
            )
        ).group_by(User.id, User.full_name).order_by(desc('gross_revenue')).limit(limit).all()

        results = []
        for row in instructor_revenue:
            # Calculate estimated commission (using default 70%)
            estimated_commission = (row.net_revenue or Decimal("0")) * Decimal("0.70")
            
            results.append({
                "instructor_id": row.id,
                "instructor_name": row.full_name,
                "course_count": row.course_count,
                "sales_count": row.sales_count,
                "gross_revenue": row.gross_revenue or Decimal("0"),
                "net_revenue": row.net_revenue or Decimal("0"),
                "total_refunds": row.total_refunds or Decimal("0"),
                "estimated_commission": estimated_commission,
                "avg_revenue_per_course": (
                    (row.gross_revenue / row.course_count) 
                    if row.course_count > 0 
                    else Decimal("0")
                )
            })

        return results

    @staticmethod
    def get_payment_method_analysis(
        db: Session,
        period_start: datetime,
        period_end: datetime
    ) -> List[Dict]:
        """
        Get analysis of payment methods used.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            List[Dict]: Payment method analysis
        """
        payment_analysis = db.query(
            Transaction.payment_method,
            func.count(Transaction.id).label('transaction_count'),
            func.sum(Transaction.amount).label('total_revenue'),
            func.avg(Transaction.amount).label('avg_transaction_value')
        ).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end,
                Transaction.course_id.isnot(None)
            )
        ).group_by(Transaction.payment_method).all()

        total_transactions = sum(row.transaction_count for row in payment_analysis)
        total_revenue = sum(row.total_revenue or Decimal("0") for row in payment_analysis)

        results = []
        for row in payment_analysis:
            results.append({
                "payment_method": row.payment_method.value,
                "transaction_count": row.transaction_count,
                "total_revenue": row.total_revenue or Decimal("0"),
                "avg_transaction_value": row.avg_transaction_value or Decimal("0"),
                "percentage_of_transactions": (
                    (row.transaction_count / total_transactions * 100) 
                    if total_transactions > 0 
                    else Decimal("0")
                ),
                "percentage_of_revenue": (
                    (row.total_revenue / total_revenue * 100) 
                    if total_revenue > 0 
                    else Decimal("0")
                )
            })

        return results

    @staticmethod
    def get_refund_analysis(
        db: Session,
        period_start: datetime,
        period_end: datetime
    ) -> Dict:
        """
        Get detailed refund analysis.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Dict: Refund analysis data
        """
        # Get all transactions with refunds
        refunded_transactions = db.query(Transaction).filter(
            and_(
                Transaction.refund_amount > 0,
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end
            )
        ).all()

        # Get all transactions for comparison
        all_transactions = db.query(Transaction).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end,
                Transaction.course_id.isnot(None)
            )
        ).all()

        total_transactions = len(all_transactions)
        total_refunded = len(refunded_transactions)
        total_refund_amount = sum(t.refund_amount for t in refunded_transactions)
        total_revenue = sum(t.amount for t in all_transactions)

        # Analyze refund reasons
        refund_reasons = {}
        for transaction in refunded_transactions:
            reason = transaction.refund_reason or "No reason provided"
            if reason not in refund_reasons:
                refund_reasons[reason] = {
                    "count": 0,
                    "total_amount": Decimal("0")
                }
            refund_reasons[reason]["count"] += 1
            refund_reasons[reason]["total_amount"] += transaction.refund_amount

        # Top refunded courses
        course_refunds = {}
        for transaction in refunded_transactions:
            if transaction.course_id:
                course_id = transaction.course_id
                if course_id not in course_refunds:
                    course_refunds[course_id] = {
                        "course_title": transaction.course.title if transaction.course else "Unknown",
                        "refund_count": 0,
                        "refund_amount": Decimal("0")
                    }
                course_refunds[course_id]["refund_count"] += 1
                course_refunds[course_id]["refund_amount"] += transaction.refund_amount

        top_refunded_courses = sorted(
            course_refunds.items(),
            key=lambda x: x[1]["refund_amount"],
            reverse=True
        )[:10]

        return {
            "period_start": period_start,
            "period_end": period_end,
            "total_transactions": total_transactions,
            "total_refunded_transactions": total_refunded,
            "refund_rate": (total_refunded / total_transactions * 100) if total_transactions > 0 else Decimal("0"),
            "total_refund_amount": total_refund_amount,
            "refund_percentage_of_revenue": (total_refund_amount / total_revenue * 100) if total_revenue > 0 else Decimal("0"),
            "avg_refund_amount": total_refund_amount / total_refunded if total_refunded > 0 else Decimal("0"),
            "refund_reasons": refund_reasons,
            "top_refunded_courses": [
                {
                    "course_id": course_id,
                    "course_title": data["course_title"],
                    "refund_count": data["refund_count"],
                    "refund_amount": data["refund_amount"]
                }
                for course_id, data in top_refunded_courses
            ]
        }

    @staticmethod
    def get_financial_dashboard_data(
        db: Session,
        period_start: datetime,
        period_end: datetime
    ) -> Dict:
        """
        Get comprehensive financial dashboard data.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Dict: Dashboard data
        """
        # Get revenue overview
        revenue_overview = FinancialAnalyticsService.get_revenue_overview(
            db, period_start, period_end
        )

        # Get revenue trends (daily for last 30 days, weekly for longer periods)
        period_length = (period_end - period_start).days
        trend_interval = "daily" if period_length <= 30 else "weekly"
        revenue_trends = FinancialAnalyticsService.get_revenue_trends(
            db, period_start, period_end, trend_interval
        )

        # Get top courses and instructors
        top_courses = FinancialAnalyticsService.get_course_revenue_analysis(
            db, period_start, period_end, limit=10
        )
        top_instructors = FinancialAnalyticsService.get_instructor_revenue_analysis(
            db, period_start, period_end, limit=10
        )

        # Get payment method breakdown
        payment_methods = FinancialAnalyticsService.get_payment_method_analysis(
            db, period_start, period_end
        )

        # Get pending payouts
        pending_payouts = db.query(InstructorPayout).filter(
            InstructorPayout.status == TransactionStatus.PENDING
        ).all()

        total_pending_payouts = sum(p.amount for p in pending_payouts)

        return {
            "period_start": period_start,
            "period_end": period_end,
            "revenue_overview": revenue_overview,
            "revenue_trends": revenue_trends,
            "top_courses": top_courses,
            "top_instructors": top_instructors,
            "payment_methods": payment_methods,
            "pending_payouts": {
                "count": len(pending_payouts),
                "total_amount": total_pending_payouts
            }
        }