"use client";

import { useCallback, useEffect, useState } from "react";
import { tasksApi } from "@/lib/tasks";

export function useTasks(initialParams = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [params, setParams] = useState(initialParams);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await tasksApi.getAll(params);
      setTasks(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    params,
    setParams,
    refresh: fetchTasks,
    createTask: async (data) => {
      await tasksApi.create(data);
      await fetchTasks();
    },
    updateTask: async (id, data) => {
      await tasksApi.update(id, data);
      await fetchTasks();
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
