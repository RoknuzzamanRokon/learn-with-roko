"use client";

import React, { useState } from "react";
import { User } from "../../types/user";
import { UserList } from "./UserList";
import { UserEditModal } from "./UserEditModal";
import { UserCreateModal } from "./UserCreateModal";
import { useAuth } from "../../contexts/AuthContext";

export function UserManagement() {
  const { hasRole } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check if user has admin permissions
  const isAdmin = hasRole("super_admin");

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    // Could open a view modal or navigate to user detail page
  };

  const handleUserEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserDelete = (user: User) => {
    // Refresh the list after deletion
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleUserUpdated = (user: User) => {
    // Refresh the list after update
    setRefreshTrigger((prev) => prev + 1);
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleUserCreated = (user: User) => {
    // Refresh the list after creation
    setRefreshTrigger((prev) => prev + 1);
    setIsCreateModalOpen(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access user management.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage users, roles, and permissions across the platform
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create New User
            </button>
          </div>
        </div>

        {/* User List */}
        <UserList
          key={refreshTrigger} // Force re-render when refreshTrigger changes
          onUserSelect={handleUserSelect}
          onUserEdit={handleUserEdit}
          onUserDelete={handleUserDelete}
        />

        {/* Modals */}
        <UserEditModal
          user={selectedUser}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedUser(null);
          }}
          onUserUpdated={handleUserUpdated}
        />

        <UserCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onUserCreated={handleUserCreated}
        />
      </div>
    </div>
  );
}
