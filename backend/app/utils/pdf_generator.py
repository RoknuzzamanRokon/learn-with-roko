"""
PDF generation utilities for certificates.
"""

import io
from datetime import datetime
from typing import Optional
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfgen import canvas

from ..models.certificate import Certificate
from ..models.user import User
from ..models.course import Course


class CertificatePDFGenerator:
    """Utility class for generating certificate PDFs."""

    @staticmethod
    def generate_certificate_pdf(certificate: Certificate, user: User, course: Course) -> bytes:
        """
        Generate a PDF certificate.
        
        Args:
            certificate: Certificate model instance
            user: User model instance
            course: Course model instance
            
        Returns:
            PDF content as bytes
        """
        # Create a BytesIO buffer to hold the PDF
        buffer = io.BytesIO()
        
        # Create the PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )

        # Get styles
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=28,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        subtitle_style = ParagraphStyle(
            'CustomSubtitle',
            parent=styles['Heading2'],
            fontSize=18,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkgrey,
            fontName='Helvetica'
        )
        
        name_style = ParagraphStyle(
            'CustomName',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.darkblue,
            fontName='Helvetica-Bold'
        )
        
        course_style = ParagraphStyle(
            'CustomCourse',
            parent=styles['Heading2'],
            fontSize=20,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.black,
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.black,
            fontName='Helvetica'
        )
        
        footer_style = ParagraphStyle(
            'CustomFooter',
            parent=styles['Normal'],
            fontSize=10,
            spaceAfter=10,
            alignment=TA_CENTER,
            textColor=colors.grey,
            fontName='Helvetica'
        )

        # Build the certificate content
        story = []
        
        # Add some space at the top
        story.append(Spacer(1, 0.5*inch))
        
        # Certificate title
        story.append(Paragraph("CERTIFICATE OF COMPLETION", title_style))
        
        # Subtitle
        story.append(Paragraph("This is to certify that", subtitle_style))
        
        # Student name
        story.append(Paragraph(user.full_name, name_style))
        
        # Completion text
        story.append(Paragraph("has successfully completed the course", body_style))
        
        # Course title
        story.append(Paragraph(course.title, course_style))
        
        # Course description (if available and not too long)
        if course.short_description and len(course.short_description) < 200:
            story.append(Paragraph(course.short_description, body_style))
        
        # Add some space
        story.append(Spacer(1, 0.5*inch))
        
        # Instructor information
        story.append(Paragraph(f"Instructor: {course.instructor.full_name}", body_style))
        
        # Issue date
        issue_date = certificate.issued_at.strftime("%B %d, %Y")
        story.append(Paragraph(f"Date of Completion: {issue_date}", body_style))
        
        # Add space before footer
        story.append(Spacer(1, 1*inch))
        
        # Certificate ID and verification
        story.append(Paragraph(f"Certificate ID: {certificate.certificate_id}", footer_style))
        story.append(Paragraph(f"Verification Code: {certificate.verification_code}", footer_style))
        story.append(Paragraph("This certificate can be verified online", footer_style))

        # Build the PDF
        doc.build(story)
        
        # Get the PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content

    @staticmethod
    def generate_simple_certificate_pdf(
        student_name: str,
        course_title: str,
        instructor_name: str,
        completion_date: datetime,
        certificate_id: str,
        verification_code: str
    ) -> bytes:
        """
        Generate a simple certificate PDF with basic information.
        
        Args:
            student_name: Name of the student
            course_title: Title of the course
            instructor_name: Name of the instructor
            completion_date: Date of completion
            certificate_id: Unique certificate ID
            verification_code: Verification code
            
        Returns:
            PDF content as bytes
        """
        buffer = io.BytesIO()
        
        # Create canvas
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        
        # Set up fonts and colors
        c.setFont("Helvetica-Bold", 28)
        c.setFillColor(colors.darkblue)
        
        # Title
        title = "CERTIFICATE OF COMPLETION"
        title_width = c.stringWidth(title, "Helvetica-Bold", 28)
        c.drawString((width - title_width) / 2, height - 150, title)
        
        # Subtitle
        c.setFont("Helvetica", 16)
        c.setFillColor(colors.darkgrey)
        subtitle = "This is to certify that"
        subtitle_width = c.stringWidth(subtitle, "Helvetica", 16)
        c.drawString((width - subtitle_width) / 2, height - 200, subtitle)
        
        # Student name
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(colors.darkblue)
        name_width = c.stringWidth(student_name, "Helvetica-Bold", 24)
        c.drawString((width - name_width) / 2, height - 250, student_name)
        
        # Completion text
        c.setFont("Helvetica", 14)
        c.setFillColor(colors.black)
        completion_text = "has successfully completed the course"
        completion_width = c.stringWidth(completion_text, "Helvetica", 14)
        c.drawString((width - completion_width) / 2, height - 300, completion_text)
        
        # Course title
        c.setFont("Helvetica-Bold", 20)
        # Handle long course titles by wrapping
        if len(course_title) > 50:
            # Simple word wrap
            words = course_title.split()
            lines = []
            current_line = []
            for word in words:
                test_line = ' '.join(current_line + [word])
                if c.stringWidth(test_line, "Helvetica-Bold", 20) < width - 100:
                    current_line.append(word)
                else:
                    if current_line:
                        lines.append(' '.join(current_line))
                        current_line = [word]
                    else:
                        lines.append(word)
            if current_line:
                lines.append(' '.join(current_line))
            
            y_pos = height - 350
            for line in lines:
                line_width = c.stringWidth(line, "Helvetica-Bold", 20)
                c.drawString((width - line_width) / 2, y_pos, line)
                y_pos -= 25
        else:
            course_width = c.stringWidth(course_title, "Helvetica-Bold", 20)
            c.drawString((width - course_width) / 2, height - 350, course_title)
        
        # Instructor
        c.setFont("Helvetica", 12)
        instructor_text = f"Instructor: {instructor_name}"
        instructor_width = c.stringWidth(instructor_text, "Helvetica", 12)
        c.drawString((width - instructor_width) / 2, height - 450, instructor_text)
        
        # Date
        date_text = f"Date of Completion: {completion_date.strftime('%B %d, %Y')}"
        date_width = c.stringWidth(date_text, "Helvetica", 12)
        c.drawString((width - date_width) / 2, height - 480, date_text)
        
        # Certificate ID and verification
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.grey)
        
        cert_id_text = f"Certificate ID: {certificate_id}"
        cert_id_width = c.stringWidth(cert_id_text, "Helvetica", 10)
        c.drawString((width - cert_id_width) / 2, 100, cert_id_text)
        
        verify_text = f"Verification Code: {verification_code}"
        verify_width = c.stringWidth(verify_text, "Helvetica", 10)
        c.drawString((width - verify_width) / 2, 80, verify_text)
        
        verify_note = "This certificate can be verified online"
        verify_note_width = c.stringWidth(verify_note, "Helvetica", 10)
        c.drawString((width - verify_note_width) / 2, 60, verify_note)
        
        # Add a border
        c.setStrokeColor(colors.darkblue)
        c.setLineWidth(3)
        c.rect(50, 50, width - 100, height - 100)
        
        # Save the PDF
        c.save()
        
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content