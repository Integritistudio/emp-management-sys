const { addBusinessHours } = require("./businessHoursService");

const taskVariance = (actualHours, estimatedHours) => {
  const actual = Number(actualHours) || 0;
  const estimated = Number(estimatedHours) || 0;
  return Number((actual - estimated).toFixed(2));
};

const efficiencyRate = (estimatedHours, actualHours) => {
  const estimated = Number(estimatedHours) || 0;
  const actual = Number(actualHours) || 0;
  if (actual === 0) return estimated > 0 ? 0 : 100;
  return Number(((estimated / actual) * 100).toFixed(2));
};

const projectVariance = (totalActual, totalEstimated) =>
  taskVariance(totalActual, totalEstimated);

/** Deadline = start + estimated, counting only office hours (5 PM–2 AM). */
const addHoursToDate = (startDate, hours) => addBusinessHours(startDate, hours);

/** Wall-clock addition (pause/resume deadline extension). */
const addWallClockHours = (startDate, hours) => {
  const date = new Date(startDate);
  date.setTime(date.getTime() + Number(hours) * 60 * 60 * 1000);
  return date;
};

module.exports = {
  taskVariance,
  efficiencyRate,
  projectVariance,
  addHoursToDate,
  addWallClockHours,
};
