const SORT_DIRECTIONS = ["asc", "desc"];

const parseSort = (sortParam, allowedColumns, defaultSort) => {
  if (!sortParam) return defaultSort;

  const [column, direction = "asc"] = sortParam.split(":");
  const dir = SORT_DIRECTIONS.includes(direction.toLowerCase())
    ? direction.toLowerCase()
    : "asc";

  if (!allowedColumns[column]) return defaultSort;

  return `${allowedColumns[column]} ${dir.toUpperCase()}`;
};

const buildFilters = (filters, config) => {
  const conditions = [];
  const values = [];
  let index = config.startIndex || 1;

  Object.entries(config.fields).forEach(([key, fieldConfig]) => {
    const value = filters[key];
    if (value === undefined || value === null || value === "") return;

    if (fieldConfig.type === "ilike") {
      conditions.push(`${fieldConfig.column} ILIKE $${index}`);
      values.push(`%${value}%`);
      index += 1;
    } else if (fieldConfig.type === "exact") {
      conditions.push(`${fieldConfig.column} = $${index}`);
      values.push(value);
      index += 1;
    } else if (fieldConfig.type === "dateFrom") {
      conditions.push(`${fieldConfig.column} >= $${index}`);
      values.push(value);
      index += 1;
    } else if (fieldConfig.type === "dateTo") {
      conditions.push(`${fieldConfig.column} <= $${index}`);
      values.push(value);
      index += 1;
    }
  });

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values, nextIndex: index };
};

module.exports = {
  parseSort,
  buildFilters,
};
