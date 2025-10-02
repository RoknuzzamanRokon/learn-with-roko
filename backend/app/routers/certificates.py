"""
Certificate API endpoints.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User
from ..services.certificate_service import CertificateService
from ..schemas.certificate import (
    CertificateResponse,
    CertificateWithDetails,
    CompletionStatus,
    CertificateVerification
)

router = APIRouter(prefix="/certificates", tags=["certificates"])


@router.get("/my-certificates", response_model=List[CertificateWithDetails])
async def get_my_certificates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all certificates for the current user."""
    certificates = CertificateService.get_user_certificates(db, current_user.id)
    
    result = []
    for cert in certificates:
        result.append(CertificateWithDetails(
            id=cert.id,
            user_id=cert.user_id,
            course_id=cert.course_id,
            certificate_id=cert.certificate_id,
            title=cert.title,
            description=cert.description,
            verification_code=cert.verification_code,
            certificate_url=cert.certificate_url,
            is_verified=cert.is_verified,
            issued_at=cert.issued_at,
            expires_at=cert.expires_at,
            user_name=cert.user.full_name,
            course_title=cert.course.title,
            instructor_name=cert.course.instructor.full_name
        ))
    
    return result


@router.get("/course/{course_id}/completion-status", response_model=CompletionStatus)
async def check_course_completion(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check completion status for a specific course."""
    status = CertificateService.check_course_completion(db, current_user.id, course_id)
    return CompletionStatus(**status)


@router.post("/course/{course_id}/generate", response_model=CertificateResponse)
async def generate_certificate(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a certificate for a completed course."""
    certificate = CertificateService.generate_certificate(db, current_user.id, course_id)
    
    if not certificate:
        # Check why certificate generation failed
        completion_status = CertificateService.check_course_completion(db, current_user.id, course_id)
        if not completion_status["completed"]:
            raise HTTPException(
                status_code=400,
                detail=f"Course not completed. {completion_status.get('error', 'Requirements not met.')}"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate certificate"
            )
    
    return CertificateResponse.from_orm(certificate)


@router.get("/download/{certificate_id}")
async def download_certificate(
    certificate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a certificate PDF."""
    certificate = CertificateService.get_certificate_by_id(db, certificate_id)
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Check if user owns this certificate
    if certificate.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Generate PDF content
    pdf_content = CertificateService.generate_certificate_pdf_content(db, certificate_id)
    
    if not pdf_content:
        raise HTTPException(status_code=500, detail="Failed to generate certificate PDF")
    
    # Return PDF as streaming response
    pdf_stream = io.BytesIO(pdf_content)
    
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=certificate_{certificate_id}.pdf"
        }
    )


@router.get("/verify/{verification_code}", response_model=CertificateVerification)
async def verify_certificate(
    verification_code: str,
    db: Session = Depends(get_db)
):
    """Verify a certificate using its verification code."""
    certificate = CertificateService.verify_certificate(db, verification_code)
    
    if not certificate:
        return CertificateVerification(
            valid=False,
            message="Invalid verification code or certificate not found"
        )
    
    certificate_details = CertificateWithDetails(
        id=certificate.id,
        user_id=certificate.user_id,
        course_id=certificate.course_id,
        certificate_id=certificate.certificate_id,
        title=certificate.title,
        description=certificate.description,
        verification_code=certificate.verification_code,
        certificate_url=certificate.certificate_url,
        is_verified=certificate.is_verified,
        issued_at=certificate.issued_at,
        expires_at=certificate.expires_at,
        user_name=certificate.user.full_name,
        course_title=certificate.course.title,
        instructor_name=certificate.course.instructor.full_name
    )
    
    return CertificateVerification(
        valid=True,
        certificate=certificate_details,
        message="Certificate is valid"
    )


@router.get("/{certificate_id}", response_model=CertificateWithDetails)
async def get_certificate(
    certificate_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get certificate details by certificate ID."""
    certificate = CertificateService.get_certificate_by_id(db, certificate_id)
    
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    # Check if user owns this certificate
    if certificate.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return CertificateWithDetails(
        id=certificate.id,
        user_id=certificate.user_id,
        course_id=certificate.course_id,
        certificate_id=certificate.certificate_id,
        title=certificate.title,
        description=certificate.description,
        verification_code=certificate.verification_code,
        certificate_url=certificate.certificate_url,
        is_verified=certificate.is_verified,
        issued_at=certificate.issued_at,
        expires_at=certificate.expires_at,
        user_name=certificate.user.full_name,
        course_title=certificate.course.title,
        instructor_name=certificate.course.instructor.full_name
    )