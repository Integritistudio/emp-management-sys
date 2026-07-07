import { api } from "./api";

export const tasksApi = {
  getAll: (params) => api.get("/tasks", params),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  pause: (id) => api.post(`/tasks/${id}/pause`),
  resume: (id) => api.post(`/tasks/${id}/resume`),
  complete: (id, confirm = false, actualHours) =>
    api.post(`/tasks/${id}/complete`, {
      confirm,
      actual_hours: actualHours,
    }),
  bulkUpdate: (data) => api.patch("/tasks/bulk", data),
};
