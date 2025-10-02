"""
Transaction and payment API endpoints.
"""

import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_permission
from ..models.user import User
from ..models.course import Course
from ..models.transaction import PaymentMethod
from ..permissions import Permission
from ..schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    TransactionListResponse, TransactionFilter, PaymentIntentCreate,
    PaymentIntentResponse, RefundCreate, WebhookEvent,
    InstructorPayoutCreate, InstructorPayoutUpdate, InstructorPayoutResponse,
    InstructorPayoutListResponse, InstructorEarnings
)
from ..services.transaction_service import TransactionService, InstructorPayoutService
from ..services.stripe_service import StripeService
from ..services.commission_service import CommissionService
from ..services.tax_reporting_service import TaxReportingService
from ..services.financial_analytics_service import FinancialAnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/transactions", tags=["transactions"])


# Transaction endpoints
@router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new transaction."""
    try:
        # Validate course exists if course_id provided
        if transaction_data.course_id:
            course = db.query(Course).filter(Course.id == transaction_data.course_id).first()
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Course not found"
                )
            
            # Set amount to course price if not provided
            if not transaction_data.amount:
                transaction_data.amount = course.price
        
        transaction = TransactionService.create_transaction(
            db, current_user.id, transaction_data
        )
        return transaction
        
    except Exception as e:
        logger.error(f"Error creating transaction: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transaction"
        )


@router.get("/", response_model=TransactionListResponse)
async def list_transactions(
    page: int = 1,
    per_page: int = 20,
    user_id: Optional[int] = None,
    course_id: Optional[int] = None,
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """List transactions with filtering and pagination."""
    try:
        # Build filters
        filters = TransactionFilter()
        if user_id:
            filters.user_id = user_id
        if course_id:
            filters.course_id = course_id
        if status:
            filters.status = status
        if payment_method:
            filters.payment_method = payment_method
        
        transactions, total = TransactionService.list_transactions(
            db, filters, page, per_page
        )
        
        total_pages = (total + per_page - 1) // per_page
        
        return TransactionListResponse(
            transactions=transactions,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Error listing transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list transactions"
        )


@router.get("/my", response_model=TransactionListResponse)
async def get_my_transactions(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's transactions."""
    try:
        transactions, total = TransactionService.get_user_transactions(
            db, current_user.id, page, per_page
        )
        
        total_pages = (total + per_page - 1) // per_page
        
        return TransactionListResponse(
            transactions=transactions,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Error getting user transactions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get transactions"
        )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific transaction."""
    transaction = TransactionService.get_transaction(db, transaction_id)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check permissions - users can see their own transactions, admins can see all
    if (transaction.user_id != current_user.id and 
        not current_user.has_permission(Permission.VIEW_ANALYTICS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this transaction"
        )
    
    return transaction


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    current_user: User = Depends(require_permission(Permission.PROCESS_PAYMENTS)),
    db: Session = Depends(get_db)
):
    """Update a transaction (admin only)."""
    transaction = TransactionService.update_transaction(db, transaction_id, update_data)
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction


@router.post("/{transaction_id}/refund", response_model=TransactionResponse)
async def refund_transaction(
    transaction_id: str,
    refund_data: RefundCreate,
    current_user: User = Depends(require_permission(Permission.PROCESS_PAYMENTS)),
    db: Session = Depends(get_db)
):
    """Process a refund for a transaction."""
    try:
        transaction = TransactionService.refund_transaction(db, transaction_id, refund_data)
        if not transaction:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Transaction not found"
            )
        
        # Process refund through payment gateway if needed
        if transaction.gateway_transaction_id and transaction.payment_method == PaymentMethod.STRIPE:
            try:
                StripeService.create_refund(
                    transaction.gateway_transaction_id,
                    refund_data.refund_amount,
                    refund_data.refund_reason
                )
            except Exception as e:
                logger.error(f"Failed to process gateway refund: {e}")
                # Continue with database refund even if gateway fails
        
        return transaction
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error processing refund: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process refund"
        )


# Payment processing endpoints
@router.post("/payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    payment_data: PaymentIntentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a payment intent for course purchase."""
    try:
        # Get course details
        course = db.query(Course).filter(Course.id == payment_data.course_id).first()
        if not course:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found"
            )
        
        if not course.is_published:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Course is not available for purchase"
            )
        
        # Create transaction record
        transaction_data = TransactionCreate(
            course_id=course.id,
            amount=course.price,
            payment_method=payment_data.payment_method,
            description=f"Purchase of course: {course.title}"
        )
        
        transaction = TransactionService.create_transaction(
            db, current_user.id, transaction_data
        )
        
        # Create payment intent based on payment method
        if payment_data.payment_method == PaymentMethod.STRIPE:
            return StripeService.create_payment_intent(transaction, payment_data)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment method not supported"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment intent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment intent"
        )


