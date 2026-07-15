"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { reportsApi } from "@/lib/reports";

function serializeParams(params = {}) {
  return JSON.stringify({
    period: params.period || "week",
    startDate: params.startDate || "",
    endDate: params.endDate || "",
    developerId: params.developerId || "",
    projectId: params.projectId || "",
    status: params.status || "",
  });
}

export function useReports(type = "team", initialParams = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const paramsKey = serializeParams(initialParams);

  const fetchReport = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError("");

    try {
      const params = JSON.parse(paramsKey);
      const query = {
        period: params.period || undefined,
        startDate: params.startDate || undefined,
        endDate: params.endDate || undefined,
        developerId: params.developerId || undefined,
        projectId: params.projectId || undefined,
        status: params.status || undefined,
      };

      const selectedId =
        type === "team" ? query.developerId : query.projectId;

      let response;
      if (selectedId) {
        response =
          type === "team"
            ? await reportsApi.getTeamReportById(selectedId, query)
            : await reportsApi.getProjectReportById(selectedId, query);
      } else {
        response =
          type === "team"
            ? await reportsApi.getTeamReports(query)
            : await reportsApi.getProjectReports(query);
      }

      if (requestId !== requestIdRef.current) return;
      setData(response.data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [type, paramsKey]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  return {
    data,
    loading,
    error,
    refresh: fetchReport,
  };
}
