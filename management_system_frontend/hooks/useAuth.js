"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children, requireAuth = false, redirectTo = null }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      const nextUser = data.user || data.admin;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const current = await checkAuth();
      if (!mounted) return;

      if (requireAuth && !current) {
        router.replace("/login");
      } else if (redirectTo && current) {
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
    const nextUser = data.user || data.admin;
    setUser(nextUser);
    if (redirectTo) {
      router.replace(redirectTo);
    }
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    router.replace("/login");
  };

  const value = useMemo(
    () => ({
      user,
      admin: user,
      loading,
      login,
      logout,
      checkAuth,
      isAdmin: user?.role === "admin",
      isProjectAdmin: user?.role === "project_admin",
      isMember: user?.role === "member",
    }),
    [user, loading, checkAuth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}

/** Standalone hook for pages outside AuthProvider (e.g. login). */
export function useAuth({ redirectTo = null, requireAuth = false } = {}) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const data = await authApi.me();
      const nextUser = data.user || data.admin;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const current = await checkAuth();
      if (!mounted) return;

      if (requireAuth && !current) {
        router.replace("/login");
      } else if (redirectTo && current) {
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
    const nextUser = data.user || data.admin;
    setUser(nextUser);
    if (redirectTo) {
      router.replace(redirectTo);
    }
    return data;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
    router.replace("/login");
  };

  return {
    user,
    admin: user,
    loading,
    login,
    logout,
    checkAuth,
    isAdmin: user?.role === "admin",
    isProjectAdmin: user?.role === "project_admin",
    isMember: user?.role === "member",
  };
}
