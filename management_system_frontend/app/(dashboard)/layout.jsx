"use client";

import { useAuth } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageLoader } from "@/components/ui/PageLoader";

export default function DashboardLayout({ children }) {
  const { admin, loading, logout } = useAuth({ requireAuth: true });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <DashboardShell admin={admin} onSignOut={logout}>
      {children}
    </DashboardShell>
  );
}
