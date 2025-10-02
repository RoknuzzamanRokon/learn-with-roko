"""
Tax reporting service for instructor payouts and platform revenue.
"""

import csv
import io
import logging
from typing import List, Dict, Optional
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, func

from ..models.transaction import Transaction, TransactionStatus, InstructorPayout
from ..models.user import User
from ..models.course import Course

logger = logging.getLogger(__name__)


class TaxReportingService:
    """Service for generating tax reports and forms."""

    @staticmethod
    def generate_instructor_1099_data(
        db: Session,
        instructor_id: int,
        tax_year: int
    ) -> Dict:
        """
        Generate 1099-NEC data for an instructor.
        
        Args:
            db: Database session
            instructor_id: Instructor user ID
            tax_year: Tax year
            
        Returns:
            Dict: 1099 form data
        """
        # Get instructor information
        instructor = db.query(User).filter(User.id == instructor_id).first()
        if not instructor:
            raise ValueError("Instructor not found")

        # Calculate year boundaries
        year_start = datetime(tax_year, 1, 1)
        year_end = datetime(tax_year, 12, 31, 23, 59, 59)

        # Get all completed payouts for the tax year
        payouts = db.query(InstructorPayout).filter(
            and_(
                InstructorPayout.instructor_id == instructor_id,
                InstructorPayout.status == TransactionStatus.COMPLETED,
                InstructorPayout.processed_at >= year_start,
                InstructorPayout.processed_at <= year_end
            )
        ).all()

        total_payments = sum(payout.amount for payout in payouts)

        # Get detailed breakdown by quarter
        quarterly_breakdown = {}
        for quarter in range(1, 5):
            if quarter == 1:
                q_start = datetime(tax_year, 1, 1)
                q_end = datetime(tax_year, 3, 31, 23, 59, 59)
            elif quarter == 2:
                q_start = datetime(tax_year, 4, 1)
                q_end = datetime(tax_year, 6, 30, 23, 59, 59)
            elif quarter == 3:
                q_start = datetime(tax_year, 7, 1)
                q_end = datetime(tax_year, 9, 30, 23, 59, 59)
            else:
                q_start = datetime(tax_year, 10, 1)
                q_end = datetime(tax_year, 12, 31, 23, 59, 59)

            quarter_payouts = [
                p for p in payouts 
                if q_start <= p.processed_at <= q_end
            ]
            quarterly_breakdown[f"Q{quarter}"] = {
                "amount": sum(p.amount for p in quarter_payouts),
                "payout_count": len(quarter_payouts)
            }

        return {
            "instructor_id": instructor_id,
            "instructor_name": instructor.full_name,
            "instructor_email": instructor.email,
            "tax_year": tax_year,
            "total_payments": total_payments,
            "payout_count": len(payouts),
            "quarterly_breakdown": quarterly_breakdown,
            "payouts": [
                {
                    "payout_id": p.payout_id,
                    "amount": p.amount,
                    "processed_date": p.processed_at.date() if p.processed_at else None,
                    "period_start": p.period_start.date(),
                    "period_end": p.period_end.date()
                }
                for p in payouts
            ],
            "requires_1099": total_payments >= Decimal("600.00")  # IRS threshold
        }

    @staticmethod
    def generate_platform_tax_summary(
        db: Session,
        tax_year: int
    ) -> Dict:
        """
        Generate platform tax summary for the year.
        
        Args:
            db: Database session
            tax_year: Tax year
            
        Returns:
            Dict: Platform tax summary
        """
        year_start = datetime(tax_year, 1, 1)
        year_end = datetime(tax_year, 12, 31, 23, 59, 59)

        # Get all completed transactions for the year
        transactions = db.query(Transaction).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= year_start,
                Transaction.completed_at <= year_end,
                Transaction.course_id.isnot(None)
            )
        ).all()

        # Get all completed payouts for the year
        payouts = db.query(InstructorPayout).filter(
            and_(
                InstructorPayout.status == TransactionStatus.COMPLETED,
                InstructorPayout.processed_at >= year_start,
                InstructorPayout.processed_at <= year_end
            )
        ).all()

        total_gross_revenue = sum(t.amount for t in transactions)
        total_net_revenue = sum(t.net_amount for t in transactions)
        total_refunds = sum(t.refund_amount for t in transactions)
        total_instructor_payouts = sum(p.amount for p in payouts)
        platform_revenue = total_net_revenue - total_instructor_payouts

        # Monthly breakdown
        monthly_breakdown = {}
        for month in range(1, 13):
            month_start = datetime(tax_year, month, 1)
            if month == 12:
                month_end = datetime(tax_year + 1, 1, 1) - datetime.timedelta(seconds=1)
            else:
                month_end = datetime(tax_year, month + 1, 1) - datetime.timedelta(seconds=1)

            month_transactions = [
                t for t in transactions 
                if month_start <= t.completed_at <= month_end
            ]
            month_payouts = [
                p for p in payouts 
                if p.processed_at and month_start <= p.processed_at <= month_end
            ]

            monthly_breakdown[f"{tax_year}-{month:02d}"] = {
                "gross_revenue": sum(t.amount for t in month_transactions),
                "net_revenue": sum(t.net_amount for t in month_transactions),
                "instructor_payouts": sum(p.amount for p in month_payouts),
                "transaction_count": len(month_transactions),
                "payout_count": len(month_payouts)
            }

        return {
            "tax_year": tax_year,
            "total_gross_revenue": total_gross_revenue,
            "total_net_revenue": total_net_revenue,
            "total_refunds": total_refunds,
            "total_instructor_payouts": total_instructor_payouts,
            "platform_revenue": platform_revenue,
            "transaction_count": len(transactions),
            "payout_count": len(payouts),
            "monthly_breakdown": monthly_breakdown
        }

    @staticmethod
    def export_instructor_payouts_csv(
        db: Session,
        tax_year: int,
        instructor_id: Optional[int] = None
    ) -> str:
        """
        Export instructor payouts to CSV format.
        
        Args:
            db: Database session
            tax_year: Tax year
            instructor_id: Optional instructor ID filter
            
        Returns:
            str: CSV content
        """
        year_start = datetime(tax_year, 1, 1)
        year_end = datetime(tax_year, 12, 31, 23, 59, 59)

        query = db.query(InstructorPayout).join(User).filter(
            and_(
                InstructorPayout.status == TransactionStatus.COMPLETED,
                InstructorPayout.processed_at >= year_start,
                InstructorPayout.processed_at <= year_end
            )
        )

        if instructor_id:
            query = query.filter(InstructorPayout.instructor_id == instructor_id)

        payouts = query.all()

        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow([
            "Payout ID",
            "Instructor ID",
            "Instructor Name",
            "Instructor Email",
            "Amount",
            "Currency",
            "Commission Rate",
            "Period Start",
            "Period End",
            "Processed Date",
            "Payment Method",
            "External Payout ID"
        ])

        # Write data rows
        for payout in payouts:
            writer.writerow([
                payout.payout_id,
                payout.instructor_id,
                payout.instructor.full_name,
                payout.instructor.email,
                str(payout.amount),
                payout.currency,
                str(payout.commission_rate),
                payout.period_start.date().isoformat(),
                payout.period_end.date().isoformat(),
                payout.processed_at.date().isoformat() if payout.processed_at else "",
                payout.payment_method or "",
                payout.external_payout_id or ""
            ])

        return output.getvalue()

    @staticmethod
    def export_platform_revenue_csv(
        db: Session,
        tax_year: int
    ) -> str:
        """
        Export platform revenue data to CSV format.
        
        Args:
            db: Database session
            tax_year: Tax year
            
        Returns:
            str: CSV content
        """
        year_start = datetime(tax_year, 1, 1)
        year_end = datetime(tax_year, 12, 31, 23, 59, 59)

        transactions = db.query(Transaction).join(Course).join(User).filter(
            and_(
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.completed_at >= year_start,
                Transaction.completed_at <= year_end,
                Transaction.course_id.isnot(None)
            )
        ).all()

        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow([
            "Transaction ID",
            "Date",
            "Course ID",
            "Course Title",
            "Instructor ID",
            "Instructor Name",
            "Student ID",
            "Student Name",
            "Gross Amount",
            "Net Amount",
            "Refund Amount",
            "Currency",
            "Payment Method"
        ])

        # Write data rows
        for transaction in transactions:
            writer.writerow([
                transaction.transaction_id,
                transaction.completed_at.date().isoformat(),
                transaction.course_id,
                transaction.course.title,
                transaction.course.instructor_id,
                transaction.course.instructor.full_name,
                transaction.user_id,
                transaction.user.full_name,
                str(transaction.amount),
                str(transaction.net_amount),
                str(transaction.refund_amount),
                transaction.currency,
                transaction.payment_method.value
            ])

        return output.getvalue()

    @staticmethod
    def get_instructors_requiring_1099(
        db: Session,
        tax_year: int,
        threshold: Decimal = Decimal("600.00")
    ) -> List[Dict]:
        """
        Get list of instructors who require 1099 forms.
        
        Args:
            db: Database session
            tax_year: Tax year
            threshold: Minimum payment threshold for 1099
            
        Returns:
            List[Dict]: Instructors requiring 1099 forms
        """
        year_start = datetime(tax_year, 1, 1)
        year_end = datetime(tax_year, 12, 31, 23, 59, 59)

        # Get instructor payout totals for the year
        payout_totals = db.query(
            InstructorPayout.instructor_id,
            func.sum(InstructorPayout.amount).label('total_amount')
        ).filter(
            and_(
                InstructorPayout.status == TransactionStatus.COMPLETED,
                InstructorPayout.processed_at >= year_start,
                InstructorPayout.processed_at <= year_end
            )
        ).group_by(InstructorPayout.instructor_id).all()

        # Filter by threshold and get instructor details
        instructors_1099 = []
        for instructor_id, total_amount in payout_totals:
            if total_amount >= threshold:
                instructor = db.query(User).filter(User.id == instructor_id).first()
                if instructor:
                    instructors_1099.append({
                        "instructor_id": instructor_id,
                        "instructor_name": instructor.full_name,
                        "instructor_email": instructor.email,
                        "total_payments": total_amount,
                        "requires_1099": True
                    })

        return instructors_1099