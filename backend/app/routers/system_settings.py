"""
System settings and configuration API endpoints.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.system_settings_service import SystemSettingsService
from ..schemas.system_settings import (
    SystemSettingCreate,
    SystemSettingUpdate,
    SystemSettingResponse,
    SystemSettingPublicResponse,
    EmailTemplateCreate,
    EmailTemplateUpdate,
    EmailTemplateResponse,
    PaymentGatewayConfigurationCreate,
    PaymentGatewayConfigurationUpdate,
    PaymentGatewayConfigurationResponse,
    SiteConfigurationUpdate,
    SystemConfigurationResponse
)

router = APIRouter(prefix="/system", tags=["system-settings"])


# Public Settings Endpoints (no authentication required)
@router.get("/settings/public", response_model=List[SystemSettingPublicResponse])
async def get_public_settings(
    db: Session = Depends(get_db)
):
    """Get public system settings (no authentication required)."""
    service = SystemSettingsService(db)
    settings = service.get_settings(public_only=True)
    return [
        SystemSettingPublicResponse(
            setting_key=setting.setting_key,
            value=setting.value
        )
        for setting in settings
    ]


@router.get("/settings/site-config", response_model=Dict[str, Any])
async def get_site_configuration(
    db: Session = Depends(get_db)
):
    """Get site configuration settings (public)."""
    service = SystemSettingsService(db)
    return service.get_site_configuration()


# System Settings Management (Super Admin only)
@router.post("/settings", response_model=SystemSettingResponse, status_code=status.HTTP_201_CREATED)
async def create_setting(
    setting_data: SystemSettingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new system setting. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create system settings"
        )
    
    service = SystemSettingsService(db)
    return service.create_setting(setting_data)


@router.get("/settings", response_model=List[SystemSettingResponse])
async def get_settings(
    setting_type: Optional[str] = Query(None, description="Filter by setting type"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system settings. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view system settings"
        )
    
    service = SystemSettingsService(db)
    settings = service.get_settings(setting_type=setting_type)
    return [SystemSettingResponse.model_validate(setting) for setting in settings]


@router.get("/settings/{setting_id}", response_model=SystemSettingResponse)
async def get_setting(
    setting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get system setting by ID. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view system settings"
        )
    
    service = SystemSettingsService(db)
    setting = service.get_setting_by_id(setting_id)
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Setting not found"
        )
    return SystemSettingResponse.model_validate(setting)


@router.put("/settings/{setting_id}", response_model=SystemSettingResponse)
async def update_setting(
    setting_id: int,
    setting_data: SystemSettingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update system setting. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update system settings"
        )
    
    service = SystemSettingsService(db)
    return service.update_setting(setting_id, setting_data)


@router.delete("/settings/{setting_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_setting(
    setting_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete system setting. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete system settings"
        )
    
    service = SystemSettingsService(db)
    service.delete_setting(setting_id)


@router.put("/settings/site-config", response_model=Dict[str, Any])
async def update_site_configuration(
    config_data: SiteConfigurationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update site configuration settings. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update site configuration"
        )
    
    service = SystemSettingsService(db)
    return service.update_site_configuration(config_data)


# Email Template Management
@router.post("/email-templates", response_model=EmailTemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_email_template(
    template_data: EmailTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new email template. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create email templates"
        )
    
    service = SystemSettingsService(db)
    return service.create_email_template(template_data)


@router.get("/email-templates", response_model=List[EmailTemplateResponse])
async def get_email_templates(
    active_only: bool = Query(False, description="Only return active templates"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get email templates. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view email templates"
        )
    
    service = SystemSettingsService(db)
    return service.get_email_templates(active_only=active_only)


@router.get("/email-templates/{template_id}", response_model=EmailTemplateResponse)
async def get_email_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get email template by ID. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view email templates"
        )
    
    service = SystemSettingsService(db)
    template = service.get_email_template_by_id(template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email template not found"
        )
    return template


@router.put("/email-templates/{template_id}", response_model=EmailTemplateResponse)
async def update_email_template(
    template_id: int,
    template_data: EmailTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update email template. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update email templates"
        )
    
    service = SystemSettingsService(db)
    return service.update_email_template(template_id, template_data)


@router.delete("/email-templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_email_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete email template. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete email templates"
        )
    
    service = SystemSettingsService(db)
    service.delete_email_template(template_id)


# Payment Gateway Configuration
@router.post("/payment-gateways", response_model=PaymentGatewayConfigurationResponse, status_code=status.HTTP_201_CREATED)
async def create_payment_gateway(
    gateway_data: PaymentGatewayConfigurationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new payment gateway configuration. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create payment gateway configurations"
        )
    
    service = SystemSettingsService(db)
    return service.create_payment_gateway(gateway_data)


@router.get("/payment-gateways", response_model=List[PaymentGatewayConfigurationResponse])
async def get_payment_gateways(
    active_only: bool = Query(False, description="Only return active gateways"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment gateway configurations. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view payment gateway configurations"
        )
    
    service = SystemSettingsService(db)
    return service.get_payment_gateways(active_only=active_only)


@router.get("/payment-gateways/{gateway_id}", response_model=PaymentGatewayConfigurationResponse)
async def get_payment_gateway(
    gateway_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get payment gateway configuration by ID. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view payment gateway configurations"
        )
    
    service = SystemSettingsService(db)
    gateway = service.get_payment_gateway_by_id(gateway_id)
    if not gateway:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment gateway not found"
        )
    return gateway


@router.put("/payment-gateways/{gateway_id}", response_model=PaymentGatewayConfigurationResponse)
async def update_payment_gateway(
    gateway_id: int,
    gateway_data: PaymentGatewayConfigurationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update payment gateway configuration. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update payment gateway configurations"
        )
    
    service = SystemSettingsService(db)
    return service.update_payment_gateway(gateway_id, gateway_data)


@router.delete("/payment-gateways/{gateway_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_gateway(
    gateway_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete payment gateway configuration. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete payment gateway configurations"
        )
    
    service = SystemSettingsService(db)
    service.delete_payment_gateway(gateway_id)


# System Overview
@router.get("/configuration", response_model=SystemConfigurationResponse)
async def get_system_configuration(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete system configuration overview. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view system configuration"
        )
    
    service = SystemSettingsService(db)
    
    site_settings = service.get_site_configuration()
    payment_gateways = service.get_payment_gateways()
    email_templates = service.get_email_templates()
    
    return SystemConfigurationResponse(
        site_settings=site_settings,
        payment_gateways=[PaymentGatewayConfigurationResponse.model_validate(gw) for gw in payment_gateways],
        email_templates=[EmailTemplateResponse.model_validate(tmpl) for tmpl in email_templates],
        system_info={
            "total_settings": len(service.get_settings()),
            "total_email_templates": len(email_templates),
            "total_payment_gateways": len(payment_gateways),
            "active_payment_gateways": len([gw for gw in payment_gateways if gw.is_active])
        }
    )


# System Initialization (for development/setup)
@router.post("/initialize", status_code=status.HTTP_201_CREATED)
async def initialize_system_defaults(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize default system settings and templates. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can initialize system defaults"
        )
    
    service = SystemSettingsService(db)
    service.initialize_default_settings()
    service.initialize_default_email_templates()
    
    return {"message": "System defaults initialized successfully"}