# Webhook endpoints
@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature")
):
    """Handle Stripe webhook events."""
    try:
        # Get request body
        payload = await request.body()
        
        # Verify webhook signature
        if not StripeService.verify_webhook_signature(payload, stripe_signature):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )
        
        # Parse event data
        event_data = json.loads(payload)
        
        # Handle the event
        processed_event = StripeService.handle_webhook_event(event_data)
        
        if processed_event:
            # Update transaction based on event
            db = next(get_db())
            try:
                if processed_event["event_type"] == "payment_succeeded":
                    transaction_id = processed_event.get("transaction_id")
                    if transaction_id:
                        TransactionService.complete_transaction(
                            db, transaction_id, json.dumps(processed_event)
                        )
                elif processed_event["event_type"] == "payment_failed":
                    transaction_id = processed_event.get("transaction_id")
                    if transaction_id:
                        update_data = TransactionUpdate(
                            status="failed",
                            gateway_response=json.dumps(processed_event)
                        )
                        TransactionService.update_transaction(db, transaction_id, update_data)
            finally:
                db.close()
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook"
        )


# Instructor payout endpoints
@router.post("/payouts", response_model=InstructorPayoutResponse)
async def create_instructor_payout(
    payout_data: InstructorPayoutCreate,
    current_user: User = Depends(require_permission(Permission.PROCESS_PAYMENTS)),
    db: Session = Depends(get_db)
):
    """Create an instructor payout."""
    try:
        payout = InstructorPayoutService.create_payout(db, payout_data)
        return payout
        
    except Exception as e:
        logger.error(f"Error creating payout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payout"
        )


