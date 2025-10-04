"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { canAccessRoute, Permission, UserRole } from "../../utils/permissions";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

/**
 * Higher-order component for protecting routes based on user roles and permissions
 * Super admin bypasses all restrictions
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallbackPath = "/auth",
  showUnauthorized = false,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Redirect to auth if not authenticated
    if (!isAuthenticated) {
      router.push(`${fallbackPath}?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Super admin has access to everything
    if (user?.role === "super_admin") {
      return;
    }

    // Check role requirements
    if (
      requiredRoles.length > 0 &&
      !requiredRoles.includes(user?.role as UserRole)
    ) {
      if (showUnauthorized) {
        return; // Show unauthorized component
      }
      router.push("/dashboard"); // Redirect to dashboard
      return;
    }

    // Check permission requirements
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = requiredPermissions.some(
        (permission) =>
          user?.role && canAccessRoute(user.role as UserRole, pathname)
      );

      if (!hasRequiredPermissions) {
        if (showUnauthorized) {
          return; // Show unauthorized component
        }
        router.push("/dashboard"); // Redirect to dashboard
        return;
      }
    }

    // Check route-based access
    if (user?.role && !canAccessRoute(user.role as UserRole, pathname)) {
      if (showUnauthorized) {
        return; // Show unauthorized component
      }
      router.push("/dashboard"); // Redirect to dashboard
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    pathname,
    router,
    requiredRoles,
    requiredPermissions,
    fallbackPath,
    showUnauthorized,
  ]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized message if configured
  if (showUnauthorized && isAuthenticated && user) {
    const hasAccess =
      user.role === "super_admin" ||
      ((requiredRoles.length === 0 ||
        requiredRoles.includes(user.role as UserRole)) &&
        canAccessRoute(user.role as UserRole, pathname));

    if (!hasAccess) {
      return <UnauthorizedAccess userRole={user.role as UserRole} />;
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
};

/**
 * Unauthorized access component
 */
const UnauthorizedAccess: React.FC<{ userRole: UserRole }> = ({ userRole }) => {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>

        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Your current role is{" "}
          <span className="font-semibold capitalize">
            {userRole.replace("_", " ")}
          </span>
          .
        </p>

        <div className="space-y-3">
          <button
            onClick={() => router.back()}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Go Back
          </button>

          <button
            onClick={() => router.push("/dashboard")}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors duration-200"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Need access? Contact your administrator or{" "}
            <button
              onClick={() => router.push("/contact")}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              request permissions
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook for checking permissions in components
 */
export const usePermissions = () => {
  const { user } = useAuth();

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === "super_admin") return true;

    // This would typically check against the backend or stored permissions
    // For now, we'll use the client-side permission system
    return canAccessRoute(user.role as UserRole, window.location.pathname);
  };

  const checkRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === "super_admin") return true;

    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role as UserRole);
  };

  const checkRouteAccess = (route: string): boolean => {
    if (!user) return false;
    return canAccessRoute(user.role as UserRole, route);
  };

  return {
    checkPermission,
    checkRole,
    checkRouteAccess,
    isSuperAdmin: user?.role === "super_admin",
    userRole: user?.role as UserRole,
  };
};

/**
 * Component wrapper for conditional rendering based on permissions
 */
interface ConditionalRenderProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  fallback?: React.ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  fallback = null,
}) => {
  const { checkRole, checkPermission, isSuperAdmin } = usePermissions();

  // Super admin sees everything
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // Check role requirements
  if (
    requiredRoles.length > 0 &&
    !requiredRoles.some((role) => checkRole(role))
  ) {
    return <>{fallback}</>;
  }

  // Check permission requirements
  if (
    requiredPermissions.length > 0 &&
    !requiredPermissions.some((permission) => checkPermission(permission))
  ) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
