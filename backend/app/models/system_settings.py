"""
System settings and configuration models.
"""

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, JSON
from sqlalchemy.sql import func
import enum
from ..database import Base


class SettingType(enum.Enum):
    """Types of system settings."""
    SITE_CONFIGURATION = "site_configuration"
    PAYMENT_GATEWAY = "payment_gateway"
    EMAIL_TEMPLATE = "email_template"
    BRANDING = "branding"
    NOTIFICATION = "notification"
    SECURITY = "security"


class SystemSetting(Base):
    """
    System-wide settings and configuration.
    """
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String(100), unique=True, nullable=False, index=True)
    setting_type = Column(String(50), nullable=False, index=True)
    display_name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Setting value (can be string, number, boolean, or JSON)
    string_value = Column(Text, nullable=True)
    json_value = Column(JSON, nullable=True)
    
    # Setting metadata
    is_public = Column(Boolean, default=False, nullable=False)  # Can be accessed without authentication
    is_editable = Column(Boolean, default=True, nullable=False)  # Can be modified through UI
    validation_rules = Column(JSON, nullable=True)  # JSON schema for validation
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<SystemSetting(id={self.id}, key='{self.setting_key}', type='{self.setting_type}')>"

    @property
    def value(self):
        """Get the setting value (prioritizes json_value over string_value)."""
        return self.json_value if self.json_value is not None else self.string_value

    @value.setter
    def value(self, val):
        """Set the setting value (automatically determines type)."""
        if isinstance(val, (dict, list)):
            self.json_value = val
            self.string_value = None
        else:
            self.string_value = str(val) if val is not None else None
            self.json_value = None


class EmailTemplate(Base):
    """
    Email templates for system notifications.
    """
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    template_key = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Email content
    subject = Column(String(500), nullable=False)
    html_content = Column(Text, nullable=False)
    text_content = Column(Text, nullable=True)
    
    # Template variables (JSON array of variable names)
    variables = Column(JSON, nullable=True)
    
    # Template settings
    is_active = Column(Boolean, default=True, nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)  # System templates cannot be deleted
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<EmailTemplate(id={self.id}, key='{self.template_key}', name='{self.name}')>"


class PaymentGatewayConfiguration(Base):
    """
    Payment gateway configurations.
    """
    __tablename__ = "payment_gateway_configurations"

    id = Column(Integer, primary_key=True, index=True)
    gateway_name = Column(String(50), unique=True, nullable=False, index=True)  # e.g., 'stripe', 'paypal'
    display_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Configuration data (encrypted sensitive data)
    configuration = Column(JSON, nullable=False)  # API keys, webhook URLs, etc.
    
    # Gateway settings
    is_active = Column(Boolean, default=False, nullable=False)
    is_test_mode = Column(Boolean, default=True, nullable=False)
    supported_currencies = Column(JSON, nullable=True)  # Array of currency codes
    
    # Processing settings
    commission_rate = Column(String(10), default="0.00", nullable=False)  # Platform commission percentage
    processing_fee = Column(String(10), default="0.00", nullable=False)  # Fixed processing fee
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<PaymentGatewayConfiguration(id={self.id}, gateway='{self.gateway_name}', active={self.is_active})>"