"use client";

import { useCallback, useEffect, useState } from "react";
import { projectsApi } from "@/lib/projects";

export function useProjects(initialParams = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useState(initialParams);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await projectsApi.getAll(params);
      setProjects(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    params,
    setParams,
    refresh: fetchProjects,
    createProject: async (data) => {
      await projectsApi.create(data);
      await fetchProjects();
    },
    updateProject: async (id, data) => {
      await projectsApi.update(id, data);
      await fetchProjects();
    },
    deleteProject: async (id) => {
      await projectsApi.delete(id);
      await fetchProjects();
    },
  };
}

export function useProject(id) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const response = await projectsApi.getById(id);
      setProject(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return { project, loading, error, refresh: fetchProject };
}
