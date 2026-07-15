"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { tasksApi } from "@/lib/tasks";

function serializeParams(params = {}) {
  return JSON.stringify({
    search: params.search || "",
    projectId: params.projectId || "",
    developerId: params.developerId || "",
    status: params.status || "",
    complexity: params.complexity || "",
    priority: params.priority || "",
    startDate: params.startDate || "",
    endDate: params.endDate || "",
    sort: params.sort || "",
  });
}

export function useTasks(initialParams = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestIdRef = useRef(0);
  const paramsKey = serializeParams(initialParams);

  const fetchTasks = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError("");
    setLoading(true);

    try {
      const parsed = JSON.parse(paramsKey);
      const response = await tasksApi.getAll({
        search: parsed.search || undefined,
        projectId: parsed.projectId || undefined,
        developerId: parsed.developerId || undefined,
        status: parsed.status || undefined,
        complexity: parsed.complexity || undefined,
        priority: parsed.priority || undefined,
        startDate: parsed.startDate || undefined,
        endDate: parsed.endDate || undefined,
        sort: parsed.sort || undefined,
      });

      if (requestId !== requestIdRef.current) return;
      setTasks(response.data);
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
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    refresh: fetchTasks,
    createTask: async (data) => {
      await tasksApi.create(data);
      await fetchTasks();
    },
    updateTask: async (id, data) => {
      const response = await tasksApi.update(id, data);
      if (!response.requiresConfirmation) {
        await fetchTasks();
      }
      return response;
    },
    deleteTask: async (id) => {
      await tasksApi.delete(id);
      await fetchTasks();
    },
    pauseTask: async (id) => {
      await tasksApi.pause(id);
      await fetchTasks();
    },
    resumeTask: async (id) => {
      await tasksApi.resume(id);
      await fetchTasks();
    },
    completeTask: async (id, confirm = false, actualHours) => {
      const response = await tasksApi.complete(id, confirm, actualHours);
      if (!response.requiresConfirmation) {
        await fetchTasks();
      }
      return response;
    },
    bulkUpdate: async (data) => {
      const response = await tasksApi.bulkUpdate(data);
      await fetchTasks();
      return response;
    },
  };
}
