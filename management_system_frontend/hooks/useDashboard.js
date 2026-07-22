"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { dashboardApi } from "@/lib/dashboard";

function serializeParams(params = {}) {
  return JSON.stringify({
    period: params.period || "week",
    startDate: params.startDate || "",
    endDate: params.endDate || "",
  });
}

export function useDashboard(initialParams = {}, { memberMode = false } = {}) {
  const [stats, setStats] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [weekdayBreakdown, setWeekdayBreakdown] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const paramsKey = serializeParams(initialParams);

  const fetchDashboard = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const parsed = JSON.parse(paramsKey);
      const query = {
        period: parsed.period || "week",
        startDate: parsed.startDate || undefined,
        endDate: parsed.endDate || undefined,
      };

      if (memberMode) {
        const statsRes = await dashboardApi.getStats(query);
        if (requestId !== requestIdRef.current) return;
        setStats(statsRes.data);
        setTeamPerformance([]);
        setWeekdayBreakdown(null);
        setMatrix(null);
      } else {
        const [statsRes, teamRes, weekdayRes, matrixRes] = await Promise.all([
          dashboardApi.getStats(query),
          dashboardApi.getTeamPerformance(query),
          dashboardApi.getWeekdayBreakdown(query),
          dashboardApi.getMatrix(),
        ]);

        if (requestId !== requestIdRef.current) return;

        setStats(statsRes.data);
        setTeamPerformance(teamRes.data || []);
        setWeekdayBreakdown(weekdayRes.data || null);
        setMatrix(matrixRes.data);
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || "Failed to load dashboard");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [paramsKey, memberMode]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    stats,
    teamPerformance,
    weekdayBreakdown,
    matrix,
    loading,
    error,
    refresh: fetchDashboard,
  };
}
