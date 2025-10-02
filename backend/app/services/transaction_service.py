"""
Transaction service for handling payments and financial operations.
"""

import uuid
import json
import logging
from typing import Optional, List, Tuple
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func

from ..models.transaction import Transaction, TransactionStatus, PaymentMethod, InstructorPayout
from ..models.user import User
from ..models.course import Course
from ..models.enrollment import Enrollment
from ..schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionFilter,
    RefundCreate, InstructorPayoutCreate, InstructorPayoutUpdate,
    InstructorEarnings
)

logger = logging.getLogger(__name__)


class TransactionService:
    """Service for managing transactions and payments."""

    @staticmethod
    def create_transaction(
        db: Session,
        user_id: int,
        transaction_data: TransactionCreate
    ) -> Transaction:
        """
        Create a new transaction record.
        
        Args:
            db: Database session
            user_id: ID of the user making the transaction
            transaction_data: Transaction creation data
            
        Returns:
            Transaction: Created transaction object
        """
        # Generate unique transaction ID
        transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
        
        # Create transaction
        transaction = Transaction(
            transaction_id=transaction_id,
            user_id=user_id,
            course_id=transaction_data.course_id,
            amount=transaction_data.amount,
            currency=transaction_data.currency,
            payment_method=transaction_data.payment_method,
            description=transaction_data.description,
            notes=transaction_data.notes,
            gateway_transaction_id=transaction_data.gateway_transaction_id,
            status=TransactionStatus.PENDING
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        logger.info(f"Created transaction {transaction.transaction_id} for user {user_id}")
        return transaction

    @staticmethod
    def update_transaction(
        db: Session,
        transaction_id: str,
        update_data: TransactionUpdate
    ) -> Optional[Transaction]:
        """
        Update an existing transaction.
        
        Args:
            db: Database session
            transaction_id: Transaction ID to update
            update_data: Update data
            
        Returns:
            Transaction: Updated transaction or None if not found
        """
        transaction = db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()
        
        if not transaction:
            return None
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(transaction, field, value)
        
        db.commit()
        db.refresh(transaction)
        
        logger.info(f"Updated transaction {transaction_id}")
        return transaction

    @staticmethod
    def get_transaction(db: Session, transaction_id: str) -> Optional[Transaction]:
        """
        Get a transaction by ID.
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            
        Returns:
            Transaction: Transaction object or None if not found
        """
        return db.query(Transaction).filter(
            Transaction.transaction_id == transaction_id
        ).first()

    @staticmethod
    def get_transaction_by_gateway_id(
        db: Session,
        gateway_transaction_id: str
    ) -> Optional[Transaction]:
        """
        Get a transaction by gateway transaction ID.
        
        Args:
            db: Database session
            gateway_transaction_id: Gateway transaction ID
            
        Returns:
            Transaction: Transaction object or None if not found
        """
        return db.query(Transaction).filter(
            Transaction.gateway_transaction_id == gateway_transaction_id
        ).first()

    @staticmethod
    def list_transactions(
        db: Session,
        filters: Optional[TransactionFilter] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Transaction], int]:
        """
        List transactions with filtering and pagination.
        
        Args:
            db: Database session
            filters: Filter criteria
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple[List[Transaction], int]: List of transactions and total count
        """
        query = db.query(Transaction)
        
        # Apply filters
        if filters:
            if filters.user_id:
                query = query.filter(Transaction.user_id == filters.user_id)
            if filters.course_id:
                query = query.filter(Transaction.course_id == filters.course_id)
            if filters.status:
                query = query.filter(Transaction.status == filters.status)
            if filters.payment_method:
                query = query.filter(Transaction.payment_method == filters.payment_method)
            if filters.start_date:
                query = query.filter(Transaction.created_at >= filters.start_date)
            if filters.end_date:
                query = query.filter(Transaction.created_at <= filters.end_date)
            if filters.min_amount:
                query = query.filter(Transaction.amount >= filters.min_amount)
            if filters.max_amount:
                query = query.filter(Transaction.amount <= filters.max_amount)
        
        # Get total count
        total = query.count()
        
        # Apply pagination and ordering
        transactions = query.order_by(desc(Transaction.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return transactions, total

    @staticmethod
    def complete_transaction(
        db: Session,
        transaction_id: str,
        gateway_response: Optional[str] = None
    ) -> Optional[Transaction]:
        """
        Mark a transaction as completed and handle enrollment.
        
        Args:
            db: Database session
            transaction_id: Transaction ID
            gateway_response: Gateway response data
            
        Returns:
            Transaction: Updated transaction or None if not found
        """
        transaction = TransactionService.get_transaction(db, transaction_id)
        if not transaction:
            return None
        
        # Update transaction status
        transaction.status = TransactionStatus.COMPLETED
        transaction.completed_at = datetime.utcnow()
        if gateway_response:
            transaction.gateway_response = gateway_response
        
        # If this is a course purchase, create enrollment
        if transaction.course_id and transaction.status == TransactionStatus.COMPLETED:
            existing_enrollment = db.query(Enrollment).filter(
                and_(
                    Enrollment.user_id == transaction.user_id,
                    Enrollment.course_id == transaction.course_id
                )
            ).first()
            
            if not existing_enrollment:
                enrollment = Enrollment(
                    user_id=transaction.user_id,
                    course_id=transaction.course_id,
                    enrolled_at=datetime.utcnow()
                )
                db.add(enrollment)
        
        db.commit()
        db.refresh(transaction)
        
        logger.info(f"Completed transaction {transaction_id}")
        return transaction

    @staticmethod
    def refund_transaction(
        db: Session,
        transaction_id: str,
        refund_data: RefundCreate
    ) -> Optional[Transaction]:
        """
        Process a refund for a transaction.
        
        Args:
            db: Database session
            transaction_id: Transaction ID to refund
            refund_data: Refund details
            
        Returns:
            Transaction: Updated transaction or None if not found
        """
        transaction = TransactionService.get_transaction(db, transaction_id)
        if not transaction:
            return None
        
        if transaction.status != TransactionStatus.COMPLETED:
            raise ValueError("Can only refund completed transactions")
        
        if refund_data.refund_amount > transaction.amount:
            raise ValueError("Refund amount cannot exceed transaction amount")
        
        # Update transaction with refund information
        transaction.refund_amount = refund_data.refund_amount
        transaction.refund_reason = refund_data.refund_reason
        transaction.refunded_at = datetime.utcnow()
        
        # If full refund, update status
        if refund_data.refund_amount == transaction.amount:
            transaction.status = TransactionStatus.REFUNDED
        
        db.commit()
        db.refresh(transaction)
        
        logger.info(f"Processed refund for transaction {transaction_id}")
        return transaction

    @staticmethod
    def get_user_transactions(
        db: Session,
        user_id: int,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Transaction], int]:
        """
        Get transactions for a specific user.
        
        Args:
            db: Database session
            user_id: User ID
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple[List[Transaction], int]: List of transactions and total count
        """
        filters = TransactionFilter(user_id=user_id)
        return TransactionService.list_transactions(db, filters, page, per_page)

    @staticmethod
    def get_course_transactions(
        db: Session,
        course_id: int,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Transaction], int]:
        """
        Get transactions for a specific course.
        
        Args:
            db: Database session
            course_id: Course ID
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple[List[Transaction], int]: List of transactions and total count
        """
        filters = TransactionFilter(course_id=course_id)
        return TransactionService.list_transactions(db, filters, page, per_page)


