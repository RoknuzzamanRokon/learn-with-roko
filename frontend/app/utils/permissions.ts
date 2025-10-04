/**
 * Comprehensive role-based access control system
 * Defines all permissions and role hierarchies for the LMS
 */

export type UserRole = "super_admin" | "instructor" | "learner";

export type Permission =
    // Course Management
    | "create_course"
    | "update_course"
    | "delete_course"
    | "publish_course"
    | "view_all_courses"
    | "manage_course_content"

    // Content Management
    | "upload_content"
    | "update_content"
    | "delete_content"
    | "manage_media"

    // User Management
    | "create_user"
    | "update_user"
    | "delete_user"
    | "view_all_users"
    | "manage_user_roles"
    | "suspend_user"
    | "activate_user"

    // Enrollment Management
    | "enroll_user"
    | "unenroll_user"
    | "view_enrollments"
    | "manage_enrollments"

    // Analytics & Reporting
    | "view_system_analytics"
    | "view_course_analytics"
    | "view_user_analytics"
    | "view_financial_reports"
    | "export_reports"

    // Certificate Management
    | "issue_certificate"
    | "revoke_certificate"
    | "view_all_certificates"
    | "manage_certificate_templates"

    // Communication
    | "send_announcements"
    | "moderate_discussions"
    | "answer_questions"
    | "send_messages"

    // System Administration
    | "manage_system_settings"
    | "manage_themes"
    | "view_system_logs"
    | "manage_backups"
    | "manage_integrations"

    // Financial Management
    | "view_revenue"
    | "manage_pricing"
    | "process_refunds"
    | "view_transactions"

    // Instructor Management
    | "approve_instructors"
    | "review_instructor_applications"
    | "manage_instructor_payouts"

    // Learning Management
    | "take_quiz"
    | "view_progress"
    | "create_notes"
    | "ask_questions"
    | "rate_courses"
    | "view_certificates";

/**
 * Role-based permission mapping
 * Super Admin has ALL permissions by default
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    super_admin: [], // Empty array means ALL permissions (handled in hasPermission function)

    instructor: [
        // Course Management
        "create_course",
        "update_course",
        "delete_course",
        "publish_course",
        "manage_course_content",

        // Content Management
        "upload_content",
        "update_content",
        "delete_content",
        "manage_media",

        // Analytics (own courses only)
        "view_course_analytics",

        // Enrollment (own courses only)
        "view_enrollments",

        // Certificate Management (own courses only)
        "issue_certificate",

        // Communication
        "answer_questions",
        "send_messages",
        "moderate_discussions",
    ],

    learner: [
        // Learning Activities
        "take_quiz",
        "view_progress",
        "create_notes",
        "ask_questions",
        "rate_courses",

        // Certificate Management (own certificates only)
        "view_certificates",
    ],
};

/**
 * Role hierarchy - higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
    super_admin: ["instructor", "learner"], // Inherits all permissions
    instructor: ["learner"], // Inherits learner permissions
    learner: [], // Base role
};

/**
 * Special permissions that require additional context checks
 */
export const CONTEXTUAL_PERMISSIONS = {
    // These permissions require checking if user owns/manages the resource
    OWN_RESOURCE: [
        "update_course",
        "delete_course",
        "view_course_analytics",
        "issue_certificate",
    ],

    // These permissions are restricted to specific contexts
    ADMIN_ONLY: [
        "manage_system_settings",
        "view_system_logs",
        "manage_user_roles",
        "approve_instructors",
        "view_financial_reports",
    ],
};

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
    userRole: UserRole,
    permission: Permission,
    context?: {
        resourceOwnerId?: number;
        userId?: number;
        isSystemAdmin?: boolean;
    }
): boolean {
    // Super admin has ALL permissions
    if (userRole === "super_admin") {
        return true;
    }

    // Check direct role permissions
    const rolePermissions = ROLE_PERMISSIONS[userRole];
    if (rolePermissions.includes(permission)) {
        // For contextual permissions, check additional conditions
        if (CONTEXTUAL_PERMISSIONS.OWN_RESOURCE.includes(permission)) {
            return context?.resourceOwnerId === context?.userId;
        }
        return true;
    }

    // Check inherited permissions from role hierarchy
    const inheritedRoles = ROLE_HIERARCHY[userRole];
    for (const inheritedRole of inheritedRoles) {
        if (ROLE_PERMISSIONS[inheritedRole].includes(permission)) {
            return true;
        }
    }

    return false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
    userRole: UserRole,
    permissions: Permission[],
    context?: Parameters<typeof hasPermission>[2]
): boolean {
    return permissions.some(permission =>
        hasPermission(userRole, permission, context)
    );
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
    userRole: UserRole,
    permissions: Permission[],
    context?: Parameters<typeof hasPermission>[2]
): boolean {
    return permissions.every(permission =>
        hasPermission(userRole, permission, context)
    );
}

