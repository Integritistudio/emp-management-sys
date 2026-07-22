"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/PageLoader";

/** Redirects members away from admin-only routes. */
export function AdminOnly({ children }) {
  const router = useRouter();
  const { user, loading, isMember } = useAuthContext();

  useEffect(() => {
    if (!loading && isMember) {
      router.replace("/dashboard");
    }
  }, [loading, isMember, router]);

  if (loading || !user || isMember) {
    return <PageLoader />;
  }

  return children;
}
