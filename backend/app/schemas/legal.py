"""
Pydantic schemas for legal document management.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# Legal Document Schemas
class LegalDocumentCreate(BaseModel):
    """Schema for creating a new legal document."""
    document_type: str = Field(..., description="Type of legal document")
    title: str = Field(..., min_length=1, max_length=200, description="Document title")
    slug: str = Field(..., min_length=1, max_length=100, description="URL-friendly identifier")
    content: str = Field(..., min_length=1, description="Document content (HTML or Markdown)")
    version: str = Field("1.0", description="Document version")
    effective_date: datetime = Field(..., description="When the document becomes effective")
    requires_acceptance: bool = Field(True, description="Whether users must accept this document")


class LegalDocumentUpdate(BaseModel):
    """Schema for updating a legal document."""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Document title")
    content: Optional[str] = Field(None, min_length=1, description="Document content")
    version: Optional[str] = Field(None, description="Document version")
    effective_date: Optional[datetime] = Field(None, description="When the document becomes effective")
    is_published: Optional[bool] = Field(None, description="Whether document is published")
    requires_acceptance: Optional[bool] = Field(None, description="Whether users must accept this document")


class LegalDocumentResponse(BaseModel):
    """Schema for legal document response."""
    id: int
    document_type: str
    title: str
    slug: str
    content: str
    version: str
    is_current: bool
    previous_version_id: Optional[int]
    effective_date: datetime
    created_by: int
    is_published: bool
    requires_acceptance: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LegalDocumentPublicResponse(BaseModel):
    """Schema for public legal document response (limited fields)."""
    id: int
    document_type: str
    title: str
    slug: str
    content: str
    version: str
    effective_date: datetime
    is_published: bool
    requires_acceptance: bool
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LegalDocumentListResponse(BaseModel):
    """Schema for legal document list response."""
    id: int
    document_type: str
    title: str
    slug: str
    version: str
    is_current: bool
    effective_date: datetime
    is_published: bool
    requires_acceptance: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# User Policy Acceptance Schemas
class UserPolicyAcceptanceCreate(BaseModel):
    """Schema for creating a policy acceptance record."""
    document_id: int = Field(..., description="Legal document ID")
    ip_address: Optional[str] = Field(None, description="User's IP address")
    user_agent: Optional[str] = Field(None, description="User's browser user agent")


class UserPolicyAcceptanceResponse(BaseModel):
    """Schema for policy acceptance response."""
    id: int
    user_id: int
    document_id: int
    accepted_at: datetime
    ip_address: Optional[str]
    user_agent: Optional[str]
    document_version: str
    document_type: str
    
    class Config:
        from_attributes = True


class UserPolicyStatusResponse(BaseModel):
    """Schema for user's policy acceptance status."""
    document_type: str
    document_title: str
    document_version: str
    requires_acceptance: bool
    is_accepted: bool
    accepted_at: Optional[datetime]
    is_current_version: bool
    needs_reacceptance: bool


# Policy Update Notification Schemas
class PolicyUpdateNotificationCreate(BaseModel):
    """Schema for creating a policy update notification."""
    document_id: int = Field(..., description="Legal document ID")
    user_id: int = Field(..., description="User ID")
    notification_type: str = Field(..., description="Type of notification")


class PolicyUpdateNotificationResponse(BaseModel):
    """Schema for policy update notification response."""
    id: int
    document_id: int
    user_id: int
    notification_type: str
    sent_at: datetime
    viewed_at: Optional[datetime]
    acknowledged_at: Optional[datetime]
    
    class Config:
        from_attributes = True


# Bulk Operations Schemas
class BulkPolicyAcceptanceRequest(BaseModel):
    """Schema for bulk policy acceptance."""
    document_ids: List[int] = Field(..., description="List of document IDs to accept")
    ip_address: Optional[str] = Field(None, description="User's IP address")
    user_agent: Optional[str] = Field(None, description="User's browser user agent")


class PolicyComplianceReport(BaseModel):
    """Schema for policy compliance reporting."""
    document_type: str
    document_title: str
    document_version: str
    total_users: int
    accepted_users: int
    pending_users: int
    acceptance_rate: float
    last_updated: datetime


class LegalDocumentVersionHistory(BaseModel):
    """Schema for document version history."""
    versions: List[LegalDocumentListResponse]
    current_version: LegalDocumentResponse


# Document Publishing Schemas
class DocumentPublishRequest(BaseModel):
    """Schema for publishing a document."""
    effective_date: Optional[datetime] = Field(None, description="When the document becomes effective")
    notify_users: bool = Field(True, description="Whether to notify users about the update")
    notification_message: Optional[str] = Field(None, description="Custom notification message")


class DocumentArchiveRequest(BaseModel):
    """Schema for archiving a document."""
    reason: Optional[str] = Field(None, description="Reason for archiving")


# Statistics and Analytics
class LegalDocumentStats(BaseModel):
    """Schema for legal document statistics."""
    total_documents: int
    published_documents: int
    draft_documents: int
    documents_requiring_acceptance: int
    total_acceptances: int
    recent_updates: List[LegalDocumentListResponse]