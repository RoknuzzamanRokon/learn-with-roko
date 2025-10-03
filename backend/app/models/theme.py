"""
Theme management models for UI customization.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    JSON,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from ..database import Base


class ThemeStatus(enum.Enum):
    """Status of theme configurations."""

    DRAFT = "draft"
    ACTIVE = "active"
    ARCHIVED = "archived"


class ThemeConfiguration(Base):
    """
    Theme configuration model for storing custom UI themes.
    """

    __tablename__ = "theme_configurations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)

    # Theme configuration data
    colors = Column(JSON, nullable=False)  # Color palette configuration
    typography = Column(JSON, nullable=True)  # Typography settings
    spacing = Column(JSON, nullable=True)  # Spacing configuration
    components = Column(JSON, nullable=True)  # Component-specific overrides

    # Theme metadata
    status = Column(
        String(20), default=ThemeStatus.DRAFT.value, nullable=False, index=True
    )
    is_default = Column(Boolean, default=False, nullable=False)
    is_system = Column(
        Boolean, default=False, nullable=False
    )  # System themes cannot be deleted
    version = Column(String(20), default="1.0.0", nullable=False)

    # Accessibility validation
    accessibility_validated = Column(Boolean, default=False, nullable=False)
    accessibility_report = Column(
        JSON, nullable=True
    )  # Accessibility validation results

    # Audit information
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    activated_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    creator = relationship(
        "User", foreign_keys=[created_by], back_populates="created_themes"
    )
    updater = relationship("User", foreign_keys=[updated_by])
    audit_logs = relationship(
        "ThemeAuditLog", back_populates="theme", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<ThemeConfiguration(id={self.id}, name='{self.name}', status='{self.status}')>"

    @property
    def is_active(self):
        """Check if theme is currently active."""
        return self.status == ThemeStatus.ACTIVE.value

    def validate_colors(self):
        """Validate color configuration structure."""
        required_palettes = ["primary", "neutral", "success", "warning", "error"]
        if not self.colors or not isinstance(self.colors, dict):
            return False

        for palette in required_palettes:
            if palette not in self.colors:
                return False

            palette_colors = self.colors[palette]
            if not isinstance(palette_colors, dict):
                return False

            # Check for required color shades
            required_shades = ["50", "100", "500", "600", "900"]
            for shade in required_shades:
                if shade not in palette_colors:
                    return False

        return True


class ThemeAuditLog(Base):
    """
    Audit log for theme configuration changes.
    """

    __tablename__ = "theme_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    theme_id = Column(Integer, ForeignKey("theme_configurations.id"), nullable=False)

    # Action information
    action = Column(
        String(50), nullable=False
    )  # CREATE, UPDATE, ACTIVATE, DEACTIVATE, DELETE
    description = Column(Text, nullable=False)

    # Change details
    old_values = Column(JSON, nullable=True)  # Previous values for updates
    new_values = Column(JSON, nullable=True)  # New values for updates

    # User and request information
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    client_ip = Column(String(45), nullable=False)
    user_agent = Column(Text, nullable=True)

    # Metadata
    timestamp = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    theme = relationship("ThemeConfiguration", back_populates="audit_logs")
    user = relationship("User", back_populates="theme_audit_logs")

    def __repr__(self):
        return f"<ThemeAuditLog(id={self.id}, theme_id={self.theme_id}, action='{self.action}', timestamp={self.timestamp})>"


class ThemeValidationResult(Base):
    """
    Theme validation results for accessibility and compliance checking.
    """

    __tablename__ = "theme_validation_results"

    id = Column(Integer, primary_key=True, index=True)
    theme_id = Column(Integer, ForeignKey("theme_configurations.id"), nullable=False)

    # Validation information
    validation_type = Column(
        String(50), nullable=False
    )  # ACCESSIBILITY, CONTRAST, COLOR_BLIND
    status = Column(String(20), nullable=False)  # PASS, FAIL, WARNING

    # Validation details
    results = Column(JSON, nullable=False)  # Detailed validation results
    issues = Column(JSON, nullable=True)  # List of issues found
    suggestions = Column(JSON, nullable=True)  # Suggested improvements

    # Validation metadata
    validator_version = Column(String(20), nullable=False)
    validation_rules = Column(JSON, nullable=True)  # Rules used for validation

    # Timestamps
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    theme = relationship("ThemeConfiguration")

    def __repr__(self):
        return f"<ThemeValidationResult(id={self.id}, theme_id={self.theme_id}, type='{self.validation_type}', status='{self.status}')>"
