"""
Legal document management API endpoints.
"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..services.legal_service import LegalService
from ..schemas.legal import (
    LegalDocumentCreate,
    LegalDocumentUpdate,
    LegalDocumentResponse,
    LegalDocumentPublicResponse,
    LegalDocumentListResponse,
    LegalDocumentVersionHistory,
    UserPolicyAcceptanceCreate,
    UserPolicyAcceptanceResponse,
    UserPolicyStatusResponse,
    PolicyUpdateNotificationResponse,
    BulkPolicyAcceptanceRequest,
    DocumentPublishRequest,
    DocumentArchiveRequest,
    PolicyComplianceReport,
    LegalDocumentStats
)

router = APIRouter(prefix="/legal", tags=["legal-documents"])


# Public Legal Document Endpoints (no authentication required)
@router.get("/documents/public", response_model=List[LegalDocumentPublicResponse])
async def get_public_documents(
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    db: Session = Depends(get_db)
):
    """Get published legal documents (public access)."""
    service = LegalService(db)
    documents = service.get_documents(
        document_type=document_type,
        published_only=True,
        current_only=True
    )
    return [LegalDocumentPublicResponse.model_validate(doc) for doc in documents]


@router.get("/documents/public/{slug}", response_model=LegalDocumentPublicResponse)
async def get_public_document_by_slug(
    slug: str,
    document_type: Optional[str] = Query(None, description="Document type for additional filtering"),
    db: Session = Depends(get_db)
):
    """Get published legal document by slug (public access)."""
    service = LegalService(db)
    document = service.get_document_by_slug(slug, document_type)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return LegalDocumentPublicResponse.model_validate(document)


# User Policy Acceptance Endpoints (authenticated users)
@router.post("/acceptances", response_model=UserPolicyAcceptanceResponse, status_code=status.HTTP_201_CREATED)
async def accept_policy(
    acceptance_data: UserPolicyAcceptanceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept a legal document/policy."""
    # Auto-populate IP address and user agent if not provided
    if not acceptance_data.ip_address:
        acceptance_data.ip_address = request.client.host
    if not acceptance_data.user_agent:
        acceptance_data.user_agent = request.headers.get("user-agent")
    
    service = LegalService(db)
    return service.record_policy_acceptance(current_user.id, acceptance_data)


