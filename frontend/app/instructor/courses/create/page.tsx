"use client";

import React from "react";
import { useAuth } from "../../../contexts/AuthContext";
import RoleGuard from "../../../components/auth/RoleGuard";
import CourseBuilder from "../../../components/instructor/CourseBuilder";

export default function CreateCoursePage() {
  return (
    <RoleGuard allowedRoles={["instructor", "super_admin"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <CourseBuilder />
        </div>
      </div>
    </RoleGuard>
  );
}
