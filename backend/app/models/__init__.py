"""
SQLAlchemy models for the Learning Management System.
"""

from .user import User, UserRole
from .course import Course, CourseCategory, Section, Lecture, DifficultyLevel, CourseStatus, LectureType
from .enrollment import Enrollment, CourseProgress, LectureProgress
from .assessment import Quiz, Question, QuizAttempt, QuestionType
from .interaction import Note, QAQuestion, QAAnswer
from .certificate import Certificate
from .transaction import Transaction, InstructorPayout, TransactionStatus, PaymentMethod
from .instructor_application import InstructorApplication, ApplicationStatus
from .resource import LectureResource, ResourceDownload, ResourceType
from .taxonomy import Tag, DifficultyConfiguration, course_tags
from .system_settings import SystemSetting, EmailTemplate, PaymentGatewayConfiguration, SettingType
from .legal import LegalDocument, UserPolicyAcceptance, PolicyUpdateNotification, DocumentType

__all__ = [
    "User",
    "UserRole", 
    "Course",
    "CourseCategory",
    "Section",
    "Lecture",
    "DifficultyLevel",
    "CourseStatus",
    "LectureType",
    "Enrollment",
    "CourseProgress",
    "LectureProgress",
    "Quiz",
    "Question",
    "QuizAttempt",
    "QuestionType",
    "Note",
    "QAQuestion",
    "QAAnswer",
    "Certificate",
    "Transaction",
    "InstructorPayout",
    "TransactionStatus",
    "PaymentMethod",
    "InstructorApplication",
    "ApplicationStatus",
    "LectureResource",
    "ResourceDownload",
    "ResourceType",
    "Tag",
    "DifficultyConfiguration",
    "course_tags",
    "SystemSetting",
    "EmailTemplate",
    "PaymentGatewayConfiguration",
    "SettingType",
    "LegalDocument",
    "UserPolicyAcceptance",
    "PolicyUpdateNotification",
    "DocumentType"
]