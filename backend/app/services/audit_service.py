"""
Service for handling audit logging and security events.
"""

import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_

from ..models.audit_log import AuditLog, SecurityEvent
from ..models.user import User


class AuditService:
    """
    Service for managing audit logs and security events.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def log_audit_event(
        self,
        method: str,
        path: str,
        client_ip: str,
        status_code: int,
        user_id: Optional[int] = None,
        user_role: Optional[str] = None,
        user_agent: Optional[str] = None,
        query_params: Optional[Dict[str, Any]] = None,
        request_body: Optional[Dict[str, Any]] = None,
        response_time_ms: Optional[int] = None,
        error_message: Optional[str] = None
    ) -> AuditLog:
        """
        Log an audit event to the database.
        
        Args:
            method: HTTP method
            path: Request path
            client_ip: Client IP address
            status_code: HTTP status code
            user_id: User ID if authenticated
            user_role: User role if authenticated
            user_agent: User agent string
            query_params: Query parameters
            request_body: Request body (sensitive data should be excluded)
            response_time_ms: Response time in milliseconds
            error_message: Error message if any
            
        Returns:
            AuditLog: Created audit log entry
        """
        # Sanitize request body to exclude sensitive data
        sanitized_body = self._sanitize_request_body(request_body) if request_body else None
        
        audit_log = AuditLog(
            method=method,
            path=path,
            client_ip=client_ip,
            user_agent=user_agent,
            user_id=user_id,
            user_role=user_role,
            query_params=json.dumps(query_params) if query_params else None,
            request_body=json.dumps(sanitized_body) if sanitized_body else None,
            status_code=status_code,
            response_time_ms=response_time_ms,
            success=200 <= status_code < 400,
            error_message=error_message,
            timestamp=datetime.utcnow()
        )
        
        self.db.add(audit_log)
        self.db.commit()
        self.db.refresh(audit_log)
        
        return audit_log
    
    def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        client_ip: str,
        user_id: Optional[int] = None,
        user_agent: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> SecurityEvent:
        """
        Log a security event to the database.
        
        Args:
            event_type: Type of security event
            severity: Severity level (LOW, MEDIUM, HIGH, CRITICAL)
            description: Event description
            client_ip: Client IP address
            user_id: User ID if known
            user_agent: User agent string
            details: Additional event details
            
        Returns:
            SecurityEvent: Created security event entry
        """
        security_event = SecurityEvent(
            event_type=event_type,
            severity=severity,
            description=description,
            client_ip=client_ip,
            user_agent=user_agent,
            user_id=user_id,
            details=json.dumps(details) if details else None,
            timestamp=datetime.utcnow()
        )
        
        self.db.add(security_event)
        self.db.commit()
        self.db.refresh(security_event)
        
        return security_event
    
    def get_audit_logs(
        self,
        user_id: Optional[int] = None,
        method: Optional[str] = None,
        path_pattern: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        success_only: Optional[bool] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[AuditLog]:
        """
        Retrieve audit logs with filtering options.
        
        Args:
            user_id: Filter by user ID
            method: Filter by HTTP method
            path_pattern: Filter by path pattern (contains)
            start_date: Filter by start date
            end_date: Filter by end date
            success_only: Filter by success status
            limit: Maximum number of results
            offset: Offset for pagination
            
        Returns:
            List[AuditLog]: List of audit log entries
        """
        query = self.db.query(AuditLog)
        
        # Apply filters
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if method:
            query = query.filter(AuditLog.method == method)
        
        if path_pattern:
            query = query.filter(AuditLog.path.contains(path_pattern))
        
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        
        if success_only is not None:
            query = query.filter(AuditLog.success == success_only)
        
        # Order by timestamp descending and apply pagination
        query = query.order_by(desc(AuditLog.timestamp))
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def get_security_events(
        self,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        resolved: Optional[bool] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[SecurityEvent]:
        """
        Retrieve security events with filtering options.
        
        Args:
            event_type: Filter by event type
            severity: Filter by severity level
            resolved: Filter by resolution status
            start_date: Filter by start date
            end_date: Filter by end date
            limit: Maximum number of results
            offset: Offset for pagination
            
        Returns:
            List[SecurityEvent]: List of security events
        """
        query = self.db.query(SecurityEvent)
        
        # Apply filters
        if event_type:
            query = query.filter(SecurityEvent.event_type == event_type)
        
        if severity:
            query = query.filter(SecurityEvent.severity == severity)
        
        if resolved is not None:
            query = query.filter(SecurityEvent.resolved == resolved)
        
        if start_date:
            query = query.filter(SecurityEvent.timestamp >= start_date)
        
        if end_date:
            query = query.filter(SecurityEvent.timestamp <= end_date)
        
        # Order by timestamp descending and apply pagination
        query = query.order_by(desc(SecurityEvent.timestamp))
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def resolve_security_event(self, event_id: int, resolved_by: int) -> Optional[SecurityEvent]:
        """
        Mark a security event as resolved.
        
        Args:
            event_id: Security event ID
            resolved_by: User ID who resolved the event
            
        Returns:
            SecurityEvent: Updated security event or None if not found
        """
        event = self.db.query(SecurityEvent).filter(SecurityEvent.id == event_id).first()
        
        if event:
            event.resolved = True
            event.resolved_at = datetime.utcnow()
            event.resolved_by = resolved_by
            
            self.db.commit()
            self.db.refresh(event)
        
        return event
    
    def get_security_summary(self, days: int = 7) -> Dict[str, Any]:
        """
        Get security summary for the specified number of days.
        
        Args:
            days: Number of days to include in summary
            
        Returns:
            Dict: Security summary statistics
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Get security events
        events = self.db.query(SecurityEvent).filter(
            SecurityEvent.timestamp >= start_date
        ).all()
        
        # Get failed authentication attempts
        failed_auth = self.db.query(AuditLog).filter(
            and_(
                AuditLog.timestamp >= start_date,
                AuditLog.path.contains("/api/auth/login"),
                AuditLog.success == False
            )
        ).count()
        
        # Get suspicious activity (multiple failed attempts from same IP)
        suspicious_ips = self.db.query(AuditLog.client_ip).filter(
            and_(
                AuditLog.timestamp >= start_date,
                AuditLog.success == False
            )
        ).group_by(AuditLog.client_ip).having(
            self.db.query(AuditLog.id).filter(
                and_(
                    AuditLog.client_ip == AuditLog.client_ip,
                    AuditLog.timestamp >= start_date,
                    AuditLog.success == False
                )
            ).count() > 5
        ).all()
        
        # Categorize events by severity
        event_summary = {
            'CRITICAL': 0,
            'HIGH': 0,
            'MEDIUM': 0,
            'LOW': 0
        }
        
        for event in events:
            event_summary[event.severity] += 1
        
        return {
            'period_days': days,
            'total_events': len(events),
            'events_by_severity': event_summary,
            'failed_auth_attempts': failed_auth,
            'suspicious_ips': len(suspicious_ips),
            'unresolved_events': len([e for e in events if not e.resolved])
        }
    
    def _sanitize_request_body(self, body: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize request body to exclude sensitive information.
        
        Args:
            body: Original request body
            
        Returns:
            Dict: Sanitized request body
        """
        sensitive_fields = {
            'password', 'hashed_password', 'token', 'secret', 'key',
            'credit_card', 'ssn', 'social_security', 'api_key'
        }
        
        sanitized = {}
        
        for key, value in body.items():
            if any(sensitive in key.lower() for sensitive in sensitive_fields):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_request_body(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_request_body(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized