"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  badge?: string;
  children?: NavItem[];
}

export const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout, hasRole, hasPermission } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  // Navigation items configuration
  const navigationItems: NavItem[] = [
    {
      label: "Home",
      href: "/",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      label: "Courses",
      href: "/catalog",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      label: "Certificates",
      href: "/verify-certificate",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  // Authenticated user navigation items
  const authenticatedItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      label: "My Certificates",
      href: "/certificates",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
  ];

  // Instructor navigation items
  const instructorItems: NavItem[] = [
    {
      label: "Instructor",
      href: "/instructor",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      roles: ["instructor", "super_admin"],
      children: [
        {
          label: "My Courses",
          href: "/instructor/courses",
          permissions: ["create_course"],
        },
        {
          label: "Create Course",
          href: "/instructor/courses/create",
          permissions: ["create_course"],
        },
        {
          label: "Analytics",
          href: "/instructor/analytics",
          permissions: ["view_own_analytics"],
        },
        {
          label: "Communication",
          href: "/instructor/communication",
          permissions: ["answer_question"],
        },
      ],
    },
  ];

  // Super Admin navigation items with full access
  const superAdminItems: NavItem[] = [
    {
      label: "Admin Panel",
      href: "/admin",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      roles: ["super_admin"],
      badge: "Admin",
      children: [
        {
          label: "Dashboard",
          href: "/admin",
        },
        {
          label: "User Management",
          href: "/admin/users",
        },
        {
          label: "Course Management",
          href: "/admin/courses",
        },
        {
          label: "Analytics",
          href: "/admin/analytics",
        },
        {
          label: "Financial Reports",
          href: "/admin/financial",
        },
        {
          label: "Instructor Applications",
          href: "/admin/instructor-applications",
        },
        {
          label: "Theme Settings",
          href: "/admin/theme",
        },
        {
          label: "System Settings",
          href: "/admin/settings",
        },
      ],
    },
  ];

  // Check if user can access a nav item
  const canAccessItem = (item: NavItem): boolean => {
    // Super admin has access to everything
    if (user?.role === "super_admin") return true;

    // Check roles
    if (item.roles && !item.roles.some((role) => hasRole(role))) {
      return false;
    }

    // Check permissions
    if (
      item.permissions &&
      !item.permissions.some((permission) => hasPermission(permission))
    ) {
      return false;
    }

    return true;
  };

  // Filter navigation items based on user permissions
  const getFilteredItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter((item) => canAccessItem(item))
      .map((item) => ({
        ...item,
        children: item.children
          ? item.children.filter((child) => canAccessItem(child))
          : undefined,
      }));
  };

  // Get all navigation items for current user
  const getAllNavItems = (): NavItem[] => {
    let allItems = [...navigationItems];

    if (isAuthenticated) {
      allItems = [...allItems, ...authenticatedItems];

      // Add instructor items if user is instructor or super admin
      if (hasRole(["instructor", "super_admin"])) {
        allItems = [...allItems, ...getFilteredItems(instructorItems)];
      }

      // Add super admin items if user is super admin
      if (hasRole("super_admin")) {
        allItems = [...allItems, ...getFilteredItems(superAdminItems)];
      }
    }

    return allItems;
  };

  const navItems = getAllNavItems();

  // Check if current path is active
  const isActiveLink = (href: string): boolean => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // Render navigation item
  const renderNavItem = (item: NavItem, isMobile: boolean = false) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = isActiveLink(item.href);
    const isDropdownOpen = openDropdown === item.label;

    const baseClasses = isMobile
      ? "flex items-center px-3 py-2 text-base font-medium transition-colors duration-200"
      : "flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md";

    const activeClasses = isActive
      ? "text-primary-600 bg-primary-50"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50";

    if (hasChildren) {
      return (
        <div key={item.label} className="relative">
          <button
            onClick={() => toggleDropdown(item.label)}
            className={`${baseClasses} ${activeClasses} w-full justify-between`}
          >
            <div className="flex items-center space-x-2">
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {item.badge}
                </span>
              )}
            </div>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {isDropdownOpen && (
            <div
              className={`${
                isMobile
                  ? "pl-6"
                  : "absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
              }`}
            >
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 ${
                    isActiveLink(child.href)
                      ? "bg-primary-50 text-primary-600"
                      : ""
                  } ${isMobile ? "" : "first:rounded-t-md last:rounded-b-md"}`}
                  onClick={() => isMobile && setIsMobileMenuOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${baseClasses} ${activeClasses}`}
        onClick={() => isMobile && setIsMobileMenuOpen(false)}
      >
        <div className="flex items-center space-x-2">
          {item.icon}
          <span>{item.label}</span>
          {item.badge && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}
        </div>
      </Link>
    );
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold text-primary-600">LMS</span>
              {user?.role === "super_admin" && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Super Admin
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => renderNavItem(item))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {user?.first_name?.charAt(0)}
                      {user?.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user?.role?.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/auth"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => renderNavItem(item, true))}

              {/* Mobile User Menu */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center px-3 py-2">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {user?.first_name?.charAt(0)}
                          {user?.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {user?.role?.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-y-1">
                    <Link
                      href="/auth"
                      className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href="/auth"
                      className="block px-3 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md mx-3"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
