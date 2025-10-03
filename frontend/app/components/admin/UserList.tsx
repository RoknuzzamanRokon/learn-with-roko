"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  UserSearchFilters,
  UserListPaginatedResponse,
} from "../../types/user";
import { userService } from "../../services/userService";
import { useAuth } from "../../contexts/AuthContext";

interface UserListProps {
  onUserSelect?: (user: User) => void;
  onUserEdit?: (user: User) => void;
  onUserDelete?: (user: User) => void;
}

export function UserList({
  onUserSelect,
  onUserEdit,
  onUserDelete,
}: UserListProps) {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState<UserListPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserSearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Check if user has admin permissions
  const isAdmin = hasRole("super_admin");

  const loadUsers = async (
    page: number = 1,
    newFilters: UserSearchFilters = {}
  ) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(page, 20, newFilters);
      setUsers(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers(currentPage, filters);
    }
  }, [currentPage, filters, isAdmin]);

  const handleSearch = () => {
    const newFilters: UserSearchFilters = {
      search: searchTerm || undefined,
      role: (selectedRole as any) || undefined,
      is_active:
        selectedStatus === "active"
          ? true
          : selectedStatus === "inactive"
          ? false
          : undefined,
    };
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedRole("");
    setSelectedStatus("");
    setFilters({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUserAction = async (
    action: "suspend" | "activate" | "delete",
    user: User
  ) => {
    try {
      setError(null);

      if (action === "suspend") {
        await userService.suspendUser(user.id);
      } else if (action === "activate") {
        await userService.activateUser(user.id);
      } else if (action === "delete") {
        if (
          window.confirm(
            `Are you sure you want to delete user ${user.full_name}? This action cannot be undone.`
          )
        ) {
          await userService.deleteUser(user.id);
          if (onUserDelete) onUserDelete(user);
        } else {
          return;
        }
      }

      // Reload users after action
      await loadUsers(currentPage, filters);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${action} user`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-[var(--error-100)] text-[var(--error-800)] border border-[var(--error-200)]";
      case "instructor":
        return "bg-[var(--primary-100)] text-[var(--primary-800)] border border-[var(--primary-200)]";
      case "learner":
        return "bg-[var(--success-100)] text-[var(--success-800)] border border-[var(--success-200)]";
      default:
        return "bg-[var(--gray-100)] text-[var(--gray-800)] border border-[var(--gray-200)]";
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "instructor":
        return "Instructor";
      case "learner":
        return "Learner";
      default:
        return role;
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <div className="bg-[var(--error-50)] border border-[var(--error-200)] rounded-lg p-6">
          <div className="text-[var(--error-600)] text-xl mb-2">🚫</div>
          <p className="text-[var(--error-700)] font-medium">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !users) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
        <p className="mt-2 text-[var(--gray-600)]">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--gray-200)]">
        <h2 className="text-lg font-semibold mb-4 text-[var(--gray-900)]">
          Search Users
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, email, or username"
              className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
            >
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="instructor">Instructor</option>
              <option value="learner">Learner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--gray-700)] mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-end space-x-2">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-[var(--primary-600)] text-white rounded-md hover:bg-[var(--primary-700)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] transition-colors"
            >
              Search
            </button>
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-[var(--gray-200)] text-[var(--gray-700)] rounded-md hover:bg-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--gray-500)] transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-[var(--error-50)] border border-[var(--error-200)] rounded-md p-4">
          <div className="flex items-center">
            <span className="text-[var(--error-600)] mr-2">⚠️</span>
            <p className="text-[var(--error-800)] font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--gray-200)]">
          <h2 className="text-lg font-semibold text-[var(--gray-900)]">
            Users {users && `(${users.total} total)`}
          </h2>
        </div>

        {users && users.users.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--gray-200)]">
                <thead className="bg-[var(--gray-50)]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-[var(--gray-500)] uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[var(--gray-200)]">
                  {users.users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={`hover:bg-[var(--gray-50)] transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-[var(--gray-25)]"
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {user.profile_image ? (
                              <img
                                className="h-10 w-10 rounded-full border-2 border-[var(--gray-200)]"
                                src={user.profile_image}
                                alt={user.full_name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-[var(--primary-100)] border-2 border-[var(--primary-200)] flex items-center justify-center">
                                <span className="text-sm font-semibold text-[var(--primary-700)]">
                                  {user.first_name[0]}
                                  {user.last_name[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-[var(--gray-900)]">
                              {user.full_name}
                            </div>
                            <div className="text-sm text-[var(--gray-600)]">
                              {user.email}
                            </div>
                            <div className="text-xs text-[var(--gray-500)]">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {formatRole(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                            user.is_active
                              ? "bg-[var(--success-100)] text-[var(--success-800)] border-[var(--success-200)]"
                              : "bg-[var(--error-100)] text-[var(--error-800)] border-[var(--error-200)]"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-600)]">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-600)]">
                        {user.last_login
                          ? new Date(user.last_login).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => onUserSelect && onUserSelect(user)}
                            className="px-3 py-1 text-[var(--primary-600)] hover:text-[var(--primary-700)] hover:bg-[var(--primary-50)] rounded-md transition-colors"
                          >
                            View
                          </button>
                          <button
                            onClick={() => onUserEdit && onUserEdit(user)}
                            className="px-3 py-1 text-[var(--accent-purple-600)] hover:text-[var(--accent-purple-700)] hover:bg-[var(--accent-purple-50)] rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          {user.is_active ? (
                            <button
                              onClick={() => handleUserAction("suspend", user)}
                              className="px-3 py-1 text-[var(--warning-600)] hover:text-[var(--warning-700)] hover:bg-[var(--warning-50)] rounded-md transition-colors"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUserAction("activate", user)}
                              className="px-3 py-1 text-[var(--success-600)] hover:text-[var(--success-700)] hover:bg-[var(--success-50)] rounded-md transition-colors"
                            >
                              Activate
                            </button>
                          )}
                          <button
                            onClick={() => handleUserAction("delete", user)}
                            className="px-3 py-1 text-[var(--error-600)] hover:text-[var(--error-700)] hover:bg-[var(--error-50)] rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users.total_pages > 1 && (
              <div className="bg-[var(--gray-50)] px-4 py-3 flex items-center justify-between border-t border-[var(--gray-200)] sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!users.has_prev}
                    className="relative inline-flex items-center px-4 py-2 border border-[var(--gray-300)] text-sm font-medium rounded-md text-[var(--gray-700)] bg-white hover:bg-[var(--gray-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!users.has_next}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-[var(--gray-300)] text-sm font-medium rounded-md text-[var(--gray-700)] bg-white hover:bg-[var(--gray-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[var(--gray-700)]">
                      Showing{" "}
                      <span className="font-semibold text-[var(--gray-900)]">
                        {(currentPage - 1) * users.per_page + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-[var(--gray-900)]">
                        {Math.min(currentPage * users.per_page, users.total)}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-[var(--gray-900)]">
                        {users.total}
                      </span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!users.has_prev}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[var(--gray-300)] bg-white text-sm font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>

                      {/* Page numbers */}
                      {Array.from(
                        { length: Math.min(5, users.total_pages) },
                        (_, i) => {
                          const pageNum =
                            Math.max(
                              1,
                              Math.min(users.total_pages - 4, currentPage - 2)
                            ) + i;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                pageNum === currentPage
                                  ? "z-10 bg-[var(--primary-50)] border-[var(--primary-500)] text-[var(--primary-600)]"
                                  : "bg-white border-[var(--gray-300)] text-[var(--gray-500)] hover:bg-[var(--gray-50)]"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!users.has_next}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[var(--gray-300)] bg-white text-sm font-medium text-[var(--gray-500)] hover:bg-[var(--gray-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-[var(--gray-100)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-[var(--gray-400)]">👥</span>
            </div>
            <p className="text-[var(--gray-600)] font-medium">No users found</p>
            <p className="text-sm text-[var(--gray-500)] mt-1">
              Try adjusting your search filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
