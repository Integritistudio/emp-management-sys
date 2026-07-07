import { api } from "./api";

export const teamApi = {
  getAll: (params) => api.get("/team-members", params),
  getTitles: () => api.get("/team-members/options/titles"),
  getById: (id) => api.get(`/team-members/${id}`),
  create: (data) => api.post("/team-members", data),
  update: (id, data) => api.put(`/team-members/${id}`, data),
  updateMatrixRating: (id, data) =>
    api.patch(`/team-members/${id}/matrix-rating`, data),
  delete: (id) => api.delete(`/team-members/${id}`),
};