/**
 * Get all permissions for a user role
 */
export function getAllPermissions(userRole: UserRole): Permission[] {
    // Super admin gets ALL permissions
    if (userRole === "super_admin") {
        return Object.values(ROLE_PERMISSIONS).flat().filter((permission, index, array) =>
            array.indexOf(permission) === index // Remove duplicates
        );
    }

    const permissions = new Set<Permission>();

    // Add direct permissions
    ROLE_PERMISSIONS[userRole].forEach(permission => permissions.add(permission));

    // Add inherited permissions
    const inheritedRoles = ROLE_HIERARCHY[userRole];
    inheritedRoles.forEach(role => {
        ROLE_PERMISSIONS[role].forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(userRole: UserRole, route: string): boolean {
    // Super admin can access everything
    if (userRole === "super_admin") {
        return true;
    }

    // Route-based access control
    const routePermissions: Record<string, Permission[]> = {
        "/admin": ["manage_system_settings"],
        "/admin/users": ["view_all_users"],
        "/admin/courses": ["view_all_courses"],
        "/admin/analytics": ["view_system_analytics"],
        "/admin/financial": ["view_financial_reports"],
        "/admin/instructor-applications": ["approve_instructors"],
        "/admin/theme": ["manage_themes"],
        "/instructor": ["create_course"],
        "/instructor/courses": ["create_course"],
        "/instructor/analytics": ["view_course_analytics"],
        "/dashboard": [], // All authenticated users
        "/certificates": ["view_certificates"],
    };

    const requiredPermissions = routePermissions[route];
    if (!requiredPermissions) {
        return true; // No specific permissions required
    }

    if (requiredPermissions.length === 0) {
        return true; // Route accessible to all authenticated users
    }

    return hasAnyPermission(userRole, requiredPermissions);
}

/**
 * Get user-friendly role display name
 */
export function getRoleDisplayName(role: UserRole): string {
    const roleNames: Record<UserRole, string> = {
        super_admin: "Super Administrator",
        instructor: "Instructor",
        learner: "Learner",
    };

    return roleNames[role] || role;
}

/**
 * Get role badge color for UI display
 */
export function getRoleBadgeColor(role: UserRole): string {
    const colors: Record<UserRole, string> = {
        super_admin: "bg-red-100 text-red-800",
        instructor: "bg-blue-100 text-blue-800",
        learner: "bg-green-100 text-green-800",
    };

    return colors[role] || "bg-gray-100 text-gray-800";
}

/**
 * Navigation items with permission requirements
 */
export interface NavItemPermission {
    label: string;
    href: string;
    permissions?: Permission[];
    roles?: UserRole[];
    icon?: string;
    badge?: string;
    children?: NavItemPermission[];
}

/**
 * Get filtered navigation items based on user permissions
 */
export function getAuthorizedNavItems(
    userRole: UserRole,
    navItems: NavItemPermission[]
): NavItemPermission[] {
    return navItems.filter(item => {
        // Check role requirements
        if (item.roles && !item.roles.includes(userRole) && userRole !== "super_admin") {
            return false;
        }

        // Check permission requirements
        if (item.permissions && !hasAnyPermission(userRole, item.permissions)) {
            return false;
        }

        return true;
    }).map(item => ({
        ...item,
        children: item.children ? getAuthorizedNavItems(userRole, item.children) : undefined,
    }));
}