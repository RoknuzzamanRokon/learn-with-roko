"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "../../contexts/AuthContext";

export const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-blue-600">
              LMS
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="/catalog"
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Browse Courses
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Dashboard
                </Link>

                {user?.role === "instructor" && (
                  <Link
                    href="/instructor"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    My Courses
                  </Link>
                )}

                {user?.role === "super_admin" && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Admin
                  </Link>
                )}

                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.first_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
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
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
