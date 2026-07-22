const dashboardModel = require("../models/dashboardModel");
const { isMember, memberId, requireAdmin } = require("../middleware/authMiddleware");

const getQuery = (req) => ({
  period: req.query.period,
  startDate: req.query.startDate,
  endDate: req.query.endDate,
});

const getStats = async (req, res, next) => {
  try {
    if (isMember(req)) {
      const stats = await dashboardModel.getMemberStats(memberId(req), getQuery(req));
      return res.json({ data: stats });
    }
    const stats = await dashboardModel.getStats(getQuery(req));
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
    const data = await dashboardModel.getTeamPerformance(getQuery(req));
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
    const data = await dashboardModel.getWeekdayBreakdown(getQuery(req));
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
  requireAdmin,
};
