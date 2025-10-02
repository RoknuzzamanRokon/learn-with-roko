"""
Pydantic schemas for system settings and configuration.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime


# System Setting Schemas
class SystemSettingCreate(BaseModel):
    """Schema for creating a new system setting."""
    setting_key: str = Field(..., min_length=1, max_length=100, description="Unique setting key")
    setting_type: str = Field(..., min_length=1, max_length=50, description="Setting type/category")
    display_name: str = Field(..., min_length=1, max_length=200, description="Display name")
    description: Optional[str] = Field(None, description="Setting description")
    value: Union[str, int, float, bool, Dict[str, Any], List[Any]] = Field(..., description="Setting value")
    is_public: bool = Field(False, description="Whether setting can be accessed without authentication")
    is_editable: bool = Field(True, description="Whether setting can be modified through UI")
    validation_rules: Optional[Dict[str, Any]] = Field(None, description="JSON schema for validation")


class SystemSettingUpdate(BaseModel):
    """Schema for updating a system setting."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=200, description="Display name")
    description: Optional[str] = Field(None, description="Setting description")
    value: Optional[Union[str, int, float, bool, Dict[str, Any], List[Any]]] = Field(None, description="Setting value")
    is_public: Optional[bool] = Field(None, description="Whether setting can be accessed without authentication")
    is_editable: Optional[bool] = Field(None, description="Whether setting can be modified through UI")
    validation_rules: Optional[Dict[str, Any]] = Field(None, description="JSON schema for validation")


class SystemSettingResponse(BaseModel):
    """Schema for system setting response."""
    id: int
    setting_key: str
    setting_type: str
    display_name: str
    description: Optional[str]
    value: Union[str, int, float, bool, Dict[str, Any], List[Any], None]
    is_public: bool
    is_editable: bool
    validation_rules: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SystemSettingPublicResponse(BaseModel):
    """Schema for public system setting response (limited fields)."""
    setting_key: str
    value: Union[str, int, float, bool, Dict[str, Any], List[Any], None]
    
    class Config:
        from_attributes = True


# Email Template Schemas
class EmailTemplateCreate(BaseModel):
    """Schema for creating a new email template."""
    template_key: str = Field(..., min_length=1, max_length=100, description="Unique template key")
    name: str = Field(..., min_length=1, max_length=200, description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    subject: str = Field(..., min_length=1, max_length=500, description="Email subject")
    html_content: str = Field(..., min_length=1, description="HTML email content")
    text_content: Optional[str] = Field(None, description="Plain text email content")
    variables: Optional[List[str]] = Field(None, description="List of template variables")


class EmailTemplateUpdate(BaseModel):
    """Schema for updating an email template."""
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    subject: Optional[str] = Field(None, min_length=1, max_length=500, description="Email subject")
    html_content: Optional[str] = Field(None, min_length=1, description="HTML email content")
    text_content: Optional[str] = Field(None, description="Plain text email content")
    variables: Optional[List[str]] = Field(None, description="List of template variables")
    is_active: Optional[bool] = Field(None, description="Whether template is active")


class EmailTemplateResponse(BaseModel):
    """Schema for email template response."""
    id: int
    template_key: str
    name: str
    description: Optional[str]
    subject: str
    html_content: str
    text_content: Optional[str]
    variables: Optional[List[str]]
    is_active: bool
    is_system: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# Payment Gateway Configuration Schemas
class PaymentGatewayConfigurationCreate(BaseModel):
    """Schema for creating a payment gateway configuration."""
    gateway_name: str = Field(..., min_length=1, max_length=50, description="Gateway name (e.g., 'stripe')")
    display_name: str = Field(..., min_length=1, max_length=100, description="Display name")
    description: Optional[str] = Field(None, description="Gateway description")
    configuration: Dict[str, Any] = Field(..., description="Gateway configuration (API keys, etc.)")
    is_test_mode: bool = Field(True, description="Whether gateway is in test mode")
    supported_currencies: Optional[List[str]] = Field(None, description="Supported currency codes")
    commission_rate: str = Field("0.00", description="Platform commission percentage")
    processing_fee: str = Field("0.00", description="Fixed processing fee")


class PaymentGatewayConfigurationUpdate(BaseModel):
    """Schema for updating a payment gateway configuration."""
    display_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Display name")
    description: Optional[str] = Field(None, description="Gateway description")
    configuration: Optional[Dict[str, Any]] = Field(None, description="Gateway configuration")
    is_active: Optional[bool] = Field(None, description="Whether gateway is active")
    is_test_mode: Optional[bool] = Field(None, description="Whether gateway is in test mode")
    supported_currencies: Optional[List[str]] = Field(None, description="Supported currency codes")
    commission_rate: Optional[str] = Field(None, description="Platform commission percentage")
    processing_fee: Optional[str] = Field(None, description="Fixed processing fee")


class PaymentGatewayConfigurationResponse(BaseModel):
    """Schema for payment gateway configuration response."""
    id: int
    gateway_name: str
    display_name: str
    description: Optional[str]
    is_active: bool
    is_test_mode: bool
    supported_currencies: Optional[List[str]]
    commission_rate: str
    processing_fee: str
    created_at: datetime
    updated_at: datetime
    
    # Note: configuration field is excluded for security
    
    class Config:
        from_attributes = True


# Bulk Configuration Schemas
class SiteConfigurationUpdate(BaseModel):
    """Schema for updating site configuration settings."""
    site_name: Optional[str] = Field(None, description="Site name")
    site_description: Optional[str] = Field(None, description="Site description")
    site_logo_url: Optional[str] = Field(None, description="Site logo URL")
    site_favicon_url: Optional[str] = Field(None, description="Site favicon URL")
    contact_email: Optional[str] = Field(None, description="Contact email")
    support_email: Optional[str] = Field(None, description="Support email")
    contact_phone: Optional[str] = Field(None, description="Contact phone")
    company_address: Optional[str] = Field(None, description="Company address")
    social_media_links: Optional[Dict[str, str]] = Field(None, description="Social media links")
    maintenance_mode: Optional[bool] = Field(None, description="Maintenance mode enabled")
    allow_registration: Optional[bool] = Field(None, description="Allow new user registration")
    default_currency: Optional[str] = Field(None, description="Default currency code")
    timezone: Optional[str] = Field(None, description="Default timezone")


class SystemConfigurationResponse(BaseModel):
    """Schema for complete system configuration response."""
    site_settings: Dict[str, Any]
    payment_gateways: List[PaymentGatewayConfigurationResponse]
    email_templates: List[EmailTemplateResponse]
    system_info: Dict[str, Any]