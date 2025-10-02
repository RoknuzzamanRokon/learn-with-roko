"use client";

import React from "react";
import RoleGuard from "../../components/auth/RoleGuard";
import { InstructorCommunication } from "../../components/instructor";

export default function InstructorCommunicationPage() {
  return (
    <RoleGuard allowedRoles={["instructor", "super_admin"]}>
      <InstructorCommunication />
    </RoleGuard>
  );
}
