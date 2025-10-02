"use client";

import React from "react";
import RoleGuard from "../../components/auth/RoleGuard";
import { InstructorAnalyticsDashboard } from "../../components/instructor";

export default function InstructorAnalyticsPage() {
  return (
    <RoleGuard allowedRoles={["instructor", "super_admin"]}>
      <InstructorAnalyticsDashboard />
    </RoleGuard>
  );
}