@router.get("/payouts", response_model=InstructorPayoutListResponse)
async def list_instructor_payouts(
    page: int = 1,
    per_page: int = 20,
    instructor_id: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List instructor payouts."""
    # If not admin, can only see own payouts
    if not current_user.has_permission(Permission.VIEW_ANALYTICS):
        instructor_id = current_user.id
    
    try:
        payouts, total = InstructorPayoutService.list_payouts(
            db, instructor_id, page, per_page
        )
        
        total_pages = (total + per_page - 1) // per_page
        
        return InstructorPayoutListResponse(
            payouts=payouts,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Error listing payouts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list payouts"
        )


@router.put("/payouts/{payout_id}", response_model=InstructorPayoutResponse)
async def update_instructor_payout(
    payout_id: str,
    update_data: InstructorPayoutUpdate,
    current_user: User = Depends(require_permission(Permission.PROCESS_PAYMENTS)),
    db: Session = Depends(get_db)
):
    """Update an instructor payout."""
    payout = InstructorPayoutService.update_payout(db, payout_id, update_data)
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )
    
    return payout


@router.get("/earnings/{instructor_id}", response_model=InstructorEarnings)
async def get_instructor_earnings(
    instructor_id: int,
    period_start: str,
    period_end: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get instructor earnings for a period."""
    # Check permissions - instructors can see their own earnings, admins can see all
    if (instructor_id != current_user.id and 
        not current_user.has_permission(Permission.VIEW_ANALYTICS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these earnings"
        )
    
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        earnings = InstructorPayoutService.get_instructor_earnings(
            db, instructor_id, start_date, end_date
        )
        
        return earnings
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting instructor earnings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get instructor earnings"
        )


# Commission management endpoints
@router.get("/commission/earnings/{instructor_id}")
async def get_detailed_instructor_earnings(
    instructor_id: int,
    period_start: str,
    period_end: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed instructor earnings breakdown."""
    # Check permissions
    if (instructor_id != current_user.id and 
        not current_user.has_permission(Permission.VIEW_ANALYTICS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these earnings"
        )
    
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        earnings = CommissionService.calculate_instructor_earnings(
            db, instructor_id, start_date, end_date
        )
        
        return earnings
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting detailed earnings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get detailed earnings"
        )


@router.get("/commission/performance/{instructor_id}")
async def get_instructor_performance(
    instructor_id: int,
    period_start: str,
    period_end: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get instructor performance metrics."""
    # Check permissions
    if (instructor_id != current_user.id and 
        not current_user.has_permission(Permission.VIEW_ANALYTICS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this performance data"
        )
    
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        performance = CommissionService.get_instructor_performance_metrics(
            db, instructor_id, start_date, end_date
        )
        
        return performance
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting performance metrics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get performance metrics"
        )


@router.post("/commission/monthly-payouts")
async def create_monthly_payouts(
    month: int,
    year: int,
    minimum_payout: float = 50.0,
    current_user: User = Depends(require_permission(Permission.PROCESS_PAYMENTS)),
    db: Session = Depends(get_db)
):
    """Create monthly payouts for all eligible instructors."""
    try:
        from decimal import Decimal
        
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Month must be between 1 and 12"
            )
        
        payouts = CommissionService.create_monthly_payouts(
            db, month, year, Decimal(str(minimum_payout))
        )
        
        return {
            "message": f"Created {len(payouts)} payouts for {month}/{year}",
            "payouts_created": len(payouts),
            "total_amount": sum(p.amount for p in payouts)
        }
        
    except Exception as e:
        logger.error(f"Error creating monthly payouts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create monthly payouts"
        )


@router.get("/commission/platform-summary")
async def get_platform_commission_summary(
    period_start: str,
    period_end: str,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get platform-wide commission summary."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        summary = CommissionService.get_platform_commission_summary(
            db, start_date, end_date
        )
        
        return summary
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting platform summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get platform summary"
        )


