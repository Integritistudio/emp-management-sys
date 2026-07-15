const pool = require("../db");
const { getDateRange } = require("../utils/dateFilters");
const {
  efficiencyRate,
  teamOutput,
} = require("../services/calculationService");

/** Tasks whose work falls in the selected dashboard period. */
const buildTaskDateFilter = (range, alias = "t") => ({
  clause: `AND ${alias}.created_at >= $1 AND ${alias}.created_at <= $2`,
  values: [range.startDate, range.endDate],
});

/**
 * PDF §6.1 — Dashboard analytics cards
 * Metrics respect week / month / custom filters (§6.2).
 */
const getStats = async (query = {}) => {
  const range = getDateRange(query);
  const { clause, values } = buildTaskDateFilter(range);

  const [taskResult, projectResult, employeeResult] = await Promise.all([
    pool.query(
      `SELECT
        COUNT(*)::int AS total_tasks,
        COUNT(*) FILTER (WHERE status = 'in_progress')::int AS active_tasks,
        COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tasks,
        COUNT(*) FILTER (WHERE status = 'on_hold')::int AS on_hold_tasks
      FROM tasks t
      WHERE 1=1 ${clause}`,
      values
    ),
    // Active projects that started in range OR had task activity in range
    pool.query(
      `SELECT COUNT(DISTINCT p.id)::int AS active_projects
       FROM projects p
       WHERE p.status = 'active'
         AND (
           (p.start_date IS NOT NULL AND p.start_date >= $1::date AND p.start_date <= $2::date)
           OR EXISTS (
             SELECT 1 FROM tasks t
             WHERE t.project_id = p.id
               AND t.created_at >= $1 AND t.created_at <= $2
           )
         )`,
      values
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
    completedTasks: row.completed_tasks,
    onHoldTasks: row.on_hold_tasks,
    activeProjects: projectResult.rows[0].active_projects,
    engagedEmployees: employeeResult.rows[0].engaged_employees,
  };
};

/**
 * PDF §6.3–6.5 — Team Performance Table
 * Columns: name, assigned, completed, active, time logged, task-volume bar %.
 */
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
      COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_estimated,
      COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_actual
    FROM team_members tm
    LEFT JOIN tasks t ON t.assigned_to = tm.id
      AND t.created_at >= $1 AND t.created_at <= $2
    GROUP BY tm.id, tm.full_name, tm.title
    ORDER BY total_tasks DESC, tm.full_name ASC`,
    [range.startDate, range.endDate]
  );

  // PDF §6.4 — horizontal bar reflects task volume (assigned tasks)
  const maxAssigned = Math.max(
    ...result.rows.map((r) => Number(r.total_tasks)),
    1
  );

  return result.rows.map((row) => {
    const totalEstimated = Number(row.total_estimated || 0);
    const totalActual = Number(row.total_actual || 0);

    return {
      id: row.id,
      full_name: row.full_name,
      title: row.title,
      total_tasks: row.total_tasks,
      completed_tasks: row.completed_tasks,
      team_output: teamOutput(row.completed_tasks),
      active_tasks: row.active_tasks,
      total_time_logged: totalActual,
      total_estimated: totalEstimated,
      total_actual: totalActual,
      efficiency_rate: efficiencyRate(totalEstimated, totalActual),
      performance_percent: Math.round((row.total_tasks / maxAssigned) * 100),
    };
  });
};

/**
 * Build every calendar day key (YYYY-MM-DD) between start and end inclusive.
 */
const eachDayKey = (startDate, endDate) => {
  const days = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const toDayKey = (value) => {
  const date = new Date(value);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatDayLabel = (dayKey) => {
  const date = new Date(`${dayKey}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

/**
 * PDF §6.6 — activity breakdown
 * - week: Monday–Friday buckets (spec)
 * - month / custom: every calendar day in the selected range
 */
const getWeekdayBreakdown = async (query = {}) => {
  const range = getDateRange(query);
  const useDaily = range.period === "month" || range.period === "custom";

  if (useDaily) {
    const dayKeys = eachDayKey(range.startDate, range.endDate);
    // Prefer completed_at; fall back when older/manual completes left it null
    const activityDay = `COALESCE(t.completed_at, t.updated_at, t.created_at)`;

    const [perDeveloper, totals] = await Promise.all([
      pool.query(
        `SELECT
          tm.id AS developer_id,
          tm.full_name AS developer_name,
          (${activityDay})::date AS day,
          COUNT(*)::int AS completed_count,
          COALESCE(SUM(t.actual_hours), 0) AS total_hours
        FROM tasks t
        INNER JOIN team_members tm ON t.assigned_to = tm.id
        WHERE t.status = 'completed'
          AND ${activityDay} >= $1
          AND ${activityDay} <= $2
        GROUP BY tm.id, tm.full_name, (${activityDay})::date
        ORDER BY tm.full_name ASC, day ASC`,
        [range.startDate, range.endDate]
      ),
      pool.query(
        `SELECT
          (COALESCE(completed_at, updated_at, created_at))::date AS day,
          COUNT(*)::int AS completed_count,
          COALESCE(SUM(actual_hours), 0) AS total_hours
        FROM tasks
        WHERE status = 'completed'
          AND COALESCE(completed_at, updated_at, created_at) >= $1
          AND COALESCE(completed_at, updated_at, created_at) <= $2
        GROUP BY (COALESCE(completed_at, updated_at, created_at))::date
        ORDER BY day ASC`,
        [range.startDate, range.endDate]
      ),
    ]);

    const totalsMap = Object.fromEntries(
      totals.rows.map((row) => [
        toDayKey(row.day),
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
      developerMap[row.developer_id].days[toDayKey(row.day)] = {
        completed_count: row.completed_count,
        total_hours: Number(row.total_hours),
      };
    });

    const fillDays = (source = {}) =>
      dayKeys.map((key, index) => ({
        day: formatDayLabel(key),
        day_key: key,
        day_index: index + 1,
        completed_count: source[key]?.completed_count || 0,
        total_hours: Number(source[key]?.total_hours || 0),
      }));

    return {
      period: range.period,
      mode: "daily",
      startDate: range.startDate,
      endDate: range.endDate,
      totals: fillDays(totalsMap),
      developers: Object.values(developerMap).map((dev) => ({
        id: dev.id,
        full_name: dev.full_name,
        days: fillDays(dev.days),
      })),
    };
  }

  // Week mode — Monday–Friday buckets (PDF §6.6)
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const [perDeveloper, totals] = await Promise.all([
    pool.query(
      `SELECT
        tm.id AS developer_id,
        tm.full_name AS developer_name,
        EXTRACT(ISODOW FROM COALESCE(t.completed_at, t.updated_at, t.created_at))::int AS day_index,
        TO_CHAR(COALESCE(t.completed_at, t.updated_at, t.created_at), 'Day') AS day_name,
        COUNT(*)::int AS completed_count,
        COALESCE(SUM(t.actual_hours), 0) AS total_hours
      FROM tasks t
      INNER JOIN team_members tm ON t.assigned_to = tm.id
      WHERE t.status = 'completed'
        AND COALESCE(t.completed_at, t.updated_at, t.created_at) >= $1
        AND COALESCE(t.completed_at, t.updated_at, t.created_at) <= $2
        AND EXTRACT(ISODOW FROM COALESCE(t.completed_at, t.updated_at, t.created_at)) BETWEEN 1 AND 5
      GROUP BY tm.id, tm.full_name, day_index, day_name
      ORDER BY tm.full_name ASC, day_index ASC`,
      [range.startDate, range.endDate]
    ),
    pool.query(
      `SELECT
        EXTRACT(ISODOW FROM COALESCE(completed_at, updated_at, created_at))::int AS day_index,
        TO_CHAR(COALESCE(completed_at, updated_at, created_at), 'Day') AS day_name,
        COUNT(*)::int AS completed_count,
        COALESCE(SUM(actual_hours), 0) AS total_hours
      FROM tasks
      WHERE status = 'completed'
        AND COALESCE(completed_at, updated_at, created_at) >= $1
        AND COALESCE(completed_at, updated_at, created_at) <= $2
        AND EXTRACT(ISODOW FROM COALESCE(completed_at, updated_at, created_at)) BETWEEN 1 AND 5
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
      day_key: day.toLowerCase(),
      day_index: index + 1,
      completed_count: dev.days[index + 1]?.completed_count || 0,
      total_hours: Number(dev.days[index + 1]?.total_hours || 0),
    })),
  }));

  return {
    period: range.period,
    mode: "weekday",
    startDate: range.startDate,
    endDate: range.endDate,
    totals: weekdays.map((day, index) => ({
      day,
      day_key: day.toLowerCase(),
      day_index: index + 1,
      completed_count: totalsMap[index + 1]?.completed_count || 0,
      total_hours: Number(totalsMap[index + 1]?.total_hours || 0),
    })),
    developers,
  };
};

/**
 * PDF §7 — 3×3 Team Performance Matrix (manual output × quality)
 */
const getMatrix = async () => {
  const levels = ["low", "medium", "high"];
  const result = await pool.query(
    `SELECT id, full_name, title, output_level, quality_level
     FROM team_members
     ORDER BY full_name ASC`
  );

  const grid = levels.map((output) =>
    levels.map((quality) => {
      const members = result.rows
        .filter(
          (m) => m.output_level === output && m.quality_level === quality
        )
        .map((m) => ({
          id: m.id,
          full_name: m.full_name,
          title: m.title,
          output_level: m.output_level,
          quality_level: m.quality_level,
        }));

      return {
        output_level: output,
        quality_level: quality,
        members,
        count: members.length,
      };
    })
  );

  return {
    levels,
    // Display order: High output at top (PDF layout)
    display_output_levels: ["high", "medium", "low"],
    display_quality_levels: ["low", "medium", "high"],
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
