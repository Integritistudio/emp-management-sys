"use client";

import { useCallback, useEffect, useState } from "react";
import { dashboardApi } from "@/lib/dashboard";

export function useDashboard(initialParams = {}) {
  const [stats, setStats] = useState(null);
  const [teamPerformance, setTeamPerformance] = useState([]);
  const [weekdayBreakdown, setWeekdayBreakdown] = useState([]);
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useState(initialParams);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, teamRes, weekdayRes, matrixRes] = await Promise.all([
        dashboardApi.getStats(params),
        dashboardApi.getTeamPerformance(params),
        dashboardApi.getWeekdayBreakdown(params),
        dashboardApi.getMatrix(),
      ]);
      setStats(statsRes.data);
      setTeamPerformance(teamRes.data);
      setWeekdayBreakdown(weekdayRes.data);
      setMatrix(matrixRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

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
    params,
    setParams,
    refresh: fetchDashboard,
  };
}
