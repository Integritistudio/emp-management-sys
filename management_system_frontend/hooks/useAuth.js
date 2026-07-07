"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth";

export function useAuth({ redirectTo = null, requireAuth = false } = {}) {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      setAdmin(data.admin);
      return data.admin;
    } catch {
      setAdmin(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const user = await checkAuth();

      if (!mounted) return;

      if (requireAuth && !user) {
        router.replace("/login");
      } else if (redirectTo && user) {
        router.replace(redirectTo);
      }

      setLoading(false);
    }

    init();

    return () => {
      mounted = false;
    };
  }, [checkAuth, requireAuth, redirectTo, router]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    setAdmin(data.admin);

    if (redirectTo) {
      router.replace(redirectTo);
    }

    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setAdmin(null);
    router.replace("/login");
  };

  return { admin, loading, login, logout, checkAuth };
}
