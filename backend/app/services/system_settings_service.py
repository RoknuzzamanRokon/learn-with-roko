"""
System settings service for handling configuration management.
"""

from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status
import json

from ..models.system_settings import SystemSetting, EmailTemplate, PaymentGatewayConfiguration
from ..schemas.system_settings import (
    SystemSettingCreate,
    SystemSettingUpdate,
    EmailTemplateCreate,
    EmailTemplateUpdate,
    PaymentGatewayConfigurationCreate,
    PaymentGatewayConfigurationUpdate,
    SiteConfigurationUpdate
)


class SystemSettingsService:
    """Service class for system settings management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # System Settings Methods
    def create_setting(self, setting_data: SystemSettingCreate) -> SystemSetting:
        """
        Create a new system setting.
        
        Args:
            setting_data: Setting creation data
            
        Returns:
            SystemSetting: Created setting
            
        Raises:
            HTTPException: If setting key already exists
        """
        # Check if setting key already exists
        existing_setting = self.db.query(SystemSetting).filter(
            SystemSetting.setting_key == setting_data.setting_key
        ).first()
        if existing_setting:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Setting key already exists"
            )
        
        setting_dict = setting_data.model_dump()
        value = setting_dict.pop('value')
        
        setting = SystemSetting(**setting_dict)
        setting.value = value  # Use the property setter
        
        self.db.add(setting)
        self.db.commit()
        self.db.refresh(setting)
        return setting
    
    def get_settings(self, setting_type: Optional[str] = None, public_only: bool = False) -> List[SystemSetting]:
        """Get system settings with optional filtering."""
        query = self.db.query(SystemSetting)
        
        if setting_type:
            query = query.filter(SystemSetting.setting_type == setting_type)
        
        if public_only:
            query = query.filter(SystemSetting.is_public == True)
        
        return query.order_by(SystemSetting.setting_type, SystemSetting.setting_key).all()
    
    def get_setting_by_key(self, setting_key: str) -> Optional[SystemSetting]:
        """Get setting by key."""
        return self.db.query(SystemSetting).filter(SystemSetting.setting_key == setting_key).first()
    
    def get_setting_by_id(self, setting_id: int) -> Optional[SystemSetting]:
        """Get setting by ID."""
        return self.db.query(SystemSetting).filter(SystemSetting.id == setting_id).first()
    
    def update_setting(self, setting_id: int, setting_data: SystemSettingUpdate) -> SystemSetting:
        """Update system setting."""
        setting = self.get_setting_by_id(setting_id)
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )
        
        if not setting.is_editable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This setting is not editable"
            )
        
        # Update setting fields
        update_data = setting_data.model_dump(exclude_unset=True)
        value = update_data.pop('value', None)
        
        for field, val in update_data.items():
            setattr(setting, field, val)
        
        if value is not None:
            setting.value = value
        
        self.db.commit()
        self.db.refresh(setting)
        return setting
    
    def update_setting_by_key(self, setting_key: str, value: Any) -> SystemSetting:
        """Update setting value by key."""
        setting = self.get_setting_by_key(setting_key)
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )
        
        if not setting.is_editable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This setting is not editable"
            )
        
        setting.value = value
        self.db.commit()
        self.db.refresh(setting)
        return setting
    
    def delete_setting(self, setting_id: int) -> bool:
        """Delete system setting."""
        setting = self.get_setting_by_id(setting_id)
        if not setting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )
        
        if not setting.is_editable:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This setting cannot be deleted"
            )
        
        self.db.delete(setting)
        self.db.commit()
        return True
    
    def update_site_configuration(self, config_data: SiteConfigurationUpdate) -> Dict[str, Any]:
        """Update multiple site configuration settings at once."""
        updated_settings = {}
        
        config_dict = config_data.model_dump(exclude_unset=True)
        
        for key, value in config_dict.items():
            setting_key = f"site_{key}"
            try:
                setting = self.update_setting_by_key(setting_key, value)
                updated_settings[key] = setting.value
            except HTTPException:
                # Create setting if it doesn't exist
                setting_data = SystemSettingCreate(
                    setting_key=setting_key,
                    setting_type="site_configuration",
                    display_name=key.replace('_', ' ').title(),
                    value=value,
                    is_public=True,
                    is_editable=True
                )
                setting = self.create_setting(setting_data)
                updated_settings[key] = setting.value
        
        return updated_settings
    
    def get_site_configuration(self) -> Dict[str, Any]:
        """Get all site configuration settings."""
        settings = self.get_settings(setting_type="site_configuration")
        config = {}
        
        for setting in settings:
            # Remove 'site_' prefix from key
            key = setting.setting_key.replace('site_', '', 1)
            config[key] = setting.value
        
        return config
    
    # Email Template Methods
    def create_email_template(self, template_data: EmailTemplateCreate) -> EmailTemplate:
        """Create a new email template."""
        # Check if template key already exists
        existing_template = self.db.query(EmailTemplate).filter(
            EmailTemplate.template_key == template_data.template_key
        ).first()
        if existing_template:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Template key already exists"
            )
        
        template = EmailTemplate(**template_data.model_dump())
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def get_email_templates(self, active_only: bool = False) -> List[EmailTemplate]:
        """Get email templates."""
        query = self.db.query(EmailTemplate)
        if active_only:
            query = query.filter(EmailTemplate.is_active == True)
        return query.order_by(EmailTemplate.name).all()
    
    def get_email_template_by_key(self, template_key: str) -> Optional[EmailTemplate]:
        """Get email template by key."""
        return self.db.query(EmailTemplate).filter(EmailTemplate.template_key == template_key).first()
    
    def get_email_template_by_id(self, template_id: int) -> Optional[EmailTemplate]:
        """Get email template by ID."""
        return self.db.query(EmailTemplate).filter(EmailTemplate.id == template_id).first()
    
    def update_email_template(self, template_id: int, template_data: EmailTemplateUpdate) -> EmailTemplate:
        """Update email template."""
        template = self.get_email_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email template not found"
            )
        
        # Update template fields
        update_data = template_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        
        self.db.commit()
        self.db.refresh(template)
        return template
    
    def delete_email_template(self, template_id: int) -> bool:
        """Delete email template."""
        template = self.get_email_template_by_id(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email template not found"
            )
        
        if template.is_system:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="System templates cannot be deleted"
            )
        
        self.db.delete(template)
        self.db.commit()
        return True
    
    # Payment Gateway Configuration Methods
    def create_payment_gateway(self, gateway_data: PaymentGatewayConfigurationCreate) -> PaymentGatewayConfiguration:
        """Create a new payment gateway configuration."""
        # Check if gateway name already exists
        existing_gateway = self.db.query(PaymentGatewayConfiguration).filter(
            PaymentGatewayConfiguration.gateway_name == gateway_data.gateway_name
        ).first()
        if existing_gateway:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment gateway already exists"
            )
        
        gateway = PaymentGatewayConfiguration(**gateway_data.model_dump())
        self.db.add(gateway)
        self.db.commit()
        self.db.refresh(gateway)
        return gateway
    
    def get_payment_gateways(self, active_only: bool = False) -> List[PaymentGatewayConfiguration]:
        """Get payment gateway configurations."""
        query = self.db.query(PaymentGatewayConfiguration)
        if active_only:
            query = query.filter(PaymentGatewayConfiguration.is_active == True)
        return query.order_by(PaymentGatewayConfiguration.display_name).all()
    
    def get_payment_gateway_by_name(self, gateway_name: str) -> Optional[PaymentGatewayConfiguration]:
        """Get payment gateway by name."""
        return self.db.query(PaymentGatewayConfiguration).filter(
            PaymentGatewayConfiguration.gateway_name == gateway_name
        ).first()
    
    def get_payment_gateway_by_id(self, gateway_id: int) -> Optional[PaymentGatewayConfiguration]:
        """Get payment gateway by ID."""
        return self.db.query(PaymentGatewayConfiguration).filter(PaymentGatewayConfiguration.id == gateway_id).first()
    
    def update_payment_gateway(self, gateway_id: int, gateway_data: PaymentGatewayConfigurationUpdate) -> PaymentGatewayConfiguration:
        """Update payment gateway configuration."""
        gateway = self.get_payment_gateway_by_id(gateway_id)
        if not gateway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment gateway not found"
            )
        
        # Update gateway fields
        update_data = gateway_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(gateway, field, value)
        
        self.db.commit()
        self.db.refresh(gateway)
        return gateway
    
    def delete_payment_gateway(self, gateway_id: int) -> bool:
        """Delete payment gateway configuration."""
        gateway = self.get_payment_gateway_by_id(gateway_id)
        if not gateway:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment gateway not found"
            )
        
        self.db.delete(gateway)
        self.db.commit()
        return True
    
    # Initialization Methods
    def initialize_default_settings(self):
        """Initialize default system settings."""
        default_settings = [
            # Site Configuration
            {
                "setting_key": "site_name",
                "setting_type": "site_configuration",
                "display_name": "Site Name",
                "value": "Learning Management System",
                "is_public": True
            },
            {
                "setting_key": "site_description",
                "setting_type": "site_configuration",
                "display_name": "Site Description",
                "value": "A comprehensive learning management system",
                "is_public": True
            },
            {
                "setting_key": "site_logo_url",
                "setting_type": "site_configuration",
                "display_name": "Site Logo URL",
                "value": "/images/logo.png",
                "is_public": True
            },
            {
                "setting_key": "site_favicon_url",
                "setting_type": "site_configuration",
                "display_name": "Site Favicon URL",
                "value": "/images/favicon.ico",
                "is_public": True
            },
            {
                "setting_key": "contact_email",
                "setting_type": "site_configuration",
                "display_name": "Contact Email",
                "value": "contact@example.com",
                "is_public": True
            },
            {
                "setting_key": "support_email",
                "setting_type": "site_configuration",
                "display_name": "Support Email",
                "value": "support@example.com",
                "is_public": True
            },
            {
                "setting_key": "allow_registration",
                "setting_type": "site_configuration",
                "display_name": "Allow Registration",
                "value": True,
                "is_public": True
            },
            {
                "setting_key": "maintenance_mode",
                "setting_type": "site_configuration",
                "display_name": "Maintenance Mode",
                "value": False,
                "is_public": True
            },
            {
                "setting_key": "default_currency",
                "setting_type": "site_configuration",
                "display_name": "Default Currency",
                "value": "USD",
                "is_public": True
            },
            {
                "setting_key": "timezone",
                "setting_type": "site_configuration",
                "display_name": "Default Timezone",
                "value": "UTC",
                "is_public": True
            }
        ]
        
        for setting_data in default_settings:
            existing = self.get_setting_by_key(setting_data["setting_key"])
            if not existing:
                setting = SystemSetting(**setting_data)
                setting.value = setting_data["value"]
                self.db.add(setting)
        
        self.db.commit()
    
    def initialize_default_email_templates(self):
        """Initialize default email templates."""
        default_templates = [
            {
                "template_key": "welcome_email",
                "name": "Welcome Email",
                "description": "Welcome email sent to new users",
                "subject": "Welcome to {{site_name}}!",
                "html_content": """
                <h1>Welcome to {{site_name}}!</h1>
                <p>Hi {{user_name}},</p>
                <p>Thank you for joining our learning platform. We're excited to have you on board!</p>
                <p>You can now browse our course catalog and start your learning journey.</p>
                <p>Best regards,<br>The {{site_name}} Team</p>
                """,
                "text_content": """
                Welcome to {{site_name}}!
                
                Hi {{user_name}},
                
                Thank you for joining our learning platform. We're excited to have you on board!
                
                You can now browse our course catalog and start your learning journey.
                
                Best regards,
                The {{site_name}} Team
                """,
                "variables": ["site_name", "user_name"],
                "is_system": True
            },
            {
                "template_key": "course_enrollment",
                "name": "Course Enrollment Confirmation",
                "description": "Email sent when user enrolls in a course",
                "subject": "You're enrolled in {{course_title}}!",
                "html_content": """
                <h1>Enrollment Confirmed!</h1>
                <p>Hi {{user_name}},</p>
                <p>You have successfully enrolled in <strong>{{course_title}}</strong>.</p>
                <p>You can start learning right away by visiting your dashboard.</p>
                <p>Happy learning!<br>The {{site_name}} Team</p>
                """,
                "text_content": """
                Enrollment Confirmed!
                
                Hi {{user_name}},
                
                You have successfully enrolled in {{course_title}}.
                
                You can start learning right away by visiting your dashboard.
                
                Happy learning!
                The {{site_name}} Team
                """,
                "variables": ["site_name", "user_name", "course_title"],
                "is_system": True
            },
            {
                "template_key": "course_completion",
                "name": "Course Completion Certificate",
                "description": "Email sent when user completes a course",
                "subject": "Congratulations! You completed {{course_title}}",
                "html_content": """
                <h1>Congratulations!</h1>
                <p>Hi {{user_name}},</p>
                <p>You have successfully completed <strong>{{course_title}}</strong>!</p>
                <p>Your certificate is now available for download from your dashboard.</p>
                <p>Keep up the great work!<br>The {{site_name}} Team</p>
                """,
                "text_content": """
                Congratulations!
                
                Hi {{user_name}},
                
                You have successfully completed {{course_title}}!
                
                Your certificate is now available for download from your dashboard.
                
                Keep up the great work!
                The {{site_name}} Team
                """,
                "variables": ["site_name", "user_name", "course_title"],
                "is_system": True
            }
        ]
        
        for template_data in default_templates:
            existing = self.get_email_template_by_key(template_data["template_key"])
            if not existing:
                template = EmailTemplate(**template_data)
                self.db.add(template)
        
        self.db.commit()