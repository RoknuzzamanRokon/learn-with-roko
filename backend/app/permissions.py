"""
Permission system for role-based access control.
"""

from enum import Enum
from typing import Dict, List, Set
from .models.user import UserRole


class Permission(Enum):
    """
    Enumeration of all permissions in the system.
    Each permission represents a specific action that can be performed.
    """
    
    # User Management Permissions
    CREATE_USER = "create_user"
    READ_USER = "read_user"
    READ_ALL_USERS = "read_all_users"
    UPDATE_USER = "update_user"
    UPDATE_ANY_USER = "update_any_user"
    DELETE_USER = "delete_user"
    DELETE_ANY_USER = "delete_any_user"
    ASSIGN_ROLE = "assign_role"
    SUSPEND_USER = "suspend_user"
    
    # Course Management Permissions
    CREATE_COURSE = "create_course"
    READ_COURSE = "read_course"
    READ_ALL_COURSES = "read_all_courses"
    UPDATE_COURSE = "update_course"
    UPDATE_ANY_COURSE = "update_any_course"
    DELETE_COURSE = "delete_course"
    DELETE_ANY_COURSE = "delete_any_course"
    PUBLISH_COURSE = "publish_course"
    FEATURE_COURSE = "feature_course"
    HIDE_COURSE = "hide_course"
    
    # Content Management Permissions
    UPLOAD_CONTENT = "upload_content"
    UPDATE_CONTENT = "update_content"
    DELETE_CONTENT = "delete_content"
    MODERATE_CONTENT = "moderate_content"
    
    # Enrollment Permissions
    ENROLL_COURSE = "enroll_course"
    VIEW_ENROLLMENTS = "view_enrollments"
    VIEW_ALL_ENROLLMENTS = "view_all_enrollments"
    MANAGE_ENROLLMENTS = "manage_enrollments"
    
    # Learning Permissions
    VIEW_PROGRESS = "view_progress"
    VIEW_ALL_PROGRESS = "view_all_progress"
    UPDATE_PROGRESS = "update_progress"
    TAKE_QUIZ = "take_quiz"
    CREATE_NOTE = "create_note"
    
    # Q&A and Discussion Permissions
    ASK_QUESTION = "ask_question"
    ANSWER_QUESTION = "answer_question"
    MODERATE_QA = "moderate_qa"
    
    # Analytics and Reporting Permissions
    VIEW_ANALYTICS = "view_analytics"
    VIEW_OWN_ANALYTICS = "view_own_analytics"
    VIEW_COURSE_ANALYTICS = "view_course_analytics"
    VIEW_PLATFORM_ANALYTICS = "view_platform_analytics"
    EXPORT_ANALYTICS = "export_analytics"
    
    # Financial Permissions
    PROCESS_PAYMENTS = "process_payments"
    VIEW_TRANSACTIONS = "view_transactions"
    VIEW_ALL_TRANSACTIONS = "view_all_transactions"
    MANAGE_PAYOUTS = "manage_payouts"
    VIEW_REVENUE = "view_revenue"
    
    # System Administration Permissions
    MANAGE_CATEGORIES = "manage_categories"
    MANAGE_SETTINGS = "manage_settings"
    MANAGE_EMAIL_TEMPLATES = "manage_email_templates"
    VIEW_SYSTEM_HEALTH = "view_system_health"
    MANAGE_LEGAL_PAGES = "manage_legal_pages"
    
    # Certificate Permissions
    ISSUE_CERTIFICATE = "issue_certificate"
    VIEW_CERTIFICATES = "view_certificates"
    VERIFY_CERTIFICATE = "verify_certificate"


