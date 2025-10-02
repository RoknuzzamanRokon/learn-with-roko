"""
Certificate service for handling course completion detection and certificate generation.
"""

import uuid
import os
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..models.certificate import Certificate
from ..models.course import Course
from ..models.enrollment import Enrollment, CourseProgress, LectureProgress
from ..models.assessment import Quiz, QuizAttempt
from ..models.user import User
from ..utils.pdf_generator import CertificatePDFGenerator


class CertificateService:
    """Service for managing certificates and course completion."""

    @staticmethod
    def check_course_completion(db: Session, user_id: int, course_id: int) -> Dict[str, Any]:
        """
        Check if a user has completed all requirements for a course.
        
        Args:
            db: Database session
            user_id: ID of the user
            course_id: ID of the course
            
        Returns:
            Dict containing completion status and details
        """
        # Get course and enrollment
        course = db.query(Course).filter(Course.id == course_id).first()
        if not course:
            return {"completed": False, "error": "Course not found"}
            
        enrollment = db.query(Enrollment).filter(
            and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        ).first()
        if not enrollment:
            return {"completed": False, "error": "User not enrolled in course"}

        # Get course progress
        course_progress = db.query(CourseProgress).filter(
            and_(CourseProgress.user_id == user_id, CourseProgress.course_id == course_id)
        ).first()
        
        if not course_progress:
            return {"completed": False, "error": "No progress found"}

        # Check lecture completion
        total_lectures = course_progress.total_lectures
        completed_lectures = course_progress.completed_lectures
        
        lectures_completed = completed_lectures >= total_lectures if total_lectures > 0 else True

        # Check quiz completion
        course_quizzes = db.query(Quiz).filter(
            and_(Quiz.course_id == course_id, Quiz.is_published == True)
        ).all()
        
        quizzes_passed = True
        quiz_details = []
        
        for quiz in course_quizzes:
            # Get the best attempt for this quiz
            best_attempt = db.query(QuizAttempt).filter(
                and_(
                    QuizAttempt.user_id == user_id,
                    QuizAttempt.quiz_id == quiz.id,
                    QuizAttempt.is_completed == True
                )
            ).order_by(QuizAttempt.score.desc()).first()
            
            if not best_attempt or not best_attempt.is_passed:
                quizzes_passed = False
                quiz_details.append({
                    "quiz_id": quiz.id,
                    "title": quiz.title,
                    "passed": False,
                    "score": best_attempt.score if best_attempt else None,
                    "passing_score": quiz.passing_score
                })
            else:
                quiz_details.append({
                    "quiz_id": quiz.id,
                    "title": quiz.title,
                    "passed": True,
                    "score": best_attempt.score,
                    "passing_score": quiz.passing_score
                })

        # Overall completion status
        is_completed = lectures_completed and quizzes_passed

        return {
            "completed": is_completed,
            "lectures_completed": lectures_completed,
            "quizzes_passed": quizzes_passed,
            "lecture_progress": {
                "completed": completed_lectures,
                "total": total_lectures
            },
            "quiz_details": quiz_details,
            "completion_percentage": course_progress.completion_percentage
        }

    @staticmethod
    def generate_certificate(db: Session, user_id: int, course_id: int) -> Optional[Certificate]:
        """
        Generate a certificate for a user who has completed a course.
        
        Args:
            db: Database session
            user_id: ID of the user
            course_id: ID of the course
            
        Returns:
            Certificate object if generated successfully, None otherwise
        """
        # Check if course is completed
        completion_status = CertificateService.check_course_completion(db, user_id, course_id)
        if not completion_status["completed"]:
            return None

        # Check if certificate already exists
        existing_certificate = db.query(Certificate).filter(
            and_(Certificate.user_id == user_id, Certificate.course_id == course_id)
        ).first()
        
        if existing_certificate:
            return existing_certificate

        # Get user and course details
        user = db.query(User).filter(User.id == user_id).first()
        course = db.query(Course).filter(Course.id == course_id).first()
        
        if not user or not course:
            return None

        # Generate unique certificate ID and verification code
        certificate_id = f"CERT-{course_id}-{user_id}-{uuid.uuid4().hex[:8].upper()}"
        verification_code = uuid.uuid4().hex[:16].upper()

        # Create certificate
        certificate = Certificate(
            user_id=user_id,
            course_id=course_id,
            certificate_id=certificate_id,
            title=f"Certificate of Completion - {course.title}",
            description=f"This certifies that {user.full_name} has successfully completed the course '{course.title}' offered by {course.instructor.full_name}.",
            verification_code=verification_code,
            is_verified=True,
            issued_at=datetime.utcnow()
        )

        db.add(certificate)
        db.commit()
        db.refresh(certificate)

        # Generate PDF certificate
        try:
            pdf_content = CertificatePDFGenerator.generate_certificate_pdf(certificate, user, course)
            
            # Save PDF to uploads directory
            uploads_dir = "uploads/certificates"
            os.makedirs(uploads_dir, exist_ok=True)
            
            pdf_filename = f"certificate_{certificate_id}.pdf"
            pdf_path = os.path.join(uploads_dir, pdf_filename)
            
            with open(pdf_path, 'wb') as f:
                f.write(pdf_content)
            
            # Update certificate with PDF URL
            certificate.certificate_url = f"/uploads/certificates/{pdf_filename}"
            db.commit()
            
        except Exception as e:
            # Log error but don't fail certificate creation
            print(f"Error generating PDF for certificate {certificate_id}: {str(e)}")

        # Update enrollment completion status
        enrollment = db.query(Enrollment).filter(
            and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        ).first()
        
        if enrollment:
            enrollment.is_completed = True
            enrollment.completed_at = datetime.utcnow()
            db.commit()

        return certificate

    @staticmethod
    def get_user_certificates(db: Session, user_id: int) -> list[Certificate]:
        """
        Get all certificates for a user.
        
        Args:
            db: Database session
            user_id: ID of the user
            
        Returns:
            List of Certificate objects
        """
        return db.query(Certificate).filter(Certificate.user_id == user_id).all()

    @staticmethod
    def verify_certificate(db: Session, verification_code: str) -> Optional[Certificate]:
        """
        Verify a certificate using its verification code.
        
        Args:
            db: Database session
            verification_code: Verification code to check
            
        Returns:
            Certificate object if valid, None otherwise
        """
        return db.query(Certificate).filter(
            and_(
                Certificate.verification_code == verification_code,
                Certificate.is_verified == True
            )
        ).first()

    @staticmethod
    def update_course_progress(db: Session, user_id: int, course_id: int) -> bool:
        """
        Update course progress and check for completion.
        This should be called whenever a user completes a lecture or quiz.
        
        Args:
            db: Database session
            user_id: ID of the user
            course_id: ID of the course
            
        Returns:
            True if certificate was generated, False otherwise
        """
        # Get or create course progress
        course_progress = db.query(CourseProgress).filter(
            and_(CourseProgress.user_id == user_id, CourseProgress.course_id == course_id)
        ).first()
        
        if not course_progress:
            return False

        # Count completed lectures
        completed_lectures = db.query(LectureProgress).filter(
            and_(
                LectureProgress.user_id == user_id,
                LectureProgress.is_completed == True
            )
        ).join(LectureProgress.lecture).filter(
            LectureProgress.lecture.has(section_id=Course.sections.any(course_id=course_id))
        ).count()

        # Count completed quizzes
        completed_quizzes = db.query(QuizAttempt).filter(
            and_(
                QuizAttempt.user_id == user_id,
                QuizAttempt.is_passed == True
            )
        ).join(QuizAttempt.quiz).filter(
            QuizAttempt.quiz.has(course_id=course_id)
        ).count()

        # Update progress
        course_progress.completed_lectures = completed_lectures
        course_progress.completed_quizzes = completed_quizzes
        
        # Update enrollment progress percentage
        enrollment = db.query(Enrollment).filter(
            and_(Enrollment.user_id == user_id, Enrollment.course_id == course_id)
        ).first()
        
        if enrollment:
            enrollment.progress_percentage = course_progress.completion_percentage

        db.commit()

        # Check if course is now completed and generate certificate
        completion_status = CertificateService.check_course_completion(db, user_id, course_id)
        if completion_status["completed"]:
            certificate = CertificateService.generate_certificate(db, user_id, course_id)
            return certificate is not None

        return False

    @staticmethod
    def generate_certificate_pdf_content(db: Session, certificate_id: str) -> Optional[bytes]:
        """
        Generate PDF content for a certificate.
        
        Args:
            db: Database session
            certificate_id: Certificate ID
            
        Returns:
            PDF content as bytes, or None if certificate not found
        """
        certificate = db.query(Certificate).filter(
            Certificate.certificate_id == certificate_id
        ).first()
        
        if not certificate:
            return None
            
        user = certificate.user
        course = certificate.course
        
        try:
            return CertificatePDFGenerator.generate_certificate_pdf(certificate, user, course)
        except Exception as e:
            print(f"Error generating PDF for certificate {certificate_id}: {str(e)}")
            return None

    @staticmethod
    def get_certificate_by_id(db: Session, certificate_id: str) -> Optional[Certificate]:
        """
        Get certificate by certificate ID.
        
        Args:
            db: Database session
            certificate_id: Certificate ID
            
        Returns:
            Certificate object if found, None otherwise
        """
        return db.query(Certificate).filter(
            Certificate.certificate_id == certificate_id
        ).first()