@router.post("/acceptances/bulk", response_model=List[UserPolicyAcceptanceResponse])
async def bulk_accept_policies(
    bulk_data: BulkPolicyAcceptanceRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Accept multiple policies at once."""
    # Auto-populate IP address and user agent if not provided
    if not bulk_data.ip_address:
        bulk_data.ip_address = request.client.host
    if not bulk_data.user_agent:
        bulk_data.user_agent = request.headers.get("user-agent")
    
    service = LegalService(db)
    return service.bulk_accept_policies(current_user.id, bulk_data)


@router.get("/my-policy-status", response_model=List[UserPolicyStatusResponse])
async def get_my_policy_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's policy acceptance status."""
    service = LegalService(db)
    return service.get_user_policy_status(current_user.id)


@router.get("/my-acceptances", response_model=List[UserPolicyAcceptanceResponse])
async def get_my_acceptances(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get current user's policy acceptances."""
    service = LegalService(db)
    acceptances = service.get_user_acceptances(current_user.id)
    return [UserPolicyAcceptanceResponse.model_validate(acc) for acc in acceptances]


@router.get("/compliance-check")
async def check_my_compliance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check if current user is compliant with all required policies."""
    service = LegalService(db)
    is_compliant = service.check_user_compliance(current_user.id)
    return {"is_compliant": is_compliant}


# Legal Document Management (Super Admin only)
@router.post("/documents", response_model=LegalDocumentResponse, status_code=status.HTTP_201_CREATED)
async def create_document(
    document_data: LegalDocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new legal document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create legal documents"
        )
    
    service = LegalService(db)
    return service.create_document(document_data, current_user.id)


@router.get("/documents", response_model=List[LegalDocumentListResponse])
async def get_documents(
    document_type: Optional[str] = Query(None, description="Filter by document type"),
    published_only: bool = Query(False, description="Only return published documents"),
    current_only: bool = Query(True, description="Only return current versions"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get legal documents. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view legal document management"
        )
    
    service = LegalService(db)
    documents = service.get_documents(
        document_type=document_type,
        published_only=published_only,
        current_only=current_only
    )
    return [LegalDocumentListResponse.model_validate(doc) for doc in documents]


@router.get("/documents/{document_id}", response_model=LegalDocumentResponse)
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get legal document by ID. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view legal document details"
        )
    
    service = LegalService(db)
    document = service.get_document_by_id(document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return LegalDocumentResponse.model_validate(document)


@router.put("/documents/{document_id}", response_model=LegalDocumentResponse)
async def update_document(
    document_id: int,
    document_data: LegalDocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update legal document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can update legal documents"
        )
    
    service = LegalService(db)
    return service.update_document(document_id, document_data)


@router.post("/documents/{document_id}/new-version", response_model=LegalDocumentResponse)
async def create_new_version(
    document_id: int,
    document_data: LegalDocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new version of an existing document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can create document versions"
        )
    
    service = LegalService(db)
    return service.create_new_version(document_id, document_data, current_user.id)


@router.post("/documents/{document_id}/publish", response_model=LegalDocumentResponse)
async def publish_document(
    document_id: int,
    publish_data: DocumentPublishRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Publish a legal document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can publish legal documents"
        )
    
    service = LegalService(db)
    return service.publish_document(document_id, publish_data)


@router.post("/documents/{document_id}/archive", status_code=status.HTTP_204_NO_CONTENT)
async def archive_document(
    document_id: int,
    archive_data: DocumentArchiveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Archive a legal document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can archive legal documents"
        )
    
    service = LegalService(db)
    service.archive_document(document_id, archive_data)


@router.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a legal document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can delete legal documents"
        )
    
    service = LegalService(db)
    service.delete_document(document_id)


@router.get("/documents/{document_type}/{slug}/versions", response_model=LegalDocumentVersionHistory)
async def get_document_versions(
    document_type: str,
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all versions of a document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view document versions"
        )
    
    service = LegalService(db)
    versions = service.get_document_versions(document_type, slug)
    if not versions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    current_version = next((v for v in versions if v.is_current), versions[0])
    
    return LegalDocumentVersionHistory(
        versions=[LegalDocumentListResponse.model_validate(v) for v in versions],
        current_version=LegalDocumentResponse.model_validate(current_version)
    )


# Analytics and Reporting
@router.get("/documents/{document_id}/compliance-report", response_model=PolicyComplianceReport)
async def get_document_compliance_report(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get compliance report for a specific document. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view compliance reports"
        )
    
    service = LegalService(db)
    report = service.get_document_compliance_report(document_id)
    return PolicyComplianceReport(**report)


@router.get("/stats", response_model=LegalDocumentStats)
async def get_legal_document_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get legal document statistics. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view legal document statistics"
        )
    
    service = LegalService(db)
    stats = service.get_legal_document_stats()
    
    return LegalDocumentStats(
        total_documents=stats["total_documents"],
        published_documents=stats["published_documents"],
        draft_documents=stats["draft_documents"],
        documents_requiring_acceptance=stats["documents_requiring_acceptance"],
        total_acceptances=stats["total_acceptances"],
        recent_updates=[LegalDocumentListResponse.model_validate(doc) for doc in stats["recent_updates"]]
    )


# User Management (Super Admin only)
@router.get("/users/{user_id}/policy-status", response_model=List[UserPolicyStatusResponse])
async def get_user_policy_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get policy acceptance status for a specific user. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view user policy status"
        )
    
    service = LegalService(db)
    return service.get_user_policy_status(user_id)


@router.get("/users/{user_id}/acceptances", response_model=List[UserPolicyAcceptanceResponse])
async def get_user_acceptances(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get policy acceptances for a specific user. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can view user acceptances"
        )
    
    service = LegalService(db)
    acceptances = service.get_user_acceptances(user_id)
    return [UserPolicyAcceptanceResponse.model_validate(acc) for acc in acceptances]


# System Initialization
@router.post("/initialize", status_code=status.HTTP_201_CREATED)
async def initialize_default_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Initialize default legal documents. Requires Super Admin role."""
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Super Admins can initialize default documents"
        )
    
    service = LegalService(db)
    service.initialize_default_documents(current_user.id)
    
    return {"message": "Default legal documents initialized successfully"}