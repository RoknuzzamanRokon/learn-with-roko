"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ThemeConfigurationInterface } from "../../components/admin/ThemeConfigurationInterface";

export default function ThemeConfigurationPage() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push("/dashboard");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
          <p className="mt-4 text-[var(--gray-600)]">
            Loading theme configuration...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--gray-900)]">
                Theme Configuration
              </h1>
              <p className="mt-2 text-[var(--gray-600)]">
                Customize the platform's color scheme and branding
              </p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="btn-base btn-secondary"
            >
              ← Back to Admin
            </button>
          </div>
        </div>

        {/* Theme Configuration Interface */}
        <ThemeConfigurationInterface />
      </div>
    </div>
  );
}
