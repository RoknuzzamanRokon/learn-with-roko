"""
Service for theme management and validation.
"""

import json
import re
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_

from ..models.theme import ThemeConfiguration, ThemeAuditLog, ThemeValidationResult, ThemeStatus
from ..models.user import User
from ..schemas.theme import (
    ThemeConfigurationCreate,
    ThemeConfigurationUpdate,
    ThemeValidationRequest,
    ValidationResult,
    ValidationIssue,
    ValidationType,
    ValidationStatus,
    ThemeActivationRequest
)
from ..services.audit_service import AuditService


class ThemeValidationService:
    """Service for validating theme configurations."""
    
    VALIDATOR_VERSION = "1.0.0"
    
    # WCAG AA contrast ratio requirements
    MIN_CONTRAST_NORMAL = 4.5
    MIN_CONTRAST_LARGE = 3.0
    
    def __init__(self):
        pass
    
    def validate_theme(self, theme_config: Dict[str, Any], validation_types: List[ValidationType]) -> List[ValidationResult]:
        """
        Validate theme configuration against specified validation types.
        
        Args:
            theme_config: Theme configuration data
            validation_types: List of validation types to perform
            
        Returns:
            List[ValidationResult]: Validation results
        """
        results = []
        
        if ValidationType.ACCESSIBILITY in validation_types:
            results.append(self._validate_accessibility(theme_config))
        
        if ValidationType.CONTRAST in validation_types:
            results.append(self._validate_contrast(theme_config))
        
        if ValidationType.COLOR_BLIND in validation_types:
            results.append(self._validate_color_blind_friendly(theme_config))
        
        return results
    
    def _validate_accessibility(self, theme_config: Dict[str, Any]) -> ValidationResult:
        """Validate accessibility compliance."""
        issues = []
        colors = theme_config.get('colors', {})
        
        # Check for required color palettes
        required_palettes = ['primary', 'neutral', 'success', 'warning', 'error']
        for palette in required_palettes:
            if palette not in colors:
                issues.append(ValidationIssue(
                    severity="error",
                    message=f"Missing required color palette: {palette}",
                    component="color_system"
                ))
        
        # Check contrast ratios for common combinations
        if 'primary' in colors and 'neutral' in colors:
            primary_600 = colors['primary'].get('600')
            neutral_50 = colors['neutral'].get('50')
            neutral_900 = colors['neutral'].get('900')
            
            if primary_600 and neutral_50:
                contrast = self._calculate_contrast_ratio(primary_600, neutral_50)
                if contrast < self.MIN_CONTRAST_NORMAL:
                    issues.append(ValidationIssue(
                        severity="error",
                        message=f"Insufficient contrast ratio: {contrast:.2f} (minimum: {self.MIN_CONTRAST_NORMAL})",
                        color_combination={"foreground": primary_600, "background": neutral_50},
                        suggestion="Increase color contrast or use darker/lighter shades"
                    ))
            
            if neutral_900 and neutral_50:
                contrast = self._calculate_contrast_ratio(neutral_900, neutral_50)
                if contrast < self.MIN_CONTRAST_NORMAL:
                    issues.append(ValidationIssue(
                        severity="error",
                        message=f"Text contrast insufficient: {contrast:.2f}",
                        color_combination={"foreground": neutral_900, "background": neutral_50}
                    ))
        
        # Determine overall status
        error_count = len([i for i in issues if i.severity == "error"])
        warning_count = len([i for i in issues if i.severity == "warning"])
        
        if error_count > 0:
            status = ValidationStatus.FAIL
            summary = f"Accessibility validation failed with {error_count} errors"
        elif warning_count > 0:
            status = ValidationStatus.WARNING
            summary = f"Accessibility validation passed with {warning_count} warnings"
        else:
            status = ValidationStatus.PASS
            summary = "Accessibility validation passed"
        
        return ValidationResult(
            validation_type=ValidationType.ACCESSIBILITY,
            status=status,
            score=max(0, 100 - (error_count * 20) - (warning_count * 5)),
            issues=issues,
            summary=summary,
            details={
                "total_checks": len(required_palettes) + 2,
                "errors": error_count,
                "warnings": warning_count
            }
        )
    
    def _validate_contrast(self, theme_config: Dict[str, Any]) -> ValidationResult:
        """Validate color contrast ratios."""
        issues = []
        colors = theme_config.get('colors', {})
        
        # Common color combinations to check
        combinations = [
            ('primary', '600', 'neutral', '50'),  # Primary button on light background
            ('neutral', '900', 'neutral', '50'),  # Dark text on light background
            ('neutral', '600', 'neutral', '100'), # Secondary text on light background
            ('success', '600', 'success', '50'),  # Success text on success background
            ('warning', '600', 'warning', '50'),  # Warning text on warning background
            ('error', '600', 'error', '50'),      # Error text on error background
        ]
        
        for fg_palette, fg_shade, bg_palette, bg_shade in combinations:
            if fg_palette in colors and bg_palette in colors:
                fg_color = colors[fg_palette].get(fg_shade)
                bg_color = colors[bg_palette].get(bg_shade)
                
                if fg_color and bg_color:
                    contrast = self._calculate_contrast_ratio(fg_color, bg_color)
                    
                    if contrast < self.MIN_CONTRAST_NORMAL:
                        severity = "error" if contrast < self.MIN_CONTRAST_LARGE else "warning"
                        issues.append(ValidationIssue(
                            severity=severity,
                            message=f"Low contrast: {contrast:.2f} for {fg_palette}-{fg_shade} on {bg_palette}-{bg_shade}",
                            color_combination={"foreground": fg_color, "background": bg_color},
                            suggestion="Adjust colors to achieve minimum 4.5:1 contrast ratio"
                        ))
        
        # Calculate score based on contrast issues
        error_count = len([i for i in issues if i.severity == "error"])
        warning_count = len([i for i in issues if i.severity == "warning"])
        
        if error_count > 0:
            status = ValidationStatus.FAIL
        elif warning_count > 0:
            status = ValidationStatus.WARNING
        else:
            status = ValidationStatus.PASS
        
        return ValidationResult(
            validation_type=ValidationType.CONTRAST,
            status=status,
            score=max(0, 100 - (error_count * 15) - (warning_count * 5)),
            issues=issues,
            summary=f"Contrast validation: {len(combinations)} combinations checked",
            details={
                "combinations_checked": len(combinations),
                "errors": error_count,
                "warnings": warning_count
            }
        )
    
    def _validate_color_blind_friendly(self, theme_config: Dict[str, Any]) -> ValidationResult:
        """Validate color-blind friendliness."""
        issues = []
        colors = theme_config.get('colors', {})
        
        # Check for problematic color combinations
        if 'success' in colors and 'error' in colors:
            success_color = colors['success'].get('600')
            error_color = colors['error'].get('600')
            
            if success_color and error_color:
                # Simple hue difference check (more sophisticated analysis would be needed for production)
                if self._colors_too_similar(success_color, error_color):
                    issues.append(ValidationIssue(
                        severity="warning",
                        message="Success and error colors may be difficult to distinguish for color-blind users",
                        color_combination={"success": success_color, "error": error_color},
                        suggestion="Ensure sufficient hue and brightness difference between status colors"
                    ))
        
        # Check for red-green combinations
        if 'primary' in colors:
            primary_color = colors['primary'].get('600')
            if primary_color and self._is_problematic_hue(primary_color):
                issues.append(ValidationIssue(
                    severity="info",
                    message="Primary color may be challenging for some color-blind users",
                    suggestion="Consider providing alternative visual indicators (icons, patterns)"
                ))
        
        status = ValidationStatus.WARNING if issues else ValidationStatus.PASS
        
        return ValidationResult(
            validation_type=ValidationType.COLOR_BLIND,
            status=status,
            score=100 - (len(issues) * 10),
            issues=issues,
            summary=f"Color-blind validation: {len(issues)} potential issues found",
            details={
                "checks_performed": ["red_green_similarity", "status_color_distinction"],
                "issues_found": len(issues)
            }
        )
    
    def _calculate_contrast_ratio(self, color1: str, color2: str) -> float:
        """Calculate contrast ratio between two colors."""
        # Convert hex to RGB
        rgb1 = self._hex_to_rgb(color1)
        rgb2 = self._hex_to_rgb(color2)
        
        # Calculate relative luminance
        lum1 = self._get_luminance(rgb1)
        lum2 = self._get_luminance(rgb2)
        
        # Calculate contrast ratio
        lighter = max(lum1, lum2)
        darker = min(lum1, lum2)
        
        return (lighter + 0.05) / (darker + 0.05)
    
    def _hex_to_rgb(self, hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color to RGB tuple."""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
    
    def _get_luminance(self, rgb: Tuple[int, int, int]) -> float:
        """Calculate relative luminance of RGB color."""
        def _linearize(c):
            c = c / 255.0
            return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
        
        r, g, b = rgb
        return 0.2126 * _linearize(r) + 0.7152 * _linearize(g) + 0.0722 * _linearize(b)
    
    def _colors_too_similar(self, color1: str, color2: str) -> bool:
        """Check if two colors are too similar for color-blind users."""
        rgb1 = self._hex_to_rgb(color1)
        rgb2 = self._hex_to_rgb(color2)
        
        # Simple Euclidean distance in RGB space
        distance = sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)) ** 0.5
        
        return distance < 100  # Threshold for similarity
    
    def _is_problematic_hue(self, color: str) -> bool:
        """Check if color is in problematic hue range for color-blind users."""
        rgb = self._hex_to_rgb(color)
        r, g, b = rgb
        
        # Simple check for red-green problematic range
        return (r > g and r > b) or (g > r and g > b)


class ThemeService:
    """Service for managing theme configurations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = ThemeValidationService()
        self.audit_service = AuditService(db)
    
    def create_theme(self, theme_data: ThemeConfigurationCreate, user_id: int, client_ip: str) -> ThemeConfiguration:
        """
        Create a new theme configuration.
        
        Args:
            theme_data: Theme configuration data
            user_id: ID of user creating the theme
            client_ip: Client IP address for audit logging
            
        Returns:
            ThemeConfiguration: Created theme configuration
        """
        # Convert Pydantic models to dict for JSON storage
        colors_dict = theme_data.colors.dict()
        typography_dict = theme_data.typography.dict() if theme_data.typography else None
        spacing_dict = theme_data.spacing.dict() if theme_data.spacing else None
        components_dict = theme_data.components.dict() if theme_data.components else None
        
        theme = ThemeConfiguration(
            name=theme_data.name,
            description=theme_data.description,
            colors=colors_dict,
            typography=typography_dict,
            spacing=spacing_dict,
            components=components_dict,
            version=theme_data.version,
            created_by=user_id,
            status=ThemeStatus.DRAFT.value
        )
        
        self.db.add(theme)
        self.db.commit()
        self.db.refresh(theme)
        
        # Log audit event
        self._log_theme_audit(
            theme_id=theme.id,
            action="CREATE",
            description=f"Created theme '{theme.name}'",
            user_id=user_id,
            client_ip=client_ip,
            new_values={"name": theme.name, "version": theme.version}
        )
        
        return theme
    
    def get_themes(
        self,
        status: Optional[ThemeStatus] = None,
        include_system: bool = True,
        limit: int = 100,
        offset: int = 0
    ) -> List[ThemeConfiguration]:
        """Get theme configurations with filtering."""
        query = self.db.query(ThemeConfiguration)
        
        if status:
            query = query.filter(ThemeConfiguration.status == status.value)
        
        if not include_system:
            query = query.filter(ThemeConfiguration.is_system == False)
        
        query = query.order_by(desc(ThemeConfiguration.updated_at))
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    def get_theme_by_id(self, theme_id: int) -> Optional[ThemeConfiguration]:
        """Get theme configuration by ID."""
        return self.db.query(ThemeConfiguration).filter(ThemeConfiguration.id == theme_id).first()
    
    def update_theme(
  