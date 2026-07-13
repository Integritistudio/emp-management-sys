"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { projectsApi } from "@/lib/projects";
import { fetchCached, invalidateCache } from "@/lib/requestCache";

function serializeParams(params = {}) {
  return JSON.stringify({
    search: params.search || "",
    status: params.status || "",
    quality: params.quality || "",
    leadDeveloperId: params.leadDeveloperId || "",
    startDate: params.startDate || "",
    endDate: params.endDate || "",
    sort: params.sort || "",
  });
}

export function useProjects(initialParams = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const paramsKey = serializeParams(initialParams);

  const fetchProjects = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError("");
    setLoading(true);

    try {
      const parsed = JSON.parse(paramsKey);
      const response = await fetchCached(
        `projects:${paramsKey}`,
        () =>
          projectsApi.getAll({
            search: parsed.search || undefined,
            status: parsed.status || undefined,
            quality: parsed.quality || undefined,
            leadDeveloperId: parsed.leadDeveloperId || undefined,
            startDate: parsed.startDate || undefined,
            endDate: parsed.endDate || undefined,
            sort: parsed.sort || undefined,
          })
      );

      if (requestId !== requestIdRef.current) return;
      setProjects(response.data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [paramsKey]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refresh: fetchProjects,
    createProject: async (data) => {
      await projectsApi.create(data);
      invalidateCache("projects:");
      await fetchProjects();
    },
    updateProject: async (id, data) => {
      await projectsApi.update(id, data);
      invalidateCache("projects:");
      await fetchProjects();
    },
    deleteProject: async (id) => {
      await projectsApi.delete(id);
      invalidateCache("projects:");
      await fetchProjects();
    },
  };
}

export function useProject(id) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);

  const fetchProject = useCallback(
    async ({ silent = false } = {}) => {
      if (!id) return;
      const requestId = ++requestIdRef.current;
      if (!silent) {
        setError("");
        setLoading(true);
      }

      try {
        const response = await projectsApi.getById(id);
        if (requestId !== requestIdRef.current) return;
        setProject(response.data);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err.message);
      } finally {
        if (requestId === requestIdRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [id]
  );

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    const onFocus = () => fetchProject({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    refresh: fetchProject,
    updateProject: async (data) => {
      await projectsApi.update(id, data);
      await fetchProject({ silent: true });
    },
    deleteProject: async () => {
      await projectsApi.delete(id);
    },
  };
}
