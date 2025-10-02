"""
Stripe payment service for handling payment processing.
"""

import os
import stripe
import logging
from typing import Optional, Dict, Any
from decimal import Decimal

from ..models.transaction import Transaction
from ..schemas.transaction import PaymentIntentCreate, PaymentIntentResponse

logger = logging.getLogger(__name__)

# Configure Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


class StripeService:
    """Service for handling Stripe payment operations."""

    @staticmethod
    def create_payment_intent(
        transaction: Transaction,
        payment_data: PaymentIntentCreate
    ) -> PaymentIntentResponse:
        """
        Create a Stripe payment intent.
        
        Args:
            transaction: Transaction object
            payment_data: Payment intent creation data
            
        Returns:
            PaymentIntentResponse: Payment intent response with client secret
        """
        try:
            # Convert amount to cents for Stripe
            amount_cents = int(transaction.amount * 100)
            
            # Create payment intent
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=transaction.currency.lower(),
                metadata={
                    "transaction_id": transaction.transaction_id,
                    "course_id": str(transaction.course_id) if transaction.course_id else "",
                    "user_id": str(transaction.user_id)
                },
                automatic_payment_methods={
                    "enabled": True
                }
            )
            
            logger.info(f"Created Stripe payment intent {intent.id} for transaction {transaction.transaction_id}")
            
            return PaymentIntentResponse(
                client_secret=intent.client_secret,
                transaction_id=transaction.transaction_id,
                amount=transaction.amount,
                currency=transaction.currency
            )
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            raise ValueError(f"Payment processing error: {str(e)}")

    @staticmethod
    def confirm_payment_intent(payment_intent_id: str) -> Dict[str, Any]:
        """
        Confirm a Stripe payment intent.
        
        Args:
            payment_intent_id: Stripe payment intent ID
            
        Returns:
            Dict: Payment intent data
        """
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if intent.status == "succeeded":
                logger.info(f"Payment intent {payment_intent_id} succeeded")
                return {
                    "status": "succeeded",
                    "amount": Decimal(intent.amount) / 100,
                    "currency": intent.currency.upper(),
                    "metadata": intent.metadata
                }
            else:
                logger.warning(f"Payment intent {payment_intent_id} status: {intent.status}")
                return {
                    "status": intent.status,
                    "metadata": intent.metadata
                }
                
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment intent: {e}")
            raise ValueError(f"Payment confirmation error: {str(e)}")

    @staticmethod
    def create_refund(
        payment_intent_id: str,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a refund for a payment.
        
        Args:
            payment_intent_id: Stripe payment intent ID
            amount: Refund amount (None for full refund)
            reason: Refund reason
            
        Returns:
            Dict: Refund data
        """
        try:
            refund_data = {
                "payment_intent": payment_intent_id
            }
            
            if amount:
                refund_data["amount"] = int(amount * 100)  # Convert to cents
            
            if reason:
                refund_data["reason"] = reason
            
            refund = stripe.Refund.create(**refund_data)
            
            logger.info(f"Created refund {refund.id} for payment intent {payment_intent_id}")
            
            return {
                "refund_id": refund.id,
                "amount": Decimal(refund.amount) / 100,
                "currency": refund.currency.upper(),
                "status": refund.status
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {e}")
            raise ValueError(f"Refund processing error: {str(e)}")

    @staticmethod
    def handle_webhook_event(event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Handle Stripe webhook events.
        
        Args:
            event_data: Webhook event data
            
        Returns:
            Dict: Processed event data or None if not handled
        """
        event_type = event_data.get("type")
        
        if event_type == "payment_intent.succeeded":
            return StripeService._handle_payment_succeeded(event_data)
        elif event_type == "payment_intent.payment_failed":
            return StripeService._handle_payment_failed(event_data)
        elif event_type == "charge.dispute.created":
            return StripeService._handle_dispute_created(event_data)
        else:
            logger.info(f"Unhandled webhook event type: {event_type}")
            return None

    @staticmethod
    def _handle_payment_succeeded(event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle successful payment webhook."""
        payment_intent = event_data["data"]["object"]
        
        return {
            "event_type": "payment_succeeded",
            "payment_intent_id": payment_intent["id"],
            "transaction_id": payment_intent["metadata"].get("transaction_id"),
            "amount": Decimal(payment_intent["amount"]) / 100,
            "currency": payment_intent["currency"].upper()
        }

    @staticmethod
    def _handle_payment_failed(event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle failed payment webhook."""
        payment_intent = event_data["data"]["object"]
        
        return {
            "event_type": "payment_failed",
            "payment_intent_id": payment_intent["id"],
            "transaction_id": payment_intent["metadata"].get("transaction_id"),
            "failure_reason": payment_intent.get("last_payment_error", {}).get("message")
        }

    @staticmethod
    def _handle_dispute_created(event_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle dispute created webhook."""
        dispute = event_data["data"]["object"]
        
        return {
            "event_type": "dispute_created",
            "dispute_id": dispute["id"],
            "charge_id": dispute["charge"],
            "amount": Decimal(dispute["amount"]) / 100,
            "currency": dispute["currency"].upper(),
            "reason": dispute["reason"]
        }

    @staticmethod
    def verify_webhook_signature(payload: bytes, signature: str) -> bool:
        """
        Verify Stripe webhook signature.
        
        Args:
            payload: Request payload
            signature: Stripe signature header
            
        Returns:
            bool: True if signature is valid
        """
        webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
        if not webhook_secret:
            logger.error("Stripe webhook secret not configured")
            return False
        
        try:
            stripe.Webhook.construct_event(payload, signature, webhook_secret)
            return True
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Webhook signature verification failed: {e}")
            return False