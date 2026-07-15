const { addBusinessHours } = require("./businessHoursService");

/** PDF §20 — visual alert thresholds (hours). */
const NEAR_DEADLINE_HOURS = 2;
const HIGH_VARIANCE_HOURS = 2;

/**
 * PDF §21.1 Task Variance
 * Task Variance = Actual Time − Estimated Time
 */
const taskVariance = (actualHours, estimatedHours) => {
  const actual = Number(actualHours) || 0;
  const estimated = Number(estimatedHours) || 0;
  return Number((actual - estimated).toFixed(2));
};

/**
 * PDF §21.2 Project Variance
 * Project Variance = Total Actual Task Time − Total Estimated Task Time
 */
const projectVariance = (totalActual, totalEstimated) =>
  taskVariance(totalActual, totalEstimated);

/**
 * PDF §21.3 Developer Efficiency Rate
 * PDF §21.4 Project Efficiency Rate
 * Efficiency Rate = (Total Estimated Time / Total Actual Time) × 100
 *
 * For developers, pass sums over completed tasks only (actuals exist there).
 * For projects, pass totals across linked tasks (see project aggregates).
 */
const efficiencyRate = (estimatedHours, actualHours) => {
  const estimated = Number(estimatedHours) || 0;
  const actual = Number(actualHours) || 0;
  if (actual === 0) return estimated > 0 ? 0 : 100;
  return Number(((estimated / actual) * 100).toFixed(2));
};

/**
 * PDF §21.5 Total Project Time
 * Total Project Time = Sum of actual time of all completed tasks linked to the project
 */
const totalProjectTime = (completedActualHours) =>
  Number((Number(completedActualHours) || 0).toFixed(2));

/**
 * PDF §21.6 Team Output
 * Team Output = Number of completed tasks within the selected timeframe
 */
const teamOutput = (completedTaskCount) =>
  Math.max(0, Number(completedTaskCount) || 0);

/**
 * PDF §21.7 Team Quality — manually selected by admin (output_level / quality_level).
 * Helper formats the matrix label for API consumers.
 */
const teamQualityLabel = (outputLevel, qualityLevel) => {
  const output = outputLevel || "medium";
  const quality = qualityLevel || "medium";
  return `${output} output / ${quality} quality`;
};

const isHighVariance = (varianceHours) =>
  varianceHours !== null &&
  varianceHours !== undefined &&
  Number(varianceHours) > HIGH_VARIANCE_HOURS;

/** Deadline = start + estimated, counting only office hours (5 PM–2 AM). */
const addHoursToDate = (startDate, hours) => addBusinessHours(startDate, hours);

/** Wall-clock addition (pause/resume deadline extension). */
const addWallClockHours = (startDate, hours) => {
  const date = new Date(startDate);
  date.setTime(date.getTime() + Number(hours) * 60 * 60 * 1000);
  return date;
};

module.exports = {
  NEAR_DEADLINE_HOURS,
  HIGH_VARIANCE_HOURS,
  taskVariance,
  projectVariance,
  efficiencyRate,
  totalProjectTime,
  teamOutput,
  teamQualityLabel,
  isHighVariance,
  addHoursToDate,
  addWallClockHours,
};
