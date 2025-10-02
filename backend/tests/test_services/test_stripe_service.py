"""
Unit tests for StripeService.
"""
import pytest
from unittest.mock import patch, MagicMock
from decimal import Decimal

from app.services.stripe_service import StripeService
from app.schemas.transaction import PaymentIntentCreate
from app.models.transaction import Transaction, TransactionStatus
from app.models.user import User
from app.models.course import Course
from faker import Faker

fake = Faker()


class TestStripeService:
    """Test cases for StripeService."""
    
    @patch('app.services.stripe_service.stripe.PaymentIntent.create')
    def test_create_payment_intent_success(self, mock_stripe_create, test_user: User, test_course: Course):
        """Test successful payment intent creation."""
        # Mock Stripe response
        mock_stripe_create.return_value = {
            'id': 'pi_test_123456',
            'client_secret': 'pi_test_123456_secret_test',
            'status': 'requires_payment_method',
            'amount': 9999,
            'currency': 'usd'
        }
        
        # Create transaction
        transaction = Transaction(
            transaction_id="txn_test_123",
            user_id=test_user.id,
            course_id=test_course.id,
            amount=Decimal("99.99"),
            currency="USD",
            status=TransactionStatus.PENDING
        )
        
        payment_data = PaymentIntentCreate(
            return_url="https://example.com/return"
        )
        
        response = StripeService.create_payment_intent(transaction, payment_data)
        
        assert response.payment_intent_id == 'pi_test_123456'
        assert response.client_secret == 'pi_test_123456_secret_test'
        assert response.status == 'requires_payment_method'
        
        # Verify Stripe was called with correct parameters
        mock_stripe_create.assert_called_once()
        call_args = mock_stripe_create.call_args[1]
        assert call_args['amount'] == 9999  # $99.99 in cents
        assert call_args['currency'] == 'usd'
        assert call_args['metadata']['transaction_id'] == "txn_test_123"
    
    @patch('app.services.stripe_service.stripe.PaymentIntent.create')
    def test_create_payment_intent_stripe_error(self, mock_stripe_create, test_user: User, test_course: Course):
        """Test payment intent creation with Stripe error."""
        # Mock Stripe error
        mock_stripe_create.side_effect = Exception("Stripe API error")
        
        transaction = Transaction(
            transaction_id="txn_test_123",
            user_id=test_user.id,
            course_id=test_course.id,
            amount=Decimal("99.99"),
            currency="USD",
            status=TransactionStatus.PENDING
        )
        
        payment_data = PaymentIntentCreate(
            return_url="https://example.com/return"
        )
        
        with pytest.raises(Exception) as exc_info:
            StripeService.create_payment_intent(transaction, payment_data)
        
        assert "Stripe API error" in str(exc_info.value)
    
    @patch('app.services.stripe_service.stripe.PaymentIntent.retrieve')
    def test_retrieve_payment_intent_success(self, mock_stripe_retrieve):
        """Test successful payment intent retrieval."""
        # Mock Stripe response
        mock_stripe_retrieve.return_value = {
            'id': 'pi_test_123456',
            'status': 'succeeded',
            'amount': 9999,
            'currency': 'usd',
            'metadata': {
                'transaction_id': 'txn_test_123',
                'user_id': '1',
                'course_id': '1'
            }
        }
        
        payment_intent_id = 'pi_test_123456'
        result = StripeService.retrieve_payment_intent(payment_intent_id)
        
        assert result['id'] == 'pi_test_123456'
        assert result['status'] == 'succeeded'
        assert result['amount'] == 9999
        
        mock_stripe_retrieve.assert_called_once_with(payment_intent_id)
    
    @patch('app.services.stripe_service.stripe.PaymentIntent.retrieve')
    def test_retrieve_payment_intent_not_found(self, mock_stripe_retrieve):
        """Test payment intent retrieval when not found."""
        # Mock Stripe error for not found
        mock_stripe_retrieve.side_effect = Exception("No such payment_intent")
        
        payment_intent_id = 'pi_nonexistent'
        
        with pytest.raises(Exception) as exc_info:
            StripeService.retrieve_payment_intent(payment_intent_id)
        
        assert "No such payment_intent" in str(exc_info.value)
    
    @patch('app.services.stripe_service.stripe.PaymentIntent.confirm')
    def test_confirm_payment_intent_success(self, mock_stripe_confirm):
        """Test successful payment intent confirmation."""
        # Mock Stripe response
        mock_stripe_confirm.return_value = {
            'id': 'pi_test_123456',
            'status': 'succeeded',
            'amount': 9999,
            'currency': 'usd'
        }
        
        payment_intent_id = 'pi_test_123456'
        payment_method_id = 'pm_test_123456'
        
        result = StripeService.confirm_payment_intent(payment_intent_id, payment_method_id)
        
        assert result['id'] == 'pi_test_123456'
        assert result['status'] == 'succeeded'
        
        mock_stripe_confirm.assert_called_once_with(
            payment_intent_id,
            payment_method=payment_method_id
        )
    
    @patch('app.services.stripe_service.stripe.Refund.create')
    def test_create_refund_success(self, mock_stripe_refund):
        """Test successful refund creation."""
        # Mock Stripe response
        mock_stripe_refund.return_value = {
            'id': 're_test_123456',
            'status': 'succeeded',
            'amount': 9999,
            'currency': 'usd',
            'payment_intent': 'pi_test_123456'
        }
        
        payment_intent_id = 'pi_test_123456'
        amount = Decimal("99.99")
        reason = "requested_by_customer"
        
        result = StripeService.create_refund(payment_intent_id, amount, reason)
        
        assert result['id'] == 're_test_123456'
        assert result['status'] == 'succeeded'
        assert result['amount'] == 9999
        
        mock_stripe_refund.assert_called_once_with(
            payment_intent=payment_intent_id,
            amount=9999,  # Amount in cents
            reason=reason
        )
    
    @patch('app.services.stripe_service.stripe.Refund.create')
    def test_create_partial_refund_success(self, mock_stripe_refund):
        """Test successful partial refund creation."""
        # Mock Stripe response
        mock_stripe_refund.return_value = {
            'id': 're_test_123456',
            'status': 'succeeded',
            'amount': 5000,  # $50.00 partial refund
            'currency': 'usd',
            'payment_intent': 'pi_test_123456'
        }
        
        payment_intent_id = 'pi_test_123456'
        amount = Decimal("50.00")  # Partial refund
        reason = "requested_by_customer"
        
        result = StripeService.create_refund(payment_intent_id, amount, reason)
        
        assert result['id'] == 're_test_123456'
        assert result['status'] == 'succeeded'
        assert result['amount'] == 5000
        
        mock_stripe_refund.assert_called_once_with(
            payment_intent=payment_intent_id,
            amount=5000,  # Partial amount in cents
            reason=reason
        )
    
    def test_calculate_application_fee(self):
        """Test application fee calculation."""
        # Test with different amounts
        test_cases = [
            (Decimal("100.00"), Decimal("10.00")),  # 10% fee
            (Decimal("50.00"), Decimal("5.00")),    # 10% fee
            (Decimal("0.00"), Decimal("0.00")),     # No fee for free
        ]
        
        for amount, expected_fee in test_cases:
            fee = StripeService.calculate_application_fee(amount)
            assert fee == expected_fee
    
    def test_validate_webhook_signature_success(self):
        """Test successful webhook signature validation."""
        payload = b'{"test": "data"}'
        signature = "test_signature"
        endpoint_secret = "whsec_test_secret"
        
        with patch('app.services.stripe_service.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.return_value = {"test": "data"}
            
            result = StripeService.validate_webhook_signature(payload, signature, endpoint_secret)
            
            assert result == {"test": "data"}
            mock_construct.assert_called_once_with(payload, signature, endpoint_secret)
    
    def test_validate_webhook_signature_invalid(self):
        """Test webhook signature validation with invalid signature."""
        payload = b'{"test": "data"}'
        signature = "invalid_signature"
        endpoint_secret = "whsec_test_secret"
        
        with patch('app.services.stripe_service.stripe.Webhook.construct_event') as mock_construct:
            mock_construct.side_effect = Exception("Invalid signature")
            
            with pytest.raises(Exception) as exc_info:
                StripeService.validate_webhook_signature(payload, signature, endpoint_secret)
            
            assert "Invalid signature" in str(exc_info.value)
    
    def test_format_amount_for_stripe(self):
        """Test amount formatting for Stripe (converting to cents)."""
        test_cases = [
            (Decimal("99.99"), 9999),
            (Decimal("100.00"), 10000),
            (Decimal("0.50"), 50),
            (Decimal("0.00"), 0),
        ]
        
        for amount, expected_cents in test_cases:
            cents = StripeService.format_amount_for_stripe(amount)
            assert cents == expected_cents
    
    def test_format_amount_from_stripe(self):
        """Test amount formatting from Stripe (converting from cents)."""
        test_cases = [
            (9999, Decimal("99.99")),
            (10000, Decimal("100.00")),
            (50, Decimal("0.50")),
            (0, Decimal("0.00")),
        ]
        
        for cents, expected_amount in test_cases:
            amount = StripeService.format_amount_from_stripe(cents)
            assert amount == expected_amount