# Tax reporting endpoints
@router.get("/tax/1099/{instructor_id}")
async def get_instructor_1099_data(
    instructor_id: int,
    tax_year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get 1099 tax data for an instructor."""
    # Check permissions
    if (instructor_id != current_user.id and 
        not current_user.has_permission(Permission.VIEW_ANALYTICS)):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this tax data"
        )
    
    try:
        tax_data = TaxReportingService.generate_instructor_1099_data(
            db, instructor_id, tax_year
        )
        return tax_data
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting 1099 data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get 1099 data"
        )


@router.get("/tax/platform-summary")
async def get_platform_tax_summary(
    tax_year: int,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get platform tax summary for the year."""
    try:
        summary = TaxReportingService.generate_platform_tax_summary(db, tax_year)
        return summary
        
    except Exception as e:
        logger.error(f"Error getting platform tax summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get platform tax summary"
        )


@router.get("/tax/1099-required")
async def get_instructors_requiring_1099(
    tax_year: int,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get list of instructors requiring 1099 forms."""
    try:
        instructors = TaxReportingService.get_instructors_requiring_1099(db, tax_year)
        return {
            "tax_year": tax_year,
            "instructors_requiring_1099": instructors,
            "total_count": len(instructors)
        }
        
    except Exception as e:
        logger.error(f"Error getting 1099 required list: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get 1099 required list"
        )


@router.get("/tax/export/payouts")
async def export_instructor_payouts_csv(
    tax_year: int,
    instructor_id: Optional[int] = None,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Export instructor payouts to CSV."""
    try:
        from fastapi.responses import Response
        
        csv_content = TaxReportingService.export_instructor_payouts_csv(
            db, tax_year, instructor_id
        )
        
        filename = f"instructor_payouts_{tax_year}"
        if instructor_id:
            filename += f"_instructor_{instructor_id}"
        filename += ".csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting payouts CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export payouts CSV"
        )


@router.get("/tax/export/revenue")
async def export_platform_revenue_csv(
    tax_year: int,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Export platform revenue data to CSV."""
    try:
        from fastapi.responses import Response
        
        csv_content = TaxReportingService.export_platform_revenue_csv(db, tax_year)
        
        filename = f"platform_revenue_{tax_year}.csv"
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
        
    except Exception as e:
        logger.error(f"Error exporting revenue CSV: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export revenue CSV"
        )


# Financial analytics endpoints
@router.get("/analytics/revenue-overview")
async def get_revenue_overview(
    period_start: str,
    period_end: str,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get comprehensive revenue overview."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        overview = FinancialAnalyticsService.get_revenue_overview(
            db, start_date, end_date
        )
        
        return overview
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting revenue overview: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get revenue overview"
        )


@router.get("/analytics/revenue-trends")
async def get_revenue_trends(
    period_start: str,
    period_end: str,
    interval: str = "daily",
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get revenue trends over time."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        if interval not in ["daily", "weekly", "monthly"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid interval. Use 'daily', 'weekly', or 'monthly'"
            )
        
        trends = FinancialAnalyticsService.get_revenue_trends(
            db, start_date, end_date, interval
        )
        
        return {
            "period_start": start_date,
            "period_end": end_date,
            "interval": interval,
            "trends": trends
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting revenue trends: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get revenue trends"
        )


@router.get("/analytics/course-revenue")
async def get_course_revenue_analysis(
    period_start: str,
    period_end: str,
    limit: int = 20,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get revenue analysis by course."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        analysis = FinancialAnalyticsService.get_course_revenue_analysis(
            db, start_date, end_date, limit
        )
        
        return {
            "period_start": start_date,
            "period_end": end_date,
            "courses": analysis
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting course revenue analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get course revenue analysis"
        )


@router.get("/analytics/instructor-revenue")
async def get_instructor_revenue_analysis(
    period_start: str,
    period_end: str,
    limit: int = 20,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get revenue analysis by instructor."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        analysis = FinancialAnalyticsService.get_instructor_revenue_analysis(
            db, start_date, end_date, limit
        )
        
        return {
            "period_start": start_date,
            "period_end": end_date,
            "instructors": analysis
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting instructor revenue analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get instructor revenue analysis"
        )


@router.get("/analytics/payment-methods")
async def get_payment_method_analysis(
    period_start: str,
    period_end: str,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get payment method analysis."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        analysis = FinancialAnalyticsService.get_payment_method_analysis(
            db, start_date, end_date
        )
        
        return {
            "period_start": start_date,
            "period_end": end_date,
            "payment_methods": analysis
        }
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting payment method analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment method analysis"
        )


@router.get("/analytics/refunds")
async def get_refund_analysis(
    period_start: str,
    period_end: str,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get detailed refund analysis."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        analysis = FinancialAnalyticsService.get_refund_analysis(
            db, start_date, end_date
        )
        
        return analysis
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting refund analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get refund analysis"
        )


@router.get("/analytics/dashboard")
async def get_financial_dashboard(
    period_start: str,
    period_end: str,
    current_user: User = Depends(require_permission(Permission.VIEW_ANALYTICS)),
    db: Session = Depends(get_db)
):
    """Get comprehensive financial dashboard data."""
    try:
        from datetime import datetime
        start_date = datetime.fromisoformat(period_start.replace('Z', '+00:00'))
        end_date = datetime.fromisoformat(period_end.replace('Z', '+00:00'))
        
        dashboard_data = FinancialAnalyticsService.get_financial_dashboard_data(
            db, start_date, end_date
        )
        
        return dashboard_data
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format"
        )
    except Exception as e:
        logger.error(f"Error getting financial dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get financial dashboard"
        )