class InstructorPayoutService:
    """Service for managing instructor payouts."""

    @staticmethod
    def create_payout(
        db: Session,
        payout_data: InstructorPayoutCreate
    ) -> InstructorPayout:
        """
        Create a new instructor payout.
        
        Args:
            db: Database session
            payout_data: Payout creation data
            
        Returns:
            InstructorPayout: Created payout object
        """
        # Generate unique payout ID
        payout_id = f"payout_{uuid.uuid4().hex[:12]}"
        
        payout = InstructorPayout(
            payout_id=payout_id,
            instructor_id=payout_data.instructor_id,
            amount=payout_data.amount,
            currency=payout_data.currency,
            commission_rate=payout_data.commission_rate,
            period_start=payout_data.period_start,
            period_end=payout_data.period_end,
            payment_method=payout_data.payment_method,
            status=TransactionStatus.PENDING
        )
        
        db.add(payout)
        db.commit()
        db.refresh(payout)
        
        logger.info(f"Created payout {payout.payout_id} for instructor {payout_data.instructor_id}")
        return payout

    @staticmethod
    def update_payout(
        db: Session,
        payout_id: str,
        update_data: InstructorPayoutUpdate
    ) -> Optional[InstructorPayout]:
        """
        Update an instructor payout.
        
        Args:
            db: Database session
            payout_id: Payout ID
            update_data: Update data
            
        Returns:
            InstructorPayout: Updated payout or None if not found
        """
        payout = db.query(InstructorPayout).filter(
            InstructorPayout.payout_id == payout_id
        ).first()
        
        if not payout:
            return None
        
        # Update fields
        for field, value in update_data.dict(exclude_unset=True).items():
            setattr(payout, field, value)
        
        db.commit()
        db.refresh(payout)
        
        logger.info(f"Updated payout {payout_id}")
        return payout

    @staticmethod
    def get_instructor_earnings(
        db: Session,
        instructor_id: int,
        period_start: datetime,
        period_end: datetime,
        commission_rate: Decimal = Decimal("70.0")
    ) -> InstructorEarnings:
        """
        Calculate instructor earnings for a period.
        
        Args:
            db: Database session
            instructor_id: Instructor user ID
            period_start: Period start date
            period_end: Period end date
            commission_rate: Commission rate percentage
            
        Returns:
            InstructorEarnings: Earnings summary
        """
        # Get completed transactions for instructor's courses in the period
        transactions = db.query(Transaction).join(Course).filter(
            and_(
                Course.instructor_id == instructor_id,
                Transaction.status == TransactionStatus.COMPLETED,
                Transaction.created_at >= period_start,
                Transaction.created_at <= period_end
            )
        ).all()
        
        # Calculate earnings
        total_revenue = sum(t.net_amount for t in transactions)
        total_earnings = total_revenue * (commission_rate / 100)
        
        # Get existing payouts for the period
        existing_payouts = db.query(InstructorPayout).filter(
            and_(
                InstructorPayout.instructor_id == instructor_id,
                InstructorPayout.period_start >= period_start,
                InstructorPayout.period_end <= period_end
            )
        ).all()
        
        paid_earnings = sum(
            p.amount for p in existing_payouts 
            if p.status == TransactionStatus.COMPLETED
        )
        pending_earnings = total_earnings - paid_earnings
        
        return InstructorEarnings(
            instructor_id=instructor_id,
            total_earnings=total_earnings,
            pending_earnings=max(pending_earnings, Decimal("0")),
            paid_earnings=paid_earnings,
            total_sales=len(transactions),
            commission_rate=commission_rate,
            period_start=period_start,
            period_end=period_end
        )

    @staticmethod
    def list_payouts(
        db: Session,
        instructor_id: Optional[int] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[InstructorPayout], int]:
        """
        List instructor payouts with pagination.
        
        Args:
            db: Database session
            instructor_id: Filter by instructor ID
            page: Page number
            per_page: Items per page
            
        Returns:
            Tuple[List[InstructorPayout], int]: List of payouts and total count
        """
        query = db.query(InstructorPayout)
        
        if instructor_id:
            query = query.filter(InstructorPayout.instructor_id == instructor_id)
        
        total = query.count()
        
        payouts = query.order_by(desc(InstructorPayout.created_at)).offset(
            (page - 1) * per_page
        ).limit(per_page).all()
        
        return payouts, total