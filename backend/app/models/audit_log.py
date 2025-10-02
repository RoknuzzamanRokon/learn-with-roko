"""
Audit log model for tracking sensitive operations.
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class AuditLog(Base):
    """
    Model for storing audit logs of sensitive operations.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    
    # Request information
    method = Column(String(10), nullable=False)
    path = Column(String(500), nullable=False)
    client_ip = Column(String(45), nullable=False)  # IPv6 compatible
    user_agent = Column(Text)
    
    # User information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_role = Column(String(50), nullable=True)
    
    # Request/Response details
    query_params = Column(Text, nullable=True)  # JSON string
    request_body = Column(Text, nullable=True)  # JSON string (sensitive data excluded)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Integer, nullable=True)
    
    # Metadata
    success = Column(Boolean, nullable=False, default=False)
    error_message = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog(id={self.id}, method={self.method}, path={self.path}, user_id={self.user_id}, timestamp={self.timestamp})>"


class SecurityEvent(Base):
    """
    Model for storing security-related events and alerts.
    """
    __tablename__ = "security_events"

    id = Column(Integer, primary_key=True, index=True)
    
    # Event information
    event_type = Column(String(50), nullable=False)  # RATE_LIMIT, MALICIOUS_INPUT, FAILED_AUTH, etc.
    severity = Column(String(20), nullable=False)  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    
    # Source information
    client_ip = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Event details
    details = Column(Text, nullable=True)  # JSON string with additional details
    resolved = Column(Boolean, nullable=False, default=False)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Metadata
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="security_events")
    resolver = relationship("User", foreign_keys=[resolved_by])

    def __repr__(self):
        return f"<SecurityEvent(id={self.id}, type={self.event_type}, severity={self.severity}, timestamp={self.timestamp})>"