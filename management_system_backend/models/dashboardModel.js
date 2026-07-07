const pool = require("../db");
const { getDateRange } = require("../utils/dateFilters");
const { efficiencyRate } = require("../services/calculationService");

const buildTaskDateFilter = (range, alias = "t") => {
  return {
    clause: `AND ${alias}.created_at >= $1 AND ${alias}.created_at <= $2`,
    values: [range.startDate, range.endDate],
  };
};

const getStats = async (query = {}) => {
  const range = getDateRange(query);
  const { clause, values } = buildTaskDateFilter(range);

  const [taskResult, projectResult, employeeResult] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS active_tasks,
        COUNT(*) FILTER (WHERE status = 'on_hold')::int AS on_hold_tasks
      FROM tasks t
      WHERE 1=1 ${clause}`,
      values
    ),
    pool.query(
      `SELECT COUNT(*)::int AS active_projects
       FROM projects
       WHERE status = 'active'`
    ),
    pool.query(
      `SELECT COUNT(DISTINCT t.assigned_to)::int AS engaged_employees
       FROM tasks t
       WHERE t.assigned_to IS NOT NULL
         AND t.status IN ('in_progress', 'paused')
         ${clause}`,
      values
    ),
  ]);

  const row = taskResult.rows[0];

  return {
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    totalTasks: row.total_tasks,
    activeTasks: row.active_tasks,
    onHoldTasks: row.on_hold_tasks,
    activeProjects: projectResult.rows[0].active_projects,
    engagedEmployees: employeeResult.rows[0].engaged_employees,
  };
};

const getTeamPerformance = async (query = {}) => {
  const range = getDateRange(query);

  const result = await pool.query(
    `SELECT
      tm.id,
      tm.full_name,
      tm.title,
      COUNT(t.id)::int AS total_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'in_progress')::int AS active_tasks,
      COALESCE(SUM(t.estimated_hours), 0) AS total_estimated,
      COALESCE(SUM(t.actual_hours), 0) AS total_actual
    FROM team_members tm
    LEFT JOIN tasks t ON t.assigned_to = tm.id
      AND t.created_at >= $1 AND t.created_at <= $2
    GROUP BY tm.id, tm.full_name, tm.title
    ORDER BY total_tasks DESC, tm.full_name ASC`,
    [range.startDate, range.endDate]
  );

  const maxTasks = Math.max(...result.rows.map((r) => Number(r.total_tasks)), 1);

  return result.rows.map((row) => {
    const totalEstimated = Number(row.total_estimated || 0);
    const totalActual = Number(row.total_actual || 0);
    const efficiency = efficiencyRate(totalEstimated, totalActual);

    return {
      id: row.id,
      full_name: row.full_name,
      title: row.title,
      total_tasks: row.total_tasks,
      completed_tasks: row.completed_tasks,
      active_tasks: row.active_tasks,
      total_time_logged: totalActual,
      total_estimated: totalEstimated,
      total_actual: totalActual,
      efficiency_rate: efficiency,
      performance_percent: Math.round((row.total_tasks / maxTasks) * 100),
    };
  });
};

const getWeekdayBreakdown = async (query = {}) => {
  const range = getDateRange(query);
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const [perDeveloper, totals] = await Promise.all([
    pool.query(
      `SELECT
        tm.id AS developer_id,
        tm.full_name AS developer_name,
        EXTRACT(ISODOW FROM t.completed_at)::int AS day_index,
        TO_CHAR(t.completed_at, 'Day') AS day_name,
        COUNT(*)::int AS completed_count,
        COALESCE(SUM(t.actual_hours), 0) AS total_hours
      FROM tasks t
      INNER JOIN team_members tm ON t.assigned_to = tm.id
      WHERE t.status = 'completed'
        AND t.completed_at >= $1
        AND t.completed_at <= $2
        AND EXTRACT(ISODOW FROM t.completed_at) BETWEEN 1 AND 5
      GROUP BY tm.id, tm.full_name, day_index, day_name
      ORDER BY tm.full_name ASC, day_index ASC`,
      [range.startDate, range.endDate]
    ),
    pool.query(
      `SELECT
        EXTRACT(ISODOW FROM completed_at)::int AS day_index,
        TO_CHAR(completed_at, 'Day') AS day_name,
        COUNT(*)::int AS completed_count,
        COALESCE(SUM(actual_hours), 0) AS total_hours
      FROM tasks
      WHERE status = 'completed'
        AND completed_at >= $1
        AND completed_at <= $2
        AND EXTRACT(ISODOW FROM completed_at) BETWEEN 1 AND 5
      GROUP BY day_index, day_name
      ORDER BY day_index`,
      [range.startDate, range.endDate]
    ),
  ]);

  const totalsMap = Object.fromEntries(
    totals.rows.map((row) => [
      row.day_index,
      {
        completed_count: row.completed_count,
        total_hours: Number(row.total_hours),
      },
    ])
  );

  const developerMap = {};
  perDeveloper.rows.forEach((row) => {
    if (!developerMap[row.developer_id]) {
      developerMap[row.developer_id] = {
        id: row.developer_id,
        full_name: row.developer_name,
        days: {},
      };
    }
    developerMap[row.developer_id].days[row.day_index] = {
      day: row.day_name.trim(),
      completed_count: row.completed_count,
      total_hours: Number(row.total_hours),
    };
  });

  const developers = Object.values(developerMap).map((dev) => ({
    ...dev,
    days: weekdays.map((day, index) => ({
      day,
      day_index: index + 1,
      completed_count: dev.days[index + 1]?.completed_count || 0,
      total_hours: dev.days[index + 1]?.total_hours || 0,
    })),
  }));

  return {
    totals: weekdays.map((day, index) => ({
      day,
      day_index: index + 1,
      completed_count: totalsMap[index + 1]?.completed_count || 0,
      total_hours: totalsMap[index + 1]?.total_hours || 0,
    })),
    developers,
  };
};

const getMatrix = async () => {
  const levels = ["low", "medium", "high"];
  const result = await pool.query(
    `SELECT id, full_name, title, output_level, quality_level
     FROM team_members
     ORDER BY full_name ASC`
  );

  const grid = levels.map((output) =>
    levels.map((quality) => ({
      output_level: output,
      quality_level: quality,
      members: result.rows
        .filter(
          (m) => m.output_level === output && m.quality_level === quality
        )
        .map((m) => ({
          id: m.id,
          full_name: m.full_name,
          title: m.title,
        })),
      count: result.rows.filter(
        (m) => m.output_level === output && m.quality_level === quality
      ).length,
    }))
  );

  return {
    levels,
    grid: grid.flat(),
    total_members: result.rows.length,
  };
};

module.exports = {
  getStats,
  getTeamPerformance,
  getWeekdayBreakdown,
  getMatrix,
};
