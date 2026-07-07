const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return startOfDay(d);
};

const getDateRange = (query = {}) => {
  const now = new Date();
  const period = query.period || "week";

  if (period === "custom" && query.startDate && query.endDate) {
    return {
      startDate: startOfDay(query.startDate),
      endDate: endOfDay(query.endDate),
      period,
    };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = endOfDay(
      new Date(now.getFullYear(), now.getMonth() + 1, 0)
    );
    return { startDate: start, endDate: end, period };
  }

  const start = getMonday(now);
  const end = endOfDay(new Date(start));
  end.setDate(start.getDate() + 6);
  return { startDate: start, endDate: end, period: "week" };
};

module.exports = {
  getDateRange,
  startOfDay,
  endOfDay,
};
