const dashboardModel = require("../models/dashboardModel");
const {
  isMember,
  isProjectAdmin,
  memberId,
  getAccessibleProjectIds,
} = require("../middleware/authMiddleware");

const getQuery = async (req) => {
  const query = {
    period: req.query.period,
    startDate: req.query.startDate,
    endDate: req.query.endDate,
  };
  if (isProjectAdmin(req)) {
    query.projectIds = await getAccessibleProjectIds(req.user);
  }
  return query;
};

const getStats = async (req, res, next) => {
  try {
    if (isMember(req)) {
      const stats = await dashboardModel.getMemberStats(
        memberId(req),
        await getQuery(req)
      );
      return res.json({ data: stats });
    }
    const stats = await dashboardModel.getStats(await getQuery(req));
    res.json({ data: stats });
  } catch (error) {
    next(error);
  }
};

const getTeamPerformance = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const data = await dashboardModel.getTeamPerformance(await getQuery(req));
    res.json({ data, count: data.length });
  } catch (error) {
    next(error);
  }
};

const getWeekdayBreakdown = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    const data = await dashboardModel.getWeekdayBreakdown(await getQuery(req));
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

const getMatrix = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    // Project admins can view matrix; edit is blocked at team-member routes
    const data = await dashboardModel.getMatrix();
    res.json({ data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats,
  getTeamPerformance,
  getWeekdayBreakdown,
  getMatrix,
};
