import { api } from "./api";
import { reportsData } from "@/data/reports";

export const reportsApi = {
  getTeamReports: (params) => api.get("/reports/team", params),
  getMyReport: (params) => api.get("/reports/me", params),
  getTeamReportById: (id, params) => api.get(`/reports/team/${id}`, params),
  getProjectReports: (params) => api.get("/reports/project", params),
  getProjectReportById: (id, params) => api.get(`/reports/project/${id}`, params),
  exportTeamPdf: (body) =>
    api.downloadPost(
      "/reports/export/team-pdf",
      body,
      reportsData.export.teamFilename
    ),
  exportProjectPdf: (body) =>
    api.downloadPost(
      "/reports/export/project-pdf",
      body,
      reportsData.export.projectFilename
    ),
};
