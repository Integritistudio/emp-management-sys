import { api } from "./api";

export const dashboardApi = {
  getStats: (params) => api.get("/dashboard/stats", params),
  getTeamPerformance: (params) => api.get("/dashboard/team-performance", params),
  getWeekdayBreakdown: (params) => api.get("/dashboard/weekday-breakdown", params),
  getMatrix: () => api.get("/dashboard/matrix"),
};
