"""
Pydantic schemas for theme management.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum


class ThemeStatus(str, Enum):
    """Theme status enumeration."""
    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ValidationStatus(str, Enum):
    """Validation status enumeration."""
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"


class ValidationType(str, Enum):
    """Validation type enumeration."""
    ACCESSIBILITY = "accessibility"
    CONTRAST = "contrast"
    COLOR_BLIND = "color_blind"


# Color Palette Schemas
class ColorPalette(BaseModel):
    """Schema for color palette definition."""
    50: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Lightest shade")
    100: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Very light shade")
    200: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Light shade")
    300: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Light-medium shade")
    400: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Medium shade")
    500: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Base shade")
    600: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Medium-dark shade")
    700: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Dark shade")
    800: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Very dark shade")
    900: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Darkest shade")


class AccentColors(BaseModel):
    """Schema for accent colors."""
    purple: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Purple accent color")
    teal: str = Field(..., regex=r'^#[0-9A-Fa-f]{6}$', description="Teal accent color")


class ThemeColors(BaseModel):
    """Schema for complete theme color configuration."""
    primary: ColorPalette = Field(..., description="Primary color palette")
    neutral: ColorPalette = Field(..., description="Neutral/gray color palette")
    success: ColorPalette = Field(..., description="Success color palette")
    warning: ColorPalette = Field(..., description="Warning color palette")
    error: ColorPalette = Field(..., description="Error color palette")
    accent: Optional[AccentColors] = Field(None, description="Accent colors")


class TypographySettings(BaseModel):
    """Schema for typography settings."""
    font_family_primary: Optional[str] = Field(None, description="Primary font family")
    font_family_secondary: Optional[str] = Field(None, description="Secondary font family")
    font_size_base: Optional[str] = Field(None, description="Base font size")
    line_height_base: Optional[str] = Field(None, description="Base line height")
    font_weights: Optional[Dict[str, Union[int, str]]] = Field(None, description="Font weight definitions")


class SpacingSettings(BaseModel):
    """Schema for spacing settings."""
    base_unit: Optional[str] = Field(None, description="Base spacing unit")
    scale_factor: Optional[float] = Field(None, description="Spacing scale factor")
    custom_spacing: Optional[Dict[str, str]] = Field(None, description="Custom spacing values")


class ComponentOverrides(BaseModel):
    """Schema for component-specific style overrides."""
    buttons: Optional[Dict[str, Any]] = Field(None, description="Button component overrides")
    cards: Optional[Dict[str, Any]] = Field(None, description="Card component overrides")
    navigation: Optional[Dict[str, Any]] = Field(None, description="Navigation component overrides")
    forms: Optional[Dict[str, Any]] = Field(None, description="Form component overrides")


# Theme Configuration Schemas
class ThemeConfigurationCreate(BaseModel):
    """Schema for creating a new theme configuration."""
    name: str = Field(..., min_length=1, max_length=100, description="Theme name")
    description: Optional[str] = Field(None, description="Theme description")
    colors: ThemeColors = Field(..., description="Color configuration")
    typography: Optional[TypographySettings] = Field(None, description="Typography settings")
    spacing: Optional[SpacingSettings] = Field(None, description="Spacing settings")
    components: Optional[ComponentOverrides] = Field(None, description="Component overrides")
    version: str = Field("1.0.0", description="Theme version")

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Theme name cannot be empty')
        return v.strip()


class ThemeConfigurationUpdate(BaseModel):
    """Schema for updating a theme configuration."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Theme name")
    description: Optional[str] = Field(None, description="Theme description")
    colors: Optional[ThemeColors] = Field(None, description="Color configuration")
    typography: Optional[TypographySettings] = Field(None, description="Typography settings")
    spacing: Optional[SpacingSettings] = Field(None, description="Spacing settings")
    components: Optional[ComponentOverrides] = Field(None, description="Component overrides")
    version: Optional[str] = Field(None, description="Theme version")

    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Theme name cannot be empty')
        return v.strip() if v else v


