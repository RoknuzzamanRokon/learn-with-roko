"""
Middleware for performance monitoring and error tracking.
"""

import time
import logging
from typing import Optional
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from ..database import get_db
from ..services.monitoring_service import get_monitoring_service
from ..auth import extract_user_id_from_token

logger = logging.getLogger(__name__)


class PerformanceMonitoringMiddleware(BaseHTTPMiddleware):
    """
    Middleware to monitor request performance and track metrics.
    """
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        # Record start time
        start_time = time.time()
        
        # Extract user ID if available
        user_id = self._extract_user_id(request)
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate response time
            response_time = time.time() - start_time
            
            # Track performance metrics
            self._track_performance(
                request.method,
                str(request.url.path),
                response_time,
                response.status_code,
                user_id
            )
            
            # Add performance headers
            response.headers["X-Response-Time"] = f"{response_time:.3f}s"
            
            return response
            
        except Exception as e:
            # Calculate response time for errors
            response_time = time.time() - start_time
            
            # Track error
            self._track_error(e, user_id, str(request.url.path))
            
            # Track performance (with error status)
            self._track_performance(
                request.method,
                str(request.url.path),
                response_time,
                500,  # Internal server error
                user_id
            )
            
            # Re-raise the exception
            raise e
    
    def _extract_user_id(self, request: Request) -> Optional[int]:
        """Extract user ID from request if available."""
        try:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                return extract_user_id_from_token(token)
        except Exception:
            pass
        return None
    
    def _track_performance(
        self,
        method: str,
        path: str,
        response_time: float,
        status_code: int,
        user_id: Optional[int]
    ):
        """Track performance metrics."""
        try:
            # Get database session
            db = next(get_db())
            monitoring_service = get_monitoring_service(db)
            
            # Track the request
            monitoring_service.track_request_performance(
                method, path, response_time, status_code, user_id
            )
            
        except Exception as e:
            logger.error(f"Failed to track performance metrics: {e}")
    
    def _track_error(self, error: Exception, user_id: Optional[int], request_path: str):
        """Track error occurrence."""
        try:
            # Get database session
            db = next(get_db())
            monitoring_service = get_monitoring_service(db)
            
            # Track the error
            monitoring_service.track_error(
                error,
                user_id=user_id,
                request_path=request_path
            )
            
        except Exception as e:
            logger.error(f"Failed to track error: {e}")


class HealthCheckMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle health check requests.
    """
    
    def __init__(self, app):
        super().__init__(app)
    
    async def dispatch(self, request: Request, call_next):
        # Handle health check requests
        if request.url.path == "/health":
            try:
                # Get database session
                db = next(get_db())
                monitoring_service = get_monitoring_service(db)
                
                # Get health status
                health_status = monitoring_service.get_health_status()
                
                # Determine HTTP status code based on health
                if health_status['status'] == 'healthy':
                    status_code = 200
                elif health_status['status'] == 'warning':
                    status_code = 200  # Still operational
                else:
                    status_code = 503  # Service unavailable
                
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    content=health_status,
                    status_code=status_code
                )
                
            except Exception as e:
                logger.error(f"Health check failed: {e}")
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    content={
                        'status': 'error',
                        'message': 'Health check failed',
                        'error': str(e)
                    },
                    status_code=503
                )
        
        # Continue with normal request processing
        return await call_next(request)


class MetricsCollectionMiddleware(BaseHTTPMiddleware):
    """
    Middleware to collect various application metrics.
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.request_count = 0
        self.last_metrics_collection = time.time()
    
    async def dispatch(self, request: Request, call_next):
        # Increment request counter
        self.request_count += 1
        
        # Collect system metrics periodically (every 60 seconds)
        current_time = time.time()
        if current_time - self.last_metrics_collection > 60:
            self._collect_system_metrics()
            self.last_metrics_collection = current_time
        
        # Process request normally
        response = await call_next(request)
        
        return response
    
    def _collect_system_metrics(self):
        """Collect and store system metrics."""
        try:
            # Get database session
            db = next(get_db())
            monitoring_service = get_monitoring_service(db)
            
            # Get system metrics
            system_metrics = monitoring_service.system_monitor.get_system_metrics()
            process_metrics = monitoring_service.system_monitor.get_process_metrics()
            
            # Store metrics in cache for dashboard access
            from ..services.cache_service import cache_service
            
            cache_service.set("system_metrics", system_metrics, 300)  # 5 minutes TTL
            cache_service.set("process_metrics", process_metrics, 300)
            
            # Store request count
            cache_service.set("request_count", self.request_count, 300)
            
            logger.debug("System metrics collected and cached")
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")


class AlertingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle alerting based on request patterns.
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.error_counts = {}
        self.last_alert_check = time.time()
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Track errors for alerting
        if response.status_code >= 400:
            self._track_error_for_alerting(request.url.path, response.status_code)
        
        # Check for alerts periodically
        current_time = time.time()
        if current_time - self.last_alert_check > 300:  # Every 5 minutes
            self._check_alerts()
            self.last_alert_check = current_time
        
        return response
    
    def _track_error_for_alerting(self, path: str, status_code: int):
        """Track errors for alerting purposes."""
        current_time = time.time()
        
        # Initialize error tracking for this path
        if path not in self.error_counts:
            self.error_counts[path] = []
        
        # Add error with timestamp
        self.error_counts[path].append((current_time, status_code))
        
        # Clean old errors (older than 1 hour)
        cutoff_time = current_time - 3600
        self.error_counts[path] = [
            (ts, code) for ts, code in self.error_counts[path]
            if ts > cutoff_time
        ]
    
    def _check_alerts(self):
        """Check for alert conditions."""
        try:
            current_time = time.time()
            one_hour_ago = current_time - 3600
            
            for path, errors in self.error_counts.items():
                # Count recent errors
                recent_errors = [
                    (ts, code) for ts, code in errors
                    if ts > one_hour_ago
                ]
                
                # Alert if too many errors on a single endpoint
                if len(recent_errors) > 20:  # More than 20 errors per hour
                    self._send_alert(
                        f"High error rate on {path}",
                        f"Endpoint {path} has {len(recent_errors)} errors in the last hour"
                    )
                
                # Alert for specific error types
                server_errors = [code for _, code in recent_errors if code >= 500]
                if len(server_errors) > 5:  # More than 5 server errors per hour
                    self._send_alert(
                        f"Server errors on {path}",
                        f"Endpoint {path} has {len(server_errors)} server errors in the last hour"
                    )
            
        except Exception as e:
            logger.error(f"Failed to check alerts: {e}")
    
    def _send_alert(self, title: str, message: str):
        """Send an alert."""
        logger.critical(f"ALERT: {title} - {message}")
        
        # Store alert in cache for dashboard display
        from ..services.cache_service import cache_service
        
        alert_data = {
            'title': title,
            'message': message,
            'timestamp': time.time(),
            'severity': 'HIGH'
        }
        
        cache_service.set(f"alert:{int(time.time())}", alert_data, 3600)  # 1 hour TTL