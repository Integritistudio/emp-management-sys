import { api } from "./api";

export const projectManagersApi = {
  getAll: () => api.get("/project-managers"),
  getOptions: () => api.get("/project-managers/options"),
  getById: (id) => api.get(`/project-managers/${id}`),
  create: (data) => api.post("/project-managers", data),
  update: (id, data) => api.put(`/project-managers/${id}`, data),
  delete: (id) => api.delete(`/project-managers/${id}`),
};