# Role-Permission Mapping
ROLE_PERMISSIONS: Dict[UserRole, Set[Permission]] = {
    UserRole.SUPER_ADMIN: {
        # Super Admin has all permissions
        Permission.CREATE_USER,
        Permission.READ_USER,
        Permission.READ_ALL_USERS,
        Permission.UPDATE_USER,
        Permission.UPDATE_ANY_USER,
        Permission.DELETE_USER,
        Permission.DELETE_ANY_USER,
        Permission.ASSIGN_ROLE,
        Permission.SUSPEND_USER,
        
        Permission.CREATE_COURSE,
        Permission.READ_COURSE,
        Permission.READ_ALL_COURSES,
        Permission.UPDATE_COURSE,
        Permission.UPDATE_ANY_COURSE,
        Permission.DELETE_COURSE,
        Permission.DELETE_ANY_COURSE,
        Permission.PUBLISH_COURSE,
        Permission.FEATURE_COURSE,
        Permission.HIDE_COURSE,
        
        Permission.UPLOAD_CONTENT,
        Permission.UPDATE_CONTENT,
        Permission.DELETE_CONTENT,
        Permission.MODERATE_CONTENT,
        
        Permission.ENROLL_COURSE,
        Permission.VIEW_ENROLLMENTS,
        Permission.VIEW_ALL_ENROLLMENTS,
        Permission.MANAGE_ENROLLMENTS,
        
        Permission.VIEW_PROGRESS,
        Permission.VIEW_ALL_PROGRESS,
        Permission.UPDATE_PROGRESS,
        Permission.TAKE_QUIZ,
        Permission.CREATE_NOTE,
        
        Permission.ASK_QUESTION,
        Permission.ANSWER_QUESTION,
        Permission.MODERATE_QA,
        
        Permission.VIEW_ANALYTICS,
        Permission.VIEW_OWN_ANALYTICS,
        Permission.VIEW_COURSE_ANALYTICS,
        Permission.VIEW_PLATFORM_ANALYTICS,
        Permission.EXPORT_ANALYTICS,
        
        Permission.PROCESS_PAYMENTS,
        Permission.VIEW_TRANSACTIONS,
        Permission.VIEW_ALL_TRANSACTIONS,
        Permission.MANAGE_PAYOUTS,
        Permission.VIEW_REVENUE,
        
        Permission.MANAGE_CATEGORIES,
        Permission.MANAGE_SETTINGS,
        Permission.MANAGE_EMAIL_TEMPLATES,
        Permission.VIEW_SYSTEM_HEALTH,
        Permission.MANAGE_LEGAL_PAGES,
        
        Permission.ISSUE_CERTIFICATE,
        Permission.VIEW_CERTIFICATES,
        Permission.VERIFY_CERTIFICATE,
    },
    
    UserRole.INSTRUCTOR: {
        # Instructor permissions
        Permission.READ_USER,  # Can read basic user info
        
        Permission.CREATE_COURSE,
        Permission.READ_COURSE,
        Permission.UPDATE_COURSE,  # Own courses only
        Permission.DELETE_COURSE,  # Own courses only
        Permission.PUBLISH_COURSE,  # Own courses only
        
        Permission.UPLOAD_CONTENT,
        Permission.UPDATE_CONTENT,
        Permission.DELETE_CONTENT,
        
        Permission.ENROLL_COURSE,  # Can enroll in other courses
        Permission.VIEW_ENROLLMENTS,  # Own course enrollments
        
        Permission.VIEW_PROGRESS,  # Student progress in own courses
        Permission.TAKE_QUIZ,
        Permission.CREATE_NOTE,
        
        Permission.ASK_QUESTION,
        Permission.ANSWER_QUESTION,  # In own courses
        
        Permission.VIEW_OWN_ANALYTICS,
        Permission.VIEW_COURSE_ANALYTICS,  # Own courses only
        
        Permission.VIEW_TRANSACTIONS,  # Own transactions
        Permission.VIEW_REVENUE,  # Own revenue
        
        Permission.ISSUE_CERTIFICATE,  # For own courses
        Permission.VIEW_CERTIFICATES,
        Permission.VERIFY_CERTIFICATE,
    },
    
    UserRole.LEARNER: {
        # Learner permissions
        Permission.READ_USER,  # Own profile only
        Permission.UPDATE_USER,  # Own profile only
        
        Permission.READ_COURSE,  # Public courses
        
        Permission.ENROLL_COURSE,
        Permission.VIEW_ENROLLMENTS,  # Own enrollments
        
        Permission.VIEW_PROGRESS,  # Own progress
        Permission.TAKE_QUIZ,
        Permission.CREATE_NOTE,
        
        Permission.ASK_QUESTION,
        
        Permission.VIEW_CERTIFICATES,  # Own certificates
        Permission.VERIFY_CERTIFICATE,
    }
}


class PermissionChecker:
    """
    Utility class for checking user permissions.
    """
    
    @staticmethod
    def has_permission(user_role: UserRole, permission: Permission) -> bool:
        """
        Check if a user role has a specific permission.
        
        Args:
            user_role: The user's role
            permission: The permission to check
            
        Returns:
            bool: True if the role has the permission, False otherwise
        """
        role_permissions = ROLE_PERMISSIONS.get(user_role, set())
        return permission in role_permissions
    
    @staticmethod
    def get_role_permissions(user_role: UserRole) -> Set[Permission]:
        """
        Get all permissions for a specific role.
        
        Args:
            user_role: The user's role
            
        Returns:
            Set[Permission]: Set of permissions for the role
        """
        return ROLE_PERMISSIONS.get(user_role, set())
    
    @staticmethod
    def can_access_resource(user_role: UserRole, required_permissions: List[Permission]) -> bool:
        """
        Check if a user role can access a resource that requires specific permissions.
        
        Args:
            user_role: The user's role
            required_permissions: List of permissions required for the resource
            
        Returns:
            bool: True if the role has at least one of the required permissions
        """
        role_permissions = ROLE_PERMISSIONS.get(user_role, set())
        return any(permission in role_permissions for permission in required_permissions)
    
    @staticmethod
    def requires_all_permissions(user_role: UserRole, required_permissions: List[Permission]) -> bool:
        """
        Check if a user role has all the required permissions.
        
        Args:
            user_role: The user's role
            required_permissions: List of permissions that are all required
            
        Returns:
            bool: True if the role has all required permissions
        """
        role_permissions = ROLE_PERMISSIONS.get(user_role, set())
        return all(permission in role_permissions for permission in required_permissions)