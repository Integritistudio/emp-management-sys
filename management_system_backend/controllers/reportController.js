const reportModel = require("../models/reportModel");
const { generateTeamPdf, generateProjectPdf } = require("../services/pdfService");

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

const getTeamReports = async (req, res, next) => {
  try {
    const data = await reportModel.getTeamReports(getQuery(req));
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const getTeamReportById = async (req, res, next) => {
  try {
    const data = await reportModel.getTeamReportById(req.params.id, getQuery(req));
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
    const data = await reportModel.getProjectReports(getQuery(req));
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const getProjectReportById = async (req, res, next) => {
  try {
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
    const filters = getBodyFilters(req.body);
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
    const filters = getBodyFilters(req.body);
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
  getTeamReportById,
  getProjectReports,
  getProjectReportById,
  exportTeamPdf,
  exportProjectPdf,
};
