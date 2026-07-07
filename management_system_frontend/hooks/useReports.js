"use client";

import { useCallback, useEffect, useState } from "react";
import { reportsApi } from "@/lib/reports";

export function useReports(type = "team", initialParams = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useState(initialParams);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      let response;
      const selectedId =
        type === "team" ? params.developerId : params.projectId;

      if (selectedId) {
        response =
          type === "team"
            ? await reportsApi.getTeamReportById(selectedId, params)
            : await reportsApi.getProjectReportById(selectedId, params);
      } else {
        response =
          type === "team"
            ? await reportsApi.getTeamReports(params)
            : await reportsApi.getProjectReports(params);
      }
      setData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [type, params]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportPdf = async () => {
    if (type === "team") {
      await reportsApi.exportTeamPdf(params);
    } else {
      await reportsApi.exportProjectPdf(params);
    }
  };

  return {
    data,
    loading,
    error,
    params,
    setParams,
    refresh: fetchReport,
    exportPdf,
  };
}
