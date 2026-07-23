const reportModel = require("../models/reportModel");
const { generateTeamPdf, generateProjectPdf } = require("../services/pdfService");
const {
  isMember,
  isProjectAdmin,
  memberId,
  canAccessProject,
  getAccessibleProjectIds,
} = require("../middleware/authMiddleware");

const getQuery = (req) => ({
  period: req.query.period,
  startDate: req.query.startDate,
  endDate: req.query.endDate,
  developerId: req.query.developerId,
  teamMemberId: req.query.teamMemberId,
  projectId: req.query.projectId,
  status: req.query.status,
});

const getBodyFilters = (body = {}) => ({
  period: body.period,
  startDate: body.startDate,
  endDate: body.endDate,
  developerId: body.developerId,
  teamMemberId: body.teamMemberId,
  projectId: body.projectId,
  status: body.status,
});

const withProjectScope = async (req, filters) => {
  if (!isProjectAdmin(req)) return filters;
  const ids = await getAccessibleProjectIds(req.user);
  if (filters.projectId) {
    if (!ids.includes(filters.projectId)) {
      return { ...filters, projectIds: [] };
    }
    return filters;
  }
  return { ...filters, projectIds: ids };
};

const forbidMember = (req, res) => {
  if (isMember(req)) {
    res.status(403).json({ message: "Admin access required" });
    return true;
  }
  return false;
};

const getTeamReports = async (req, res, next) => {
  try {
    if (isMember(req)) {
      const data = await reportModel.getTeamReportById(memberId(req), getQuery(req));
      if (!data) {
        return res.status(404).json({ message: "Team member not found" });
      }
      return res.json({ data });
    }
    const filters = await withProjectScope(req, getQuery(req));
    const data = await reportModel.getTeamReports(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const getMyReport = async (req, res, next) => {
  try {
    if (!isMember(req)) {
      return res.status(400).json({ message: "This endpoint is for team members only" });
    }
    const data = await reportModel.getTeamReportById(memberId(req), getQuery(req));
    if (!data) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const getTeamReportById = async (req, res, next) => {
  try {
    if (isMember(req) && req.params.id !== memberId(req)) {
      return res.status(403).json({ message: "You can only view your own report" });
    }
    const filters = await withProjectScope(req, getQuery(req));
    const data = await reportModel.getTeamReportById(req.params.id, filters);
    if (!data) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const getProjectReports = async (req, res, next) => {
  try {
    if (forbidMember(req, res)) return;
    const filters = await withProjectScope(req, getQuery(req));
    const data = await reportModel.getProjectReports(filters);
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const getProjectReportById = async (req, res, next) => {
  try {
    if (forbidMember(req, res)) return;
    if (isProjectAdmin(req) && !(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const data = await reportModel.getProjectReportById(
      req.params.id,
      getQuery(req)
    );
    if (!data) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const exportTeamPdf = async (req, res, next) => {
  try {
    let filters = getBodyFilters(req.body);

    if (isMember(req)) {
      filters.developerId = memberId(req);
      filters.teamMemberId = memberId(req);
    } else {
      filters = await withProjectScope(req, filters);
    }

    const reportData = await reportModel.getTeamExportData(filters);

    if (!reportData) {
      return res.status(404).json({ message: "Team member not found" });
    }

    const pdfBuffer = await generateTeamPdf(reportData);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="integriti-team-report.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

const exportProjectPdf = async (req, res, next) => {
  try {
    if (forbidMember(req, res)) return;

    let filters = getBodyFilters(req.body);
    filters = await withProjectScope(req, filters);

    if (
      isProjectAdmin(req) &&
      filters.projectId &&
      !(await canAccessProject(req.user, filters.projectId))
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const reportData = await reportModel.getProjectExportData(filters);

    if (!reportData) {
      return res.status(404).json({ message: "Project not found" });
    }

    const pdfBuffer = await generateProjectPdf(reportData);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="integriti-project-report.pdf"'
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeamReports,
  getMyReport,
  getTeamReportById,
  getProjectReports,
  getProjectReportById,
  exportTeamPdf,
  exportProjectPdf,
};
