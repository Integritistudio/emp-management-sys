import { api } from "./api";

export const projectsApi = {
  getAll: (params) => api.get("/projects", params),
  getOptions: () => api.get("/projects/options"),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};
