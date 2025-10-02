"use client";

import React from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  RoleGuard,
  SuperAdminGuard,
  InstructorGuard,
} from "../components/auth";

export default function DashboardPage() {
  const { user, logout, hasPermission, hasRole } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/auth";
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.first_name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.full_name || `${user.first_name} ${user.last_name}`}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {user.role.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* User Info Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Profile
              </h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Username
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.username}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {user.role.replace("_", " ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </dd>
                </div>
                {user.bio && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Bio</dt>
                    <dd className="mt-1 text-sm text-gray-900">{user.bio}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Role-based Content */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Super Admin Section */}
            <SuperAdminGuard>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Super Admin Panel
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    You have full administrative access to the system.
                  </p>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                      Manage Users
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                      System Settings
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100">
                      Analytics Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </SuperAdminGuard>

            {/* Instructor Section */}
            <InstructorGuard>
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Instructor Tools
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Create and manage your courses.
                  </p>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                      Create Course
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                      My Courses
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm bg-green-50 text-green-700 rounded hover:bg-green-100">
                      Student Analytics
                    </button>
                  </div>
                </div>
              </div>
            </InstructorGuard>

            {/* Learner Section - Available to all authenticated users */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Learning Hub
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Discover and enroll in courses.
                </p>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
                    Browse Courses
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
                    My Enrollments
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded hover:bg-purple-100">
                    My Certificates
                  </button>
                </div>
              </div>
            </div>

            {/* Permissions Demo */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Your Permissions
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Create Course:</span>
                    <span
                      className={
                        hasPermission("create_course")
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {hasPermission("create_course") ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Manage Users:</span>
                    <span
                      className={
                        hasPermission("create_user")
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {hasPermission("create_user") ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>View Analytics:</span>
                    <span
                      className={
                        hasPermission("view_analytics")
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {hasPermission("view_analytics") ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Enroll in Courses:</span>
                    <span
                      className={
                        hasPermission("enroll_course")
                          ? "text-green-600"
                          : "text-red-600"
                      }
                    >
                      {hasPermission("enroll_course") ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
