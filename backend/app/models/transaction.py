"""
Transaction and payment models for the Learning Management System.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.types import DECIMAL
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..database import Base


class TransactionStatus(enum.Enum):
    """Transaction status types."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(enum.Enum):
    """Payment method types."""
    STRIPE = "stripe"
    PAYPAL = "paypal"
    BANK_TRANSFER = "bank_transfer"
    FREE = "free"


class Transaction(Base):
    """
    Financial transactions for course purchases and instructor payouts.
    """
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)  # Nullable for non-course transactions
    
    # Transaction details
    transaction_id = Column(String(100), unique=True, nullable=False, index=True)  # External transaction ID
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    
    # Transaction type and status
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    
    # Payment gateway details
    gateway_transaction_id = Column(String(200), nullable=True)  # Stripe payment intent ID, etc.
    gateway_response = Column(Text, nullable=True)  # JSON response from payment gateway
    
    # Transaction metadata
    description = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Refund information
    refund_amount = Column(DECIMAL(10, 2), default=0.00, nullable=False)
    refund_reason = Column(String(500), nullable=True)
    refunded_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="transactions")
    course = relationship("Course", back_populates="transactions")

    def __repr__(self):
        return f"<Transaction(id={self.id}, transaction_id='{self.transaction_id}', amount={self.amount}, status='{self.status.value}')>"

    @property
    def is_successful(self):
        """Check if transaction was successful."""
        return self.status == TransactionStatus.COMPLETED

    @property
    def net_amount(self):
        """Calculate net amount after refunds."""
        return self.amount - self.refund_amount


class InstructorPayout(Base):
    """
    Instructor payout records for commission payments.
    """
    __tablename__ = "instructor_payouts"

    id = Column(Integer, primary_key=True, index=True)
    
    # Foreign key
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Payout details
    payout_id = Column(String(100), unique=True, nullable=False, index=True)
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    commission_rate = Column(DECIMAL(5, 2), nullable=False)  # Percentage rate used
    
    # Period covered
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Payout status
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False)
    payment_method = Column(String(50), nullable=True)  # Bank transfer, PayPal, etc.
    
    # External payout details
    external_payout_id = Column(String(200), nullable=True)
    payout_details = Column(Text, nullable=True)  # JSON with payout information
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    instructor = relationship("User", foreign_keys=[instructor_id])

    def __repr__(self):
        return f"<InstructorPayout(id={self.id}, payout_id='{self.payout_id}', instructor_id={self.instructor_id}, amount={self.amount})>"