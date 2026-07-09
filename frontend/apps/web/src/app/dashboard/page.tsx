"use client";

import { ProtectedRoute } from "@repo/auth";

import { DashboardPage } from "./components/DashboardPage";

export default function Page() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  );
}
