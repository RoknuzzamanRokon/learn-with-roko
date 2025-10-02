"use client";

import React, { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  redirectTo?: string;
}

export default function RoleGuard({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback,
  redirectTo,
}: RoleGuardProps) {
  const { user, isLoading, isAuthenticated, hasRole, hasPermission } =
    useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    if (redirectTo) {
      // In a real app, you'd use Next.js router here
      window.location.href = redirectTo;
      return null;
    }

    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              Please log in to access this page.
            </p>
            <button
              onClick={() => (window.location.href = "/auth/login")}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      )
    );
  }

  // Check role-based access
  if (allowedRoles.length > 0) {
    const hasRequiredRole = hasRole(allowedRoles);
    if (!hasRequiredRole) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-2">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Required roles: {allowedRoles.join(", ")}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your role: {user?.role}
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    let hasRequiredPermissions: boolean;

    if (requireAll) {
      // User must have ALL permissions
      hasRequiredPermissions = requiredPermissions.every((permission) =>
        hasPermission(permission)
      );
    } else {
      // User must have at least ONE permission
      hasRequiredPermissions = requiredPermissions.some((permission) =>
        hasPermission(permission)
      );
    }

    if (!hasRequiredPermissions) {
      return (
        fallback || (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Access Denied
              </h2>
              <p className="text-gray-600 mb-2">
                You don't have the required permissions to access this page.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Required permissions: {requiredPermissions.join(", ")}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Your role: {user?.role}
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // User has access, render children
  return <>{children}</>;
}

// Higher-order component version
export function withRoleGuard<P extends object>(
  Component: React.ComponentType<P>,
  guardProps: Omit<RoleGuardProps, "children">
) {
  return function GuardedComponent(props: P) {
    return (
      <RoleGuard {...guardProps}>
        <Component {...props} />
      </RoleGuard>
    );
  };
}

// Specific role guards for common use cases
export function SuperAdminGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["super_admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function InstructorGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={["instructor", "super_admin"]} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function LearnerGuard({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={["learner", "instructor", "super_admin"]}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

// Permission-based guards
export function PermissionGuard({
  children,
  permissions,
  requireAll = false,
  fallback,
}: {
  children: ReactNode;
  permissions: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
}) {
  return (
    <RoleGuard
      requiredPermissions={permissions}
      requireAll={requireAll}
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}
