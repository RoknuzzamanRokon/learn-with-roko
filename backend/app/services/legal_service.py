"""
Legal document service for handling policy and legal document management.
"""

from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from fastapi import HTTPException, status
from datetime import datetime

from ..models.legal import LegalDocument, UserPolicyAcceptance, PolicyUpdateNotification, DocumentType
from ..models.user import User
from ..schemas.legal import (
    LegalDocumentCreate,
    LegalDocumentUpdate,
    UserPolicyAcceptanceCreate,
    PolicyUpdateNotificationCreate,
    BulkPolicyAcceptanceRequest,
    DocumentPublishRequest,
    DocumentArchiveRequest
)


class LegalService:
    """Service class for legal document management operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Legal Document Management
    def create_document(self, document_data: LegalDocumentCreate, created_by: int) -> LegalDocument:
        """
        Create a new legal document.
        
        Args:
            document_data: Document creation data
            created_by: ID of user creating the document
            
        Returns:
            LegalDocument: Created document
            
        Raises:
            HTTPException: If slug already exists for this document type
        """
        # Check if slug already exists for this document type
        existing_document = self.db.query(LegalDocument).filter(
            and_(
                LegalDocument.document_type == document_data.document_type,
                LegalDocument.slug == document_data.slug,
                LegalDocument.is_current == True
            )
        ).first()
        if existing_document:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A current document with this slug already exists for this document type"
            )
        
        document_dict = document_data.model_dump()
        document_dict['created_by'] = created_by
        
        document = LegalDocument(**document_dict)
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document
    
    def get_documents(
        self, 
        document_type: Optional[str] = None,
        published_only: bool = False,
        current_only: bool = True
    ) -> List[LegalDocument]:
        """Get legal documents with optional filtering."""
        query = self.db.query(LegalDocument)
        
        if document_type:
            query = query.filter(LegalDocument.document_type == document_type)
        
        if published_only:
            query = query.filter(LegalDocument.is_published == True)
        
        if current_only:
            query = query.filter(LegalDocument.is_current == True)
        
        return query.order_by(LegalDocument.document_type, desc(LegalDocument.created_at)).all()
    
    def get_document_by_id(self, document_id: int) -> Optional[LegalDocument]:
        """Get document by ID."""
        return self.db.query(LegalDocument).filter(LegalDocument.id == document_id).first()
    
    def get_document_by_slug(self, slug: str, document_type: Optional[str] = None) -> Optional[LegalDocument]:
        """Get current document by slug."""
        query = self.db.query(LegalDocument).filter(
            and_(
                LegalDocument.slug == slug,
                LegalDocument.is_current == True,
                LegalDocument.is_published == True
            )
        )
        
        if document_type:
            query = query.filter(LegalDocument.document_type == document_type)
        
        return query.first()
    
    def update_document(self, document_id: int, document_data: LegalDocumentUpdate) -> LegalDocument:
        """Update legal document."""
        document = self.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Update document fields
        update_data = document_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(document, field, value)
        
        self.db.commit()
        self.db.refresh(document)
        return document
    
    def create_new_version(
        self, 
        document_id: int, 
        document_data: LegalDocumentUpdate, 
        created_by: int
    ) -> LegalDocument:
        """Create a new version of an existing document."""
        current_document = self.get_document_by_id(document_id)
        if not current_document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Mark current document as not current
        current_document.is_current = False
        
        # Create new version
        new_version_data = {
            "document_type": current_document.document_type,
            "title": document_data.title or current_document.title,
            "slug": current_document.slug,
            "content": document_data.content or current_document.content,
            "version": document_data.version or self._increment_version(current_document.version),
            "effective_date": document_data.effective_date or datetime.utcnow(),
            "requires_acceptance": document_data.requires_acceptance if document_data.requires_acceptance is not None else current_document.requires_acceptance,
            "created_by": created_by,
            "previous_version_id": current_document.id,
            "is_current": True,
            "is_published": document_data.is_published if document_data.is_published is not None else False
        }
        
        new_document = LegalDocument(**new_version_data)
        self.db.add(new_document)
        self.db.commit()
        self.db.refresh(new_document)
        return new_document
    
    def publish_document(self, document_id: int, publish_data: DocumentPublishRequest) -> LegalDocument:
        """Publish a legal document."""
        document = self.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        document.is_published = True
        if publish_data.effective_date:
            document.effective_date = publish_data.effective_date
        
        self.db.commit()
        self.db.refresh(document)
        
        # Send notifications if requested
        if publish_data.notify_users:
            self._notify_users_of_update(document, publish_data.notification_message)
        
        return document
    
    def archive_document(self, document_id: int, archive_data: DocumentArchiveRequest) -> bool:
        """Archive a legal document."""
        document = self.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        document.is_published = False
        document.is_current = False
        
        self.db.commit()
        return True
    
    def delete_document(self, document_id: int) -> bool:
        """Delete a legal document (only if not published and no acceptances)."""
        document = self.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if document.is_published:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete published document. Archive it instead."
            )
        
        # Check if document has acceptances
        acceptance_count = self.db.query(UserPolicyAcceptance).filter(
            UserPolicyAcceptance.document_id == document_id
        ).count()
        
        if acceptance_count > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete document that has user acceptances"
            )
        
        self.db.delete(document)
        self.db.commit()
        return True
    
    def get_document_versions(self, document_type: str, slug: str) -> List[LegalDocument]:
        """Get all versions of a document."""
        return self.db.query(LegalDocument).filter(
            and_(
                LegalDocument.document_type == document_type,
                LegalDocument.slug == slug
            )
        ).order_by(desc(LegalDocument.created_at)).all()
    
    # User Policy Acceptance Management
    def record_policy_acceptance(
        self, 
        user_id: int, 
        acceptance_data: UserPolicyAcceptanceCreate
    ) -> UserPolicyAcceptance:
        """Record user acceptance of a policy."""
        document = self.get_document_by_id(acceptance_data.document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        if not document.is_published:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot accept unpublished document"
            )
        
        # Check if user has already accepted this version
        existing_acceptance = self.db.query(UserPolicyAcceptance).filter(
            and_(
                UserPolicyAcceptance.user_id == user_id,
                UserPolicyAcceptance.document_id == acceptance_data.document_id,
                UserPolicyAcceptance.document_version == document.version
            )
        ).first()
        
        if existing_acceptance:
            return existing_acceptance
        
        acceptance = UserPolicyAcceptance(
            user_id=user_id,
            document_id=acceptance_data.document_id,
            ip_address=acceptance_data.ip_address,
            user_agent=acceptance_data.user_agent,
            document_version=document.version,
            document_type=document.document_type
        )
        
        self.db.add(acceptance)
        self.db.commit()
        self.db.refresh(acceptance)
        return acceptance
    
    def bulk_accept_policies(
        self, 
        user_id: int, 
        bulk_data: BulkPolicyAcceptanceRequest
    ) -> List[UserPolicyAcceptance]:
        """Accept multiple policies at once."""
        acceptances = []
        
        for document_id in bulk_data.document_ids:
            acceptance_data = UserPolicyAcceptanceCreate(
                document_id=document_id,
                ip_address=bulk_data.ip_address,
                user_agent=bulk_data.user_agent
            )
            try:
                acceptance = self.record_policy_acceptance(user_id, acceptance_data)
                acceptances.append(acceptance)
            except HTTPException:
                # Skip documents that can't be accepted
                continue
        
        return acceptances
    
    def get_user_policy_status(self, user_id: int) -> List[Dict[str, Any]]:
        """Get user's policy acceptance status for all required documents."""
        # Get all published documents that require acceptance
        required_documents = self.db.query(LegalDocument).filter(
            and_(
                LegalDocument.is_published == True,
                LegalDocument.is_current == True,
                LegalDocument.requires_acceptance == True
            )
        ).all()
        
        status_list = []
        
        for document in required_documents:
            # Check if user has accepted this document
            acceptance = self.db.query(UserPolicyAcceptance).filter(
                and_(
                    UserPolicyAcceptance.user_id == user_id,
                    UserPolicyAcceptance.document_type == document.document_type,
                    UserPolicyAcceptance.document_version == document.version
                )
            ).first()
            
            # Check if user has accepted any version of this document type
            any_acceptance = self.db.query(UserPolicyAcceptance).filter(
                and_(
                    UserPolicyAcceptance.user_id == user_id,
                    UserPolicyAcceptance.document_type == document.document_type
                )
            ).order_by(desc(UserPolicyAcceptance.accepted_at)).first()
            
            status_list.append({
                "document_type": document.document_type,
                "document_title": document.title,
                "document_version": document.version,
                "requires_acceptance": document.requires_acceptance,
                "is_accepted": acceptance is not None,
                "accepted_at": acceptance.accepted_at if acceptance else None,
                "is_current_version": acceptance is not None,
                "needs_reacceptance": any_acceptance is not None and acceptance is None
            })
        
        return status_list
    
    def get_user_acceptances(self, user_id: int) -> List[UserPolicyAcceptance]:
        """Get all policy acceptances for a user."""
        return self.db.query(UserPolicyAcceptance).filter(
            UserPolicyAcceptance.user_id == user_id
        ).order_by(desc(UserPolicyAcceptance.accepted_at)).all()
    
    def check_user_compliance(self, user_id: int) -> bool:
        """Check if user has accepted all required current policies."""
        status_list = self.get_user_policy_status(user_id)
        return all(
            not status["requires_acceptance"] or status["is_accepted"] 
            for status in status_list
        )
    
    # Notification Management
    def _notify_users_of_update(self, document: LegalDocument, custom_message: Optional[str] = None):
        """Send notifications to users about policy updates."""
        # Get all active users
        users = self.db.query(User).filter(User.is_active == True).all()
        
        for user in users:
            notification = PolicyUpdateNotification(
                document_id=document.id,
                user_id=user.id,
                notification_type="email"
            )
            self.db.add(notification)
        
        self.db.commit()
    
    def mark_notification_viewed(self, notification_id: int, user_id: int) -> bool:
        """Mark a policy update notification as viewed."""
        notification = self.db.query(PolicyUpdateNotification).filter(
            and_(
                PolicyUpdateNotification.id == notification_id,
                PolicyUpdateNotification.user_id == user_id
            )
        ).first()
        
        if notification:
            notification.viewed_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False
    
    def mark_notification_acknowledged(self, notification_id: int, user_id: int) -> bool:
        """Mark a policy update notification as acknowledged."""
        notification = self.db.query(PolicyUpdateNotification).filter(
            and_(
                PolicyUpdateNotification.id == notification_id,
                PolicyUpdateNotification.user_id == user_id
            )
        ).first()
        
        if notification:
            notification.acknowledged_at = datetime.utcnow()
            self.db.commit()
            return True
        
        return False
    
    # Analytics and Reporting
    def get_document_compliance_report(self, document_id: int) -> Dict[str, Any]:
        """Get compliance report for a specific document."""
        document = self.get_document_by_id(document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        total_users = self.db.query(User).filter(User.is_active == True).count()
        accepted_users = self.db.query(UserPolicyAcceptance).filter(
            and_(
                UserPolicyAcceptance.document_id == document_id,
                UserPolicyAcceptance.document_version == document.version
            )
        ).count()
        
        return {
            "document_type": document.document_type,
            "document_title": document.title,
            "document_version": document.version,
            "total_users": total_users,
            "accepted_users": accepted_users,
            "pending_users": total_users - accepted_users,
            "acceptance_rate": (accepted_users / total_users * 100) if total_users > 0 else 0,
            "last_updated": document.updated_at
        }
    
    def get_legal_document_stats(self) -> Dict[str, Any]:
        """Get overall legal document statistics."""
        total_documents = self.db.query(LegalDocument).count()
        published_documents = self.db.query(LegalDocument).filter(
            LegalDocument.is_published == True
        ).count()
        draft_documents = self.db.query(LegalDocument).filter(
            LegalDocument.is_published == False
        ).count()
        documents_requiring_acceptance = self.db.query(LegalDocument).filter(
            and_(
                LegalDocument.is_published == True,
                LegalDocument.is_current == True,
                LegalDocument.requires_acceptance == True
            )
        ).count()
        total_acceptances = self.db.query(UserPolicyAcceptance).count()
        
        recent_updates = self.db.query(LegalDocument).filter(
            LegalDocument.is_published == True
        ).order_by(desc(LegalDocument.updated_at)).limit(5).all()
        
        return {
            "total_documents": total_documents,
            "published_documents": published_documents,
            "draft_documents": draft_documents,
            "documents_requiring_acceptance": documents_requiring_acceptance,
            "total_acceptances": total_acceptances,
            "recent_updates": recent_updates
        }
    
    # Helper Methods
    def _increment_version(self, current_version: str) -> str:
        """Increment version number."""
        try:
            parts = current_version.split('.')
            if len(parts) >= 2:
                major, minor = int(parts[0]), int(parts[1])
                return f"{major}.{minor + 1}"
            else:
                return f"{current_version}.1"
        except (ValueError, IndexError):
            return "1.1"
    
    def initialize_default_documents(self, created_by: int):
        """Initialize default legal documents."""
        default_documents = [
            {
                "document_type": "terms_of_service",
                "title": "Terms of Service",
                "slug": "terms-of-service",
                "content": """
                <h1>Terms of Service</h1>
                <p>Last updated: [DATE]</p>
                
                <h2>1. Acceptance of Terms</h2>
                <p>By accessing and using this learning management system, you accept and agree to be bound by the terms and provision of this agreement.</p>
                
                <h2>2. Use License</h2>
                <p>Permission is granted to temporarily access the materials on this learning platform for personal, non-commercial transitory viewing only.</p>
                
                <h2>3. Disclaimer</h2>
                <p>The materials on this platform are provided on an 'as is' basis. We make no warranties, expressed or implied.</p>
                
                <h2>4. Limitations</h2>
                <p>In no event shall our company or its suppliers be liable for any damages arising out of the use or inability to use the materials on this platform.</p>
                
                <h2>5. Contact Information</h2>
                <p>If you have any questions about these Terms of Service, please contact us.</p>
                """,
                "version": "1.0",
                "effective_date": datetime.utcnow(),
                "requires_acceptance": True,
                "is_published": True
            },
            {
                "document_type": "privacy_policy",
                "title": "Privacy Policy",
                "slug": "privacy-policy",
                "content": """
                <h1>Privacy Policy</h1>
                <p>Last updated: [DATE]</p>
                
                <h2>1. Information We Collect</h2>
                <p>We collect information you provide directly to us, such as when you create an account, enroll in courses, or contact us.</p>
                
                <h2>2. How We Use Your Information</h2>
                <p>We use the information we collect to provide, maintain, and improve our services.</p>
                
                <h2>3. Information Sharing</h2>
                <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.</p>
                
                <h2>4. Data Security</h2>
                <p>We implement appropriate security measures to protect your personal information.</p>
                
                <h2>5. Your Rights</h2>
                <p>You have the right to access, update, or delete your personal information.</p>
                
                <h2>6. Contact Us</h2>
                <p>If you have any questions about this Privacy Policy, please contact us.</p>
                """,
                "version": "1.0",
                "effective_date": datetime.utcnow(),
                "requires_acceptance": True,
                "is_published": True
            }
        ]
        
        for doc_data in default_documents:
            existing = self.db.query(LegalDocument).filter(
                and_(
                    LegalDocument.document_type == doc_data["document_type"],
                    LegalDocument.slug == doc_data["slug"],
                    LegalDocument.is_current == True
                )
            ).first()
            
            if not existing:
                doc_data["created_by"] = created_by
                document = LegalDocument(**doc_data)
                self.db.add(document)
        
        self.db.commit()