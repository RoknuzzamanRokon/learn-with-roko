"""
Security middleware for input validation, rate limiting, and audit logging.
"""

import time
import json
import logging
from typing import Dict, Any, Optional
from collections import defaultdict, deque
from datetime import datetime, timedelta
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
import re
import html
from urllib.parse import unquote

from ..database import get_db
from ..models.user import User

# Configure security logger
security_logger = logging.getLogger("security")
security_logger.setLevel(logging.INFO)

# Create file handler for security logs
security_handler = logging.FileHandler("security.log")
security_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter(
    '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
security_handler.setFormatter(formatter)
security_logger.addHandler(security_handler)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent DDoS attacks and abuse.
    """
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls  # Number of calls allowed
        self.period = period  # Time period in seconds
        self.clients = defaultdict(lambda: deque())
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Clean old entries
        now = time.time()
        client_calls = self.clients[client_ip]
        
        # Remove calls older than the period
        while client_calls and client_calls[0] <= now - self.period:
            client_calls.popleft()
        
        # Check if rate limit exceeded
        if len(client_calls) >= self.calls:
            security_logger.warning(
                f"Rate limit exceeded for IP: {client_ip}, "
                f"calls: {len(client_calls)}, period: {self.period}s"
            )
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Rate limit exceeded. Maximum {self.calls} requests per {self.period} seconds.",
                        "retry_after": self.period
                    }
                }
            )
        
        # Add current call
        client_calls.append(now)
        
        response = await call_next(request)
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request headers."""
        # Check for forwarded headers (behind proxy/load balancer)
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection
        return request.client.host if request.client else "unknown"


class InputValidationMiddleware(BaseHTTPMiddleware):
    """
    Input validation and sanitization middleware.
    """
    
    # Dangerous patterns to detect
    XSS_PATTERNS = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>.*?</iframe>',
        r'<object[^>]*>.*?</object>',
        r'<embed[^>]*>.*?</embed>',
    ]
    
    SQL_INJECTION_PATTERNS = [
        r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
        r'(\b(OR|AND)\s+\d+\s*=\s*\d+)',
        r'(\b(OR|AND)\s+[\'"]?\w+[\'"]?\s*=\s*[\'"]?\w+[\'"]?)',
        r'(--|#|/\*|\*/)',
        r'(\bUNION\s+SELECT\b)',
    ]
    
    def __init__(self, app):
        super().__init__(app)
        self.xss_regex = re.compile('|'.join(self.XSS_PATTERNS), re.IGNORECASE)
        self.sql_regex = re.compile('|'.join(self.SQL_INJECTION_PATTERNS), re.IGNORECASE)
    
    async def dispatch(self, request: Request, call_next):
        # Skip validation for certain endpoints
        if self._should_skip_validation(request):
            return await call_next(request)
        
        # Validate request body if present
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    # Decode and validate body
                    body_str = body.decode('utf-8')
                    
                    # Check for malicious patterns
                    if self._contains_malicious_content(body_str):
                        client_ip = self._get_client_ip(request)
                        security_logger.warning(
                            f"Malicious content detected from IP: {client_ip}, "
                            f"path: {request.url.path}, body: {body_str[:200]}..."
                        )
                        return JSONResponse(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            content={
                                "error": {
                                    "code": "INVALID_INPUT",
                                    "message": "Request contains potentially malicious content"
                                }
                            }
                        )
                
                # Recreate request with validated body
                request._body = body
            except Exception as e:
                security_logger.error(f"Error validating request body: {e}")
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "error": {
                            "code": "INVALID_REQUEST",
                            "message": "Invalid request format"
                        }
                    }
                )
        
        # Validate query parameters
        for key, value in request.query_params.items():
            if self._contains_malicious_content(value):
                client_ip = self._get_client_ip(request)
                security_logger.warning(
                    f"Malicious query parameter from IP: {client_ip}, "
                    f"path: {request.url.path}, param: {key}={value}"
                )
                return JSONResponse(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    content={
                        "error": {
                            "code": "INVALID_PARAMETER",
                            "message": f"Query parameter '{key}' contains invalid content"
                        }
                    }
                )
        
        response = await call_next(request)
        return response
    
    def _should_skip_validation(self, request: Request) -> bool:
        """Check if validation should be skipped for this request."""
        # Skip for file uploads or specific endpoints
        skip_paths = ["/api/files/upload", "/docs", "/redoc", "/openapi.json"]
        return any(request.url.path.startswith(path) for path in skip_paths)
    
    def _contains_malicious_content(self, content: str) -> bool:
        """Check if content contains malicious patterns."""
        # URL decode content
        decoded_content = unquote(content)
        
        # Check for XSS patterns
        if self.xss_regex.search(decoded_content):
            return True
        
        # Check for SQL injection patterns
        if self.sql_regex.search(decoded_content):
            return True
        
        return False
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request headers."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    """
    Audit logging middleware for sensitive operations.
    """
    
    # Operations that require audit logging
    SENSITIVE_OPERATIONS = {
        "POST": ["/api/auth/login", "/api/auth/register", "/api/users", "/api/courses"],
        "PUT": ["/api/users/", "/api/courses/", "/api/system-settings/"],
        "DELETE": ["/api/users/", "/api/courses/"],
        "PATCH": ["/api/users/", "/api/courses/"]
    }
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        # Check if this is a sensitive operation
        should_audit = self._should_audit(request)
        
        if should_audit:
            # Capture request details
            client_ip = self._get_client_ip(request)
            user_agent = request.headers.get("User-Agent", "Unknown")
            
            # Get user info if available
            user_info = await self._get_user_info(request)
            
            # Log the request
            audit_data = {
                "timestamp": datetime.utcnow().isoformat(),
                "method": request.method,
                "path": str(request.url.path),
                "client_ip": client_ip,
                "user_agent": user_agent,
                "user_id": user_info.get("user_id") if user_info else None,
                "user_role": user_info.get("role") if user_info else None,
                "query_params": dict(request.query_params)
            }
            
            # Process request
            start_time = time.time()
            response = await call_next(request)
            end_time = time.time()
            
            # Log the response
            audit_data.update({
                "status_code": response.status_code,
                "response_time_ms": round((end_time - start_time) * 1000, 2),
                "success": 200 <= response.status_code < 400
            })
            
            # Log to security logger
            security_logger.info(f"AUDIT: {json.dumps(audit_data)}")
            
            return response
        else:
            return await call_next(request)
    
    def _should_audit(self, request: Request) -> bool:
        """Check if this request should be audited."""
        method = request.method
        path = request.url.path
        
        if method not in self.SENSITIVE_OPERATIONS:
            return False
        
        # Check if path matches any sensitive operation pattern
        for pattern in self.SENSITIVE_OPERATIONS[method]:
            if path.startswith(pattern):
                return True
        
        return False
    
    async def _get_user_info(self, request: Request) -> Optional[Dict[str, Any]]:
        """Extract user information from request if available."""
        try:
            # Try to get authorization header
            auth_header = request.headers.get("Authorization")
            if not auth_header or not auth_header.startswith("Bearer "):
                return None
            
            # This is a simplified extraction - in practice, you'd decode the JWT
            # For now, we'll return None and let the actual auth middleware handle it
            return None
        except Exception:
            return None
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request headers."""
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    """
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Add security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self' https:; "
            "media-src 'self' https:; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        
        return response