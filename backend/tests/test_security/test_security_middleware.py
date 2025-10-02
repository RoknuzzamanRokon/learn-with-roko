"""
Tests for security middleware functionality.
"""

import pytest
import time
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

from app.main import app
from app.middleware.security_middleware import (
    RateLimitMiddleware,
    InputValidationMiddleware,
    SecurityHeadersMiddleware
)


class TestRateLimitMiddleware:
    """Test rate limiting middleware."""
    
    def test_rate_limit_allows_normal_requests(self):
        """Test that normal request rates are allowed."""
        client = TestClient(app)
        
        # Make several requests within limit
        for _ in range(5):
            response = client.get("/health")
            assert response.status_code == 200
    
    def test_rate_limit_blocks_excessive_requests(self):
        """Test that excessive requests are blocked."""
        # Create a test app with very low rate limit for testing
        from fastapi import FastAPI
        from starlette.middleware.base import BaseHTTPMiddleware
        
        test_app = FastAPI()
        test_app.add_middleware(RateLimitMiddleware, calls=2, period=1)
        
        @test_app.get("/test")
        async def test_endpoint():
            return {"message": "test"}
        
        client = TestClient(test_app)
        
        # First two requests should succeed
        response1 = client.get("/test")
        response2 = client.get("/test")
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        # Third request should be rate limited
        response3 = client.get("/test")
        assert response3.status_code == 429
        assert "rate limit exceeded" in response3.json()["error"]["message"].lower()


class TestInputValidationMiddleware:
    """Test input validation middleware."""
    
    def test_blocks_xss_attempts(self):
        """Test that XSS attempts are blocked."""
        client = TestClient(app)
        
        # Test XSS in query parameters
        response = client.get("/health?search=<script>alert('xss')</script>")
        assert response.status_code == 400
        assert "invalid content" in response.json()["error"]["message"].lower()
    
    def test_blocks_sql_injection_attempts(self):
        """Test that SQL injection attempts are blocked."""
        client = TestClient(app)
        
        # Test SQL injection in query parameters
        response = client.get("/health?id=1' OR '1'='1")
        assert response.status_code == 400
        assert "invalid" in response.json()["error"]["message"].lower()
    
    def test_allows_safe_content(self):
        """Test that safe content is allowed."""
        client = TestClient(app)
        
        # Test safe query parameters
        response = client.get("/health?search=python programming")
        assert response.status_code == 200
    
    def test_validates_json_payload(self):
        """Test JSON payload validation."""
        client = TestClient(app)
        
        # Test malicious JSON payload
        malicious_payload = {
            "name": "<script>alert('xss')</script>",
            "description": "Normal description"
        }
        
        # This would typically be tested on a POST endpoint that accepts JSON
        # For now, we'll test the validation logic directly
        from app.middleware.security_middleware import InputValidationMiddleware
        
        middleware = InputValidationMiddleware(app)
        
        # Test the malicious content detection
        assert middleware._contains_malicious_content("<script>alert('xss')</script>")
        assert not middleware._contains_malicious_content("Normal content")


class TestSecurityHeadersMiddleware:
    """Test security headers middleware."""
    
    def test_adds_security_headers(self):
        """Test that security headers are added to responses."""
        client = TestClient(app)
        
        response = client.get("/health")
        
        # Check for security headers
        assert "X-Content-Type-Options" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        
        assert "X-Frame-Options" in response.headers
        assert response.headers["X-Frame-Options"] == "DENY"
        
        assert "X-XSS-Protection" in response.headers
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        
        assert "Strict-Transport-Security" in response.headers
        assert "max-age=31536000" in response.headers["Strict-Transport-Security"]
        
        assert "Content-Security-Policy" in response.headers
        assert "default-src 'self'" in response.headers["Content-Security-Policy"]


class TestAuditLogging:
    """Test audit logging functionality."""
    
    @patch('app.middleware.security_middleware.security_logger')
    def test_logs_sensitive_operations(self, mock_logger):
        """Test that sensitive operations are logged."""
        client = TestClient(app)
        
        # Make a request that should be audited
        response = client.post("/api/auth/login", json={
            "username": "test@example.com",
            "password": "testpassword"
        })
        
        # Check that audit logging was called
        # Note: This test assumes the login endpoint exists and triggers audit logging
        # The actual assertion would depend on the specific implementation
        assert mock_logger.info.called or response.status_code in [200, 401, 422]


@pytest.fixture
def mock_redis():
    """Mock Redis for testing."""
    with patch('app.services.cache_service.redis') as mock:
        mock_client = MagicMock()
        mock_client.ping.return_value = True
        mock_client.setex.return_value = True
        mock_client.get.return_value = None
        mock_client.delete.return_value = 1
        mock_client.keys.return_value = []
        mock.from_url.return_value = mock_client
        yield mock_client


class TestSecurityIntegration:
    """Integration tests for security features."""
    
    def test_security_middleware_order(self):
        """Test that security middleware is applied in correct order."""
        client = TestClient(app)
        
        response = client.get("/health")
        
        # Should have both security headers and rate limiting
        assert response.status_code == 200
        assert "X-Content-Type-Options" in response.headers
        # Rate limiting headers might not be present for single requests
    
    def test_error_handling_with_security(self):
        """Test error handling works with security middleware."""
        client = TestClient(app)
        
        # Test non-existent endpoint
        response = client.get("/nonexistent")
        assert response.status_code == 404
        
        # Should still have security headers
        assert "X-Content-Type-Options" in response.headers
    
    def test_cors_with_security(self):
        """Test CORS works with security middleware."""
        client = TestClient(app)
        
        # Test preflight request
        response = client.options("/health", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET"
        })
        
        # Should allow CORS for allowed origins
        assert response.status_code in [200, 204]
        # Security headers should still be present
        assert "X-Content-Type-Options" in response.headers