class ThemeConfigurationResponse(BaseModel):
    """Schema for theme configuration response."""
    id: int
    name: str
    description: Optional[str]
    colors: Dict[str, Any]
    typography: Optional[Dict[str, Any]]
    spacing: Optional[Dict[str, Any]]
    components: Optional[Dict[str, Any]]
    status: ThemeStatus
    is_default: bool
    is_system: bool
    version: str
    accessibility_validated: bool
    accessibility_report: Optional[Dict[str, Any]]
    created_by: int
    updated_by: Optional[int]
    created_at: datetime
    updated_at: datetime
    activated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ThemeConfigurationSummary(BaseModel):
    """Schema for theme configuration summary (limited fields)."""
    id: int
    name: str
    description: Optional[str]
    status: ThemeStatus
    is_default: bool
    is_system: bool
    version: str
    accessibility_validated: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Theme Validation Schemas
class ValidationIssue(BaseModel):
    """Schema for validation issue."""
    severity: str = Field(..., description="Issue severity (error, warning, info)")
    message: str = Field(..., description="Issue description")
    component: Optional[str] = Field(None, description="Affected component")
    color_combination: Optional[Dict[str, str]] = Field(None, description="Problematic color combination")
    suggestion: Optional[str] = Field(None, description="Suggested fix")


class ValidationResult(BaseModel):
    """Schema for validation result."""
    validation_type: ValidationType
    status: ValidationStatus
    score: Optional[float] = Field(None, description="Validation score (0-100)")
    issues: List[ValidationIssue] = Field(default_factory=list, description="List of issues found")
    summary: str = Field(..., description="Validation summary")
    details: Dict[str, Any] = Field(default_factory=dict, description="Detailed validation results")


class ThemeValidationRequest(BaseModel):
    """Schema for theme validation request."""
    validation_types: List[ValidationType] = Field(
        default=[ValidationType.ACCESSIBILITY, ValidationType.CONTRAST, ValidationType.COLOR_BLIND],
        description="Types of validation to perform"
    )
    strict_mode: bool = Field(False, description="Enable strict validation mode")


class ThemeValidationResponse(BaseModel):
    """Schema for theme validation response."""
    theme_id: int
    overall_status: ValidationStatus
    overall_score: Optional[float]
    results: List[ValidationResult]
    validated_at: datetime
    validator_version: str

    class Config:
        from_attributes = True


# Theme Audit Schemas
class ThemeAuditLogResponse(BaseModel):
    """Schema for theme audit log response."""
    id: int
    theme_id: int
    action: str
    description: str
    old_values: Optional[Dict[str, Any]]
    new_values: Optional[Dict[str, Any]]
    user_id: int
    client_ip: str
    user_agent: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


# Theme Activation Schemas
class ThemeActivationRequest(BaseModel):
    """Schema for theme activation request."""
    theme_id: int = Field(..., description="ID of theme to activate")
    force: bool = Field(False, description="Force activation even if validation fails")


class ThemeActivationResponse(BaseModel):
    """Schema for theme activation response."""
    success: bool
    message: str
    theme_id: int
    activated_at: Optional[datetime]
    validation_warnings: Optional[List[str]] = Field(default_factory=list)


# Bulk Operations Schemas
class ThemeExportResponse(BaseModel):
    """Schema for theme export response."""
    theme_id: int
    name: str
    version: str
    exported_at: datetime
    configuration: Dict[str, Any]


class ThemeImportRequest(BaseModel):
    """Schema for theme import request."""
    name: str = Field(..., description="Name for imported theme")
    configuration: Dict[str, Any] = Field(..., description="Theme configuration data")
    validate_on_import: bool = Field(True, description="Validate theme on import")


class ThemeImportResponse(BaseModel):
    """Schema for theme import response."""
    success: bool
    message: str
    theme_id: Optional[int]
    validation_results: Optional[List[ValidationResult]]