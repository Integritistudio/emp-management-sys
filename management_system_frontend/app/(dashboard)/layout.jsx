"use client";

import { AuthProvider, useAuthContext } from "@/hooks/useAuth";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { PageLoader } from "@/components/ui/PageLoader";

function DashboardLayoutInner({ children }) {
  const { user, loading, logout } = useAuthContext();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <PageLoader />;
  }

  return (
    <DashboardShell user={user} onSignOut={logout}>
      {children}
    </DashboardShell>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider requireAuth>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AuthProvider>
  );
}
