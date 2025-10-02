"""
Commission calculation and payout management service.
"""

import logging
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from ..models.transaction import Transaction, TransactionStatus, InstructorPayout
from ..models.user import User, UserRole
from ..models.course import Course
from ..schemas.transaction import InstructorPayoutCreate

logger = logging.getLogger(__name__)


class CommissionService:
    """Service for managing instructor commissions and payouts."""

    # Default commission rates by tier (can be made configurable)
    DEFAULT_COMMISSION_RATES = {
        "standard": Decimal("70.0"),  # 70% to instructor
        "premium": Decimal("80.0"),   # 80% to instructor
        "exclusive": Decimal("90.0")  # 90% to instructor
    }

    @staticmethod
    def get_instructor_commission_rate(
        db: Session,
        instructor_id: int,
        course_id: Optional[int] = None
    ) -> Decimal:
        """
        Get commission rate for an instructor.
        
        Args:
            db: Database session
            instructor_id: Instructor user ID
            course_id: Optional course ID for course-specific rates
            
        Returns:
            Decimal: Commission rate percentage
        """
        # For now, return standard rate
        # In the future, this could be based on instructor tier, course performance, etc.
        return CommissionService.DEFAULT_COMMISSION_RATES["standard"]

    @staticmethod
    def calculate_instructor_earnings(
        db: Session,
        instructor_id: int,
        period_start: datetime,
        period_end: datetime
    ) -> Dict:
        """
        Calculate detailed instructor earnings for a period.
        
        Args:
            db: Database session
            instructor_id: Instructor user ID
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Dict: Detailed earnings breakdown
        """
        # Get all completed transactions for instructor's courses in the period
        transactions = db.query(Transaction).join(Course).filter(
            and_(
                Course.instructor_id == instructor_id,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.created_at >= period_start,
                Transaction.created_at <= period_end
            )
        ).all()

        # Group transactions by course
        course_earnings = {}
        total_gross_revenue = Decimal("0")
        total_net_revenue = Decimal("0")
        total_commission = Decimal("0")

        for transaction in transactions:
            course_id = transaction.course_id
            if course_id not in course_earnings:
                course_earnings[course_id] = {
                    "course_title": transaction.course.title if transaction.course else "Unknown",
                    "gross_revenue": Decimal("0"),
                    "net_revenue": Decimal("0"),
                    "commission": Decimal("0"),
                    "transaction_count": 0,
                    "commission_rate": CommissionService.get_instructor_commission_rate(
                        db, instructor_id, course_id
                    )
                }

            gross_amount = transaction.amount
            net_amount = transaction.net_amount
            commission_rate = course_earnings[course_id]["commission_rate"]
            commission_amount = net_amount * (commission_rate / 100)

            course_earnings[course_id]["gross_revenue"] += gross_amount
            course_earnings[course_id]["net_revenue"] += net_amount
            course_earnings[course_id]["commission"] += commission_amount
            course_earnings[course_id]["transaction_count"] += 1

            total_gross_revenue += gross_amount
            total_net_revenue += net_amount
            total_commission += commission_amount

        # Get existing payouts for the period
        existing_payouts = db.query(InstructorPayout).filter(
            and_(
                InstructorPayout.instructor_id == instructor_id,
                InstructorPayout.period_start >= period_start,
                InstructorPayout.period_end <= period_end
            )
        ).all()

        total_paid = sum(
            p.amount for p in existing_payouts 
            if p.status == TransactionStatus.COMPLETED
        )
        total_pending_payouts = sum(
            p.amount for p in existing_payouts 
            if p.status == TransactionStatus.PENDING
        )

        return {
            "instructor_id": instructor_id,
            "period_start": period_start,
            "period_end": period_end,
            "total_gross_revenue": total_gross_revenue,
            "total_net_revenue": total_net_revenue,
            "total_commission": total_commission,
            "total_paid": total_paid,
            "total_pending_payouts": total_pending_payouts,
            "available_for_payout": total_commission - total_paid - total_pending_payouts,
            "course_breakdown": course_earnings,
            "transaction_count": len(transactions),
            "existing_payouts": existing_payouts
        }

    @staticmethod
    def create_monthly_payouts(
        db: Session,
        month: int,
        year: int,
        minimum_payout: Decimal = Decimal("50.0")
    ) -> List[InstructorPayout]:
        """
        Create monthly payouts for all eligible instructors.
        
        Args:
            db: Database session
            month: Month (1-12)
            year: Year
            minimum_payout: Minimum amount required for payout
            
        Returns:
            List[InstructorPayout]: Created payouts
        """
        # Calculate period dates
        period_start = datetime(year, month, 1)
        if month == 12:
            period_end = datetime(year + 1, 1, 1) - timedelta(seconds=1)
        else:
            period_end = datetime(year, month + 1, 1) - timedelta(seconds=1)

        # Get all instructors with sales in the period
        instructors_with_sales = db.query(User.id).join(Course).join(Transaction).filter(
            and_(
                User.role == UserRole.INSTRUCTOR,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.created_at >= period_start,
                Transaction.created_at <= period_end
            )
        ).distinct().all()

        created_payouts = []

        for (instructor_id,) in instructors_with_sales:
            earnings = CommissionService.calculate_instructor_earnings(
                db, instructor_id, period_start, period_end
            )

            available_amount = earnings["available_for_payout"]
            
            # Only create payout if amount meets minimum threshold
            if available_amount >= minimum_payout:
                commission_rate = CommissionService.get_instructor_commission_rate(
                    db, instructor_id
                )

                payout_data = InstructorPayoutCreate(
                    instructor_id=instructor_id,
                    amount=available_amount,
                    commission_rate=commission_rate,
                    period_start=period_start,
                    period_end=period_end
                )

                from .transaction_service import InstructorPayoutService
                payout = InstructorPayoutService.create_payout(db, payout_data)
                created_payouts.append(payout)

                logger.info(f"Created payout {payout.payout_id} for instructor {instructor_id}: ${available_amount}")

        return created_payouts

    @staticmethod
    def get_instructor_performance_metrics(
        db: Session,
        instructor_id: int,
        period_start: datetime,
        period_end: datetime
    ) -> Dict:
        """
        Get performance metrics for an instructor.
        
        Args:
            db: Database session
            instructor_id: Instructor user ID
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Dict: Performance metrics
        """
        # Get instructor's courses
        courses = db.query(Course).filter(Course.instructor_id == instructor_id).all()
        
        # Get transactions for the period
        transactions = db.query(Transaction).join(Course).filter(
            and_(
                Course.instructor_id == instructor_id,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.created_at >= period_start,
                Transaction.created_at <= period_end
            )
        ).all()

        # Calculate metrics
        total_courses = len(courses)
        published_courses = len([c for c in courses if c.is_published])
        total_sales = len(transactions)
        total_revenue = sum(t.net_amount for t in transactions)
        
        # Average revenue per course
        avg_revenue_per_course = (
            total_revenue / published_courses if published_courses > 0 else Decimal("0")
        )
        
        # Best performing course
        course_performance = {}
        for transaction in transactions:
            course_id = transaction.course_id
            if course_id not in course_performance:
                course_performance[course_id] = {
                    "course_title": transaction.course.title,
                    "sales": 0,
                    "revenue": Decimal("0")
                }
            course_performance[course_id]["sales"] += 1
            course_performance[course_id]["revenue"] += transaction.net_amount

        best_course = None
        if course_performance:
            best_course = max(
                course_performance.values(),
                key=lambda x: x["revenue"]
            )

        return {
            "instructor_id": instructor_id,
            "period_start": period_start,
            "period_end": period_end,
            "total_courses": total_courses,
            "published_courses": published_courses,
            "total_sales": total_sales,
            "total_revenue": total_revenue,
            "avg_revenue_per_course": avg_revenue_per_course,
            "best_performing_course": best_course,
            "course_performance": course_performance
        }

    @staticmethod
    def get_platform_commission_summary(
        db: Session,
        period_start: datetime,
        period_end: datetime
    ) -> Dict:
        """
        Get platform-wide commission summary.
        
        Args:
            db: Database session
            period_start: Period start date
            period_end: Period end date
            
        Returns:
            Dict: Platform commission summary
        """
        # Get all completed transactions in the period
        transactions = db.query(Transaction).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.created_at >= period_start,
                Transaction.created_at <= period_end,
                Transaction.course_id.isnot(None)  # Only course purchases
            )
        ).all()

        total_gross_revenue = sum(t.amount for t in transactions)
        total_net_revenue = sum(t.net_amount for t in transactions)
        
        # Calculate total instructor commissions
        total_instructor_commission = Decimal("0")
        for transaction in transactions:
            if transaction.course:
                commission_rate = CommissionService.get_instructor_commission_rate(
                    db, transaction.course.instructor_id, transaction.course_id
                )
                commission = transaction.net_amount * (commission_rate / 100)
                total_instructor_commission += commission

        platform_revenue = total_net_revenue - total_instructor_commission

        # Get payout statistics
        payouts = db.query(InstructorPayout).filter(
            and_(
                InstructorPayout.period_start >= period_start,
                InstructorPayout.period_end <= period_end
            )
        ).all()

        total_payouts_pending = sum(
            p.amount for p in payouts if p.status == TransactionStatus.PENDING
        )
        total_payouts_completed = sum(
            p.amount for p in payouts if p.status == TransactionStatus.COMPLETED
        )

        return {
            "period_start": period_start,
            "period_end": period_end,
            "total_transactions": len(transactions),
            "total_gross_revenue": total_gross_revenue,
            "total_net_revenue": total_net_revenue,
            "total_instructor_commission": total_instructor_commission,
            "platform_revenue": platform_revenue,
            "platform_commission_rate": (
                (platform_revenue / total_net_revenue * 100) 
                if total_net_revenue > 0 else Decimal("0")
            ),
            "total_payouts_pending": total_payouts_pending,
            "total_payouts_completed": total_payouts_completed,
            "outstanding_commission": total_instructor_commission - total_payouts_completed - total_payouts_pending
        }