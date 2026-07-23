"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/PageLoader";

/** Redirects users who lack any of the allowed roles. */
export function RequireRoles({ roles = ["admin"], children }) {
  const router = useRouter();
  const { user, loading } = useAuthContext();
  const allowed = Boolean(user && roles.includes(user.role));

  useEffect(() => {
    if (!loading && user && !allowed) {
      router.replace("/dashboard");
    }
  }, [loading, user, allowed, router]);

  if (loading || !user || !allowed) {
    return <PageLoader />;
  }

  return children;
}

/** Super-admin only. */
export function AdminOnly({ children }) {
  return <RequireRoles roles={["admin"]}>{children}</RequireRoles>;
}
