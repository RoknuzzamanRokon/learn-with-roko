"""
Transaction and payment schemas for the Learning Management System.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum

from ..models.transaction import TransactionStatus, PaymentMethod


class TransactionBase(BaseModel):
    """Base transaction schema."""
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(default="USD", max_length=3, description="Currency code")
    payment_method: PaymentMethod = Field(..., description="Payment method used")
    description: Optional[str] = Field(None, max_length=500, description="Transaction description")
    notes: Optional[str] = Field(None, description="Additional notes")


class TransactionCreate(TransactionBase):
    """Schema for creating a new transaction."""
    course_id: Optional[int] = Field(None, description="Course ID for course purchases")
    gateway_transaction_id: Optional[str] = Field(None, max_length=200, description="External gateway transaction ID")


class TransactionUpdate(BaseModel):
    """Schema for updating a transaction."""
    status: Optional[TransactionStatus] = None
    gateway_transaction_id: Optional[str] = Field(None, max_length=200)
    gateway_response: Optional[str] = None
    description: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None
    completed_at: Optional[datetime] = None


class RefundCreate(BaseModel):
    """Schema for creating a refund."""
    refund_amount: Decimal = Field(..., gt=0, description="Amount to refund")
    refund_reason: str = Field(..., max_length=500, description="Reason for refund")


class TransactionResponse(TransactionBase):
    """Schema for transaction response."""
    id: int
    transaction_id: str
    user_id: int
    course_id: Optional[int]
    status: TransactionStatus
    gateway_transaction_id: Optional[str]
    refund_amount: Decimal
    refund_reason: Optional[str]
    refunded_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    net_amount: Decimal

    class Config:
        from_attributes = True


class TransactionListResponse(BaseModel):
    """Schema for transaction list response."""
    transactions: List[TransactionResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class TransactionFilter(BaseModel):
    """Schema for filtering transactions."""
    user_id: Optional[int] = None
    course_id: Optional[int] = None
    status: Optional[TransactionStatus] = None
    payment_method: Optional[PaymentMethod] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None


class PaymentIntentCreate(BaseModel):
    """Schema for creating a payment intent."""
    course_id: int = Field(..., description="Course ID to purchase")
    payment_method: PaymentMethod = Field(default=PaymentMethod.STRIPE, description="Payment method")
    return_url: Optional[str] = Field(None, description="Return URL after payment")


class PaymentIntentResponse(BaseModel):
    """Schema for payment intent response."""
    client_secret: str = Field(..., description="Client secret for frontend")
    transaction_id: str = Field(..., description="Internal transaction ID")
    amount: Decimal = Field(..., description="Payment amount")
    currency: str = Field(..., description="Currency code")


class WebhookEvent(BaseModel):
    """Schema for webhook events."""
    event_type: str = Field(..., description="Type of webhook event")
    event_id: str = Field(..., description="Unique event ID")
    data: dict = Field(..., description="Event data")
    created: datetime = Field(..., description="Event creation time")


class InstructorPayoutBase(BaseModel):
    """Base instructor payout schema."""
    amount: Decimal = Field(..., gt=0, description="Payout amount")
    currency: str = Field(default="USD", max_length=3, description="Currency code")
    commission_rate: Decimal = Field(..., ge=0, le=100, description="Commission rate percentage")
    period_start: datetime = Field(..., description="Payout period start")
    period_end: datetime = Field(..., description="Payout period end")
    payment_method: Optional[str] = Field(None, max_length=50, description="Payout method")


class InstructorPayoutCreate(InstructorPayoutBase):
    """Schema for creating instructor payout."""
    instructor_id: int = Field(..., description="Instructor user ID")


class InstructorPayoutUpdate(BaseModel):
    """Schema for updating instructor payout."""
    status: Optional[TransactionStatus] = None
    external_payout_id: Optional[str] = Field(None, max_length=200)
    payout_details: Optional[str] = None
    processed_at: Optional[datetime] = None


class InstructorPayoutResponse(InstructorPayoutBase):
    """Schema for instructor payout response."""
    id: int
    payout_id: str
    instructor_id: int
    status: TransactionStatus
    external_payout_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class InstructorPayoutListResponse(BaseModel):
    """Schema for instructor payout list response."""
    payouts: List[InstructorPayoutResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class InstructorEarnings(BaseModel):
    """Schema for instructor earnings summary."""
    instructor_id: int
    total_earnings: Decimal
    pending_earnings: Decimal
    paid_earnings: Decimal
    total_sales: int
    commission_rate: Decimal
    period_start: datetime
    period_end: datetime