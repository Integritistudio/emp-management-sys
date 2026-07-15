const pool = require("../db");
const { getDateRange } = require("../utils/dateFilters");
const {
  efficiencyRate,
  taskVariance,
  projectVariance,
  totalProjectTime,
  teamOutput,
  teamQualityLabel,
} = require("../services/calculationService");

const buildTaskFilters = (query = {}) => {
  const range = getDateRange(query);
  const conditions = ["t.created_at >= $1", "t.created_at <= $2"];
  const values = [range.startDate, range.endDate];
  let index = 3;

  const developerId = query.developerId || query.teamMemberId;
  if (developerId) {
    conditions.push(`t.assigned_to = $${index}`);
    values.push(developerId);
    index += 1;
  }
  if (query.projectId) {
    conditions.push(`t.project_id = $${index}`);
    values.push(query.projectId);
    index += 1;
  }
  if (query.status) {
    conditions.push(`t.status = $${index}`);
    values.push(query.status);
    index += 1;
  }

  return {
    range,
    whereClause: `WHERE ${conditions.join(" AND ")}`,
    values,
  };
};

const mapTaskRow = (row) => {
  const estimated = Number(row.estimated_hours);
  const actual = row.actual_hours !== null ? Number(row.actual_hours) : null;
  return {
    ...row,
    estimated_hours: estimated,
    actual_hours: actual,
    variance: actual !== null ? taskVariance(actual, estimated) : null,
    efficiency_rate:
      actual !== null ? efficiencyRate(estimated, actual) : null,
  };
};

const mapDeveloperRow = (row) => {
  const totalEstimated = Number(row.total_estimated || 0);
  const totalActual = Number(row.total_actual || 0);
  return {
    id: row.id,
    full_name: row.full_name,
    title: row.title,
    output_level: row.output_level,
    quality_level: row.quality_level,
    matrix_rating: teamQualityLabel(row.output_level, row.quality_level),
    total_tasks: Number(row.total_tasks || 0),
    completed_tasks: Number(row.completed_tasks || 0),
    team_output: teamOutput(row.completed_tasks),
    active_tasks: Number(row.active_tasks || 0),
    on_hold_tasks: Number(row.on_hold_tasks || 0),
    projects_worked_on: Number(row.projects_worked_on || 0),
    total_estimated: totalEstimated,
    total_actual: totalActual,
    total_time_logged: totalActual,
    variance: taskVariance(totalActual, totalEstimated),
    efficiency_rate: efficiencyRate(totalEstimated, totalActual),
  };
};

const DEVELOPER_SELECT = `
  SELECT tm.id, tm.full_name, tm.title, tm.output_level, tm.quality_level,
    COUNT(t.id)::int AS total_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
    COUNT(t.id) FILTER (WHERE t.status IN ('in_progress', 'paused'))::int AS active_tasks,
    COUNT(t.id) FILTER (WHERE t.status = 'on_hold')::int AS on_hold_tasks,
    COUNT(DISTINCT t.project_id)::int AS projects_worked_on,
    COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_estimated,
    COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_actual
  FROM team_members tm
  LEFT JOIN tasks t ON t.assigned_to = tm.id
    AND t.created_at >= $1 AND t.created_at <= $2
`;

const TASK_DETAIL_SELECT = `
  SELECT t.id, t.name, t.details, t.status, t.complexity, t.priority,
    t.estimated_hours, t.actual_hours, t.start_time, t.deadline, t.completed_at,
    p.name AS project_name, tm.full_name AS assigned_to_name
  FROM tasks t
  LEFT JOIN projects p ON t.project_id = p.id
  LEFT JOIN team_members tm ON t.assigned_to = tm.id
`;

const buildChartData = async (whereClause, values) => {
  const [
    completedBar,
    estVsActual,
    varianceBar,
    projectWorkload,
    assignedByDay,
    completedByDay,
    complexityPie,
    statusPie,
    efficiencyBar,
  ] = await Promise.all([
    pool.query(
      `SELECT COALESCE(tm.full_name, 'Unassigned') AS name,
        COUNT(*) FILTER (WHERE t.status = 'completed')::int AS value
      FROM tasks t
      LEFT JOIN team_members tm ON t.assigned_to = tm.id
      ${whereClause}
      GROUP BY tm.full_name
      HAVING COUNT(*) FILTER (WHERE t.status = 'completed') > 0
      ORDER BY value DESC`,
      values
    ),
    pool.query(
      `SELECT COALESCE(tm.full_name, 'Unassigned') AS name,
        COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS estimated,
        COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS actual
      FROM tasks t
      LEFT JOIN team_members tm ON t.assigned_to = tm.id
      ${whereClause}
      GROUP BY tm.full_name
      HAVING COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) > 0
         OR COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) > 0
      ORDER BY actual DESC`,
      values
    ),
    pool.query(
      `SELECT COALESCE(tm.full_name, 'Unassigned') AS name,
        COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_estimated,
        COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_actual
      FROM tasks t
      LEFT JOIN team_members tm ON t.assigned_to = tm.id
      ${whereClause}
      GROUP BY tm.full_name
      HAVING COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) > 0
      ORDER BY tm.full_name ASC`,
      values
    ),
    pool.query(
      `SELECT COALESCE(p.name, 'No Project') AS name,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
        COUNT(*) FILTER (WHERE t.status IN ('in_progress', 'paused'))::int AS active,
        COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS hours
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      ${whereClause}
      GROUP BY p.name
      ORDER BY total DESC`,
      values
    ),
    pool.query(
      `SELECT t.created_at::date AS day, COUNT(*)::int AS assigned
      FROM tasks t
      ${whereClause}
      GROUP BY t.created_at::date
      ORDER BY day ASC`,
      values
    ),
    pool.query(
      `SELECT t.completed_at::date AS day, COUNT(*)::int AS completed
      FROM tasks t
      ${whereClause} AND t.completed_at IS NOT NULL
      GROUP BY t.completed_at::date
      ORDER BY day ASC`,
      values
    ),
    pool.query(
      `SELECT t.complexity AS name, COUNT(*)::int AS value
      FROM tasks t
      ${whereClause}
      GROUP BY t.complexity
      ORDER BY value DESC`,
      values
    ),
    pool.query(
      `SELECT t.status AS name, COUNT(*)::int AS value
      FROM tasks t
      ${whereClause}
      GROUP BY t.status
      ORDER BY value DESC`,
      values
    ),
    pool.query(
      `SELECT COALESCE(tm.full_name, 'Unassigned') AS name,
        COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_estimated,
        COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_actual
      FROM tasks t
      LEFT JOIN team_members tm ON t.assigned_to = tm.id
      ${whereClause}
      GROUP BY tm.full_name
      ORDER BY tm.full_name ASC`,
      values
    ),
  ]);

  const toDayKey = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const assignedMap = new Map(
    assignedByDay.rows.map((row) => [toDayKey(row.day), Number(row.assigned)])
  );
  const completedMap = new Map(
    completedByDay.rows.map((row) => [toDayKey(row.day), Number(row.completed)])
  );

  const start = new Date(values[0]);
  const end = new Date(values[1]);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const weeklyTrend = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toDayKey(d);
    weeklyTrend.push({
      date: key,
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      assigned: assignedMap.get(key) || 0,
      completed: completedMap.get(key) || 0,
    });
  }

  return {
    tasksCompletedBar: completedBar.rows.map((row) => ({
      name: row.name,
      value: row.value,
    })),
    estimatedVsActual: estVsActual.rows.map((row) => ({
      name: row.name,
      estimated: Number(row.estimated),
      actual: Number(row.actual),
    })),
    varianceByDeveloper: varianceBar.rows.map((row) => ({
      name: row.name,
      variance: taskVariance(row.total_actual, row.total_estimated),
    })),
    projectWorkload: projectWorkload.rows.map((row) => ({
      name: row.name,
      total: row.total,
      completed: row.completed,
      active: row.active,
      hours: Number(row.hours),
    })),
    weeklyTrend,
    complexityBreakdown: complexityPie.rows.map((row) => ({
      name: row.name,
      value: row.value,
    })),
    statusPie: statusPie.rows.map((row) => ({
      name: row.name,
      value: row.value,
    })),
    efficiencyBar: efficiencyBar.rows.map((row) => ({
      name: row.name,
      efficiency: efficiencyRate(row.total_estimated, row.total_actual),
    })),
  };
};

const getTeamSummary = async (whereClause, values) => {
  const result = await pool.query(
    `SELECT
      COUNT(*)::int AS total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
      COUNT(*) FILTER (WHERE t.status IN ('in_progress', 'paused'))::int AS active_tasks,
      COUNT(*) FILTER (WHERE t.status = 'on_hold')::int AS on_hold_tasks,
      COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_estimated,
      COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS total_actual
    FROM tasks t
    ${whereClause}`,
    values
  );

  const row = result.rows[0];
  const totalEstimated = Number(row.total_estimated || 0);
  const totalActual = Number(row.total_actual || 0);

  return {
    total_tasks: row.total_tasks,
    completed_tasks: row.completed_tasks,
    team_output: teamOutput(row.completed_tasks),
    active_tasks: row.active_tasks,
    on_hold_tasks: row.on_hold_tasks,
    total_estimated: totalEstimated,
    total_actual: totalActual,
    total_time_logged: totalActual,
    variance: taskVariance(totalActual, totalEstimated),
    efficiency_rate: efficiencyRate(totalEstimated, totalActual),
  };
};

const getMatrixSummary = async () => {
  const result = await pool.query(
    `SELECT
      (tm.output_level || ' output / ' || tm.quality_level || ' quality') AS rating,
      COUNT(*)::int AS count
     FROM team_members tm
     GROUP BY tm.output_level, tm.quality_level
     ORDER BY count DESC, rating ASC`
  );

  const ratings = result.rows.map((row) => ({
    rating: row.rating,
    count: row.count,
  }));
  const top = ratings[0] || null;

  return {
    matrix_rating: top ? top.rating : null,
    matrix_distribution: ratings,
    matrix_rated_count: ratings.reduce((sum, r) => sum + r.count, 0),
  };
};

const getProjectSummaryMetrics = async (query = {}) => {
  const range = getDateRange(query);
  const values = [range.startDate, range.endDate];
  const conditions = [];
  let index = 3;

  if (query.projectId) {
    conditions.push(`p.id = $${index}`);
    values.push(query.projectId);
    index += 1;
  }
  if (query.status) {
    // project-tab status filter targets project status
    conditions.push(`p.status = $${index}`);
    values.push(query.status);
    index += 1;
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query(
    `SELECT
      COUNT(DISTINCT p.id)::int AS total_projects,
      COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active')::int AS active_projects,
      COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'completed')::int AS completed_projects,
      COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'on_hold')::int AS on_hold_projects,
      COUNT(t.id)::int AS total_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
      COUNT(t.id) FILTER (WHERE t.status IN ('in_progress', 'paused'))::int AS active_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'on_hold')::int AS on_hold_tasks,
      COALESCE(SUM(t.estimated_hours), 0) AS total_estimated,
      COALESCE(SUM(t.actual_hours), 0) AS total_actual,
      COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_estimated,
      COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_actual
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
      AND t.created_at >= $1 AND t.created_at <= $2
    ${where}`,
    values
  );

  const row = result.rows[0];
  const completedActual = Number(row.completed_actual || 0);
  const totalEstimated = Number(row.total_estimated || 0);
  const totalActual = Number(row.total_actual || 0);

  return {
    total_projects: row.total_projects,
    active_projects: row.active_projects,
    completed_projects: row.completed_projects,
    on_hold_projects: row.on_hold_projects,
    total_tasks: row.total_tasks,
    completed_tasks: row.completed_tasks,
    active_tasks: row.active_tasks,
    on_hold_tasks: row.on_hold_tasks,
    total_estimated: totalEstimated,
    total_actual: totalActual,
    total_time_logged: totalProjectTime(completedActual),
    // PDF §21.2 / §21.4 — project variance & efficiency use all linked task totals
    variance: projectVariance(totalActual, totalEstimated),
    efficiency_rate: efficiencyRate(totalEstimated, totalActual),
  };
};

const getTeamReports = async (query = {}) => {
  const { range, whereClause, values } = buildTaskFilters(query);
  const [summary, charts, developers, matrix] = await Promise.all([
    getTeamSummary(whereClause, values),
    buildChartData(whereClause, values),
    pool.query(
      `${DEVELOPER_SELECT}
      GROUP BY tm.id, tm.full_name, tm.title, tm.output_level, tm.quality_level
      ORDER BY completed_tasks DESC, tm.full_name ASC`,
      [range.startDate, range.endDate]
    ),
    getMatrixSummary(),
  ]);

  return {
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    summary: {
      ...summary,
      ...matrix,
    },
    charts,
    developers: developers.rows.map(mapDeveloperRow),
  };
};

const getTeamReportById = async (id, query = {}) => {
  const { range, whereClause, values } = buildTaskFilters({
    ...query,
    developerId: id,
  });

  const memberResult = await pool.query(
    `SELECT id, full_name, title, email, output_level, quality_level
     FROM team_members WHERE id = $1`,
    [id]
  );
  if (!memberResult.rows[0]) return null;

  const [summary, charts, tasks, projectsWorked, developerAgg] = await Promise.all([
    getTeamSummary(whereClause, values),
    buildChartData(whereClause, values),
    pool.query(
      `${TASK_DETAIL_SELECT} ${whereClause} ORDER BY t.created_at DESC`,
      values
    ),
    pool.query(
      `SELECT DISTINCT p.id, p.name
       FROM tasks t
       INNER JOIN projects p ON t.project_id = p.id
       ${whereClause}
       ORDER BY p.name ASC`,
      values
    ),
    pool.query(
      `${DEVELOPER_SELECT} WHERE tm.id = $3
      GROUP BY tm.id, tm.full_name, tm.title, tm.output_level, tm.quality_level`,
      [range.startDate, range.endDate, id]
    ),
  ]);

  const member = memberResult.rows[0];
  const developerMetrics = developerAgg.rows[0]
    ? mapDeveloperRow(developerAgg.rows[0])
    : mapDeveloperRow({
        ...member,
        total_tasks: summary.total_tasks,
        completed_tasks: summary.completed_tasks,
        active_tasks: summary.active_tasks,
        on_hold_tasks: summary.on_hold_tasks,
        projects_worked_on: projectsWorked.rows.length,
        total_estimated: summary.total_estimated,
        total_actual: summary.total_actual,
      });

  return {
    member: {
      ...member,
      matrix_rating: teamQualityLabel(member.output_level, member.quality_level),
    },
    developer: developerMetrics,
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    summary: {
      ...summary,
      matrix_rating: teamQualityLabel(member.output_level, member.quality_level),
    },
    charts,
    projects_worked_on: projectsWorked.rows,
    tasks: tasks.rows.map(mapTaskRow),
  };
};

const getProjectReports = async (query = {}) => {
  const range = getDateRange(query);
  const taskQuery = { ...query };
  // Project status filter is applied on projects, not tasks
  if (query.status) {
    delete taskQuery.status;
  }
  const taskFilters = buildTaskFilters(taskQuery);

  const projectConditions = [];
  const projectValues = [range.startDate, range.endDate];
  let projectIndex = 3;

  if (query.projectId) {
    projectConditions.push(`p.id = $${projectIndex}`);
    projectValues.push(query.projectId);
    projectIndex += 1;
  }
  if (query.status) {
    projectConditions.push(`p.status = $${projectIndex}`);
    projectValues.push(query.status);
    projectIndex += 1;
  }

  const projectWhere = projectConditions.length
    ? `WHERE ${projectConditions.join(" AND ")}`
    : "";

  const projectsResult = await pool.query(
    `SELECT p.id, p.name, p.status, p.quality, p.start_date,
      ld.full_name AS lead_developer_name,
      COUNT(t.id)::int AS total_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
      COUNT(t.id) FILTER (WHERE t.status IN ('in_progress', 'paused'))::int AS active_tasks,
      COUNT(t.id) FILTER (WHERE t.status = 'on_hold')::int AS on_hold_tasks,
      COALESCE(SUM(t.estimated_hours), 0) AS total_estimated,
      COALESCE(SUM(t.actual_hours), 0) AS total_actual,
      COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_estimated,
      COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_actual
    FROM projects p
    LEFT JOIN team_members ld ON p.lead_developer_id = ld.id
    LEFT JOIN tasks t ON t.project_id = p.id
      AND t.created_at >= $1 AND t.created_at <= $2
    ${projectWhere}
    GROUP BY p.id, p.name, p.status, p.quality, p.start_date, ld.full_name
    ORDER BY p.name ASC`,
    projectValues
  );

  // Charts for project overview: scope to tasks on matching projects when status filtered
  let chartWhere = taskFilters.whereClause;
  let chartValues = taskFilters.values;
  if (query.status && !query.projectId) {
    chartWhere = `${taskFilters.whereClause} AND t.project_id IN (
      SELECT id FROM projects WHERE status = $${taskFilters.values.length + 1}
    )`;
    chartValues = [...taskFilters.values, query.status];
  }

  const [summary, charts] = await Promise.all([
    getProjectSummaryMetrics(query),
    buildChartData(chartWhere, chartValues),
  ]);

  return {
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    summary,
    charts,
    projects: projectsResult.rows.map((row) => {
      const totalEstimated = Number(row.total_estimated || 0);
      const totalActual = Number(row.total_actual || 0);
      const completedActual = Number(row.completed_actual || 0);
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        quality: row.quality,
        start_date: row.start_date,
        lead_developer_name: row.lead_developer_name,
        total_tasks: row.total_tasks,
        completed_tasks: row.completed_tasks,
        active_tasks: row.active_tasks,
        on_hold_tasks: row.on_hold_tasks,
        total_estimated: totalEstimated,
        total_actual: totalActual,
        total_project_time: totalProjectTime(completedActual),
        variance: projectVariance(totalActual, totalEstimated),
        efficiency_rate: efficiencyRate(totalEstimated, totalActual),
      };
    }),
  };
};

const getProjectReportById = async (id, query = {}) => {
  const projectResult = await pool.query(
    `SELECT p.*, ld.full_name AS lead_developer_name
     FROM projects p
     LEFT JOIN team_members ld ON p.lead_developer_id = ld.id
     WHERE p.id = $1`,
    [id]
  );
  if (!projectResult.rows[0]) return null;

  const taskQuery = { ...query, projectId: id };
  delete taskQuery.status; // detail view: don't confuse project status with task status

  const { range, whereClause, values } = buildTaskFilters(taskQuery);

  const [summary, charts, tasks, projectAgg, assignedDevelopers] = await Promise.all([
    getTeamSummary(whereClause, values),
    buildChartData(whereClause, values),
    pool.query(
      `${TASK_DETAIL_SELECT} ${whereClause} ORDER BY t.created_at DESC`,
      values
    ),
    pool.query(
      `SELECT
        COUNT(t.id)::int AS total_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
        COUNT(t.id) FILTER (WHERE t.status IN ('in_progress', 'paused'))::int AS active_tasks,
        COUNT(t.id) FILTER (WHERE t.status = 'on_hold')::int AS on_hold_tasks,
        COALESCE(SUM(t.estimated_hours), 0) AS total_estimated,
        COALESCE(SUM(t.actual_hours), 0) AS total_actual,
        COALESCE(SUM(t.estimated_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_estimated,
        COALESCE(SUM(t.actual_hours) FILTER (WHERE t.status = 'completed'), 0) AS completed_actual
       FROM tasks t
       ${whereClause}`,
      values
    ),
    pool.query(
      `SELECT tm.id, tm.full_name, tm.title,
        COUNT(t.id)::int AS task_count
       FROM tasks t
       INNER JOIN team_members tm ON t.assigned_to = tm.id
       ${whereClause}
       GROUP BY tm.id, tm.full_name, tm.title
       ORDER BY tm.full_name ASC`,
      values
    ),
  ]);

  const row = projectResult.rows[0];
  const agg = projectAgg.rows[0] || {};
  const completedEstimated = Number(agg.completed_estimated || 0);
  const completedActual = Number(agg.completed_actual || 0);
  const totalEstimated = Number(agg.total_estimated || 0);
  const totalActual = Number(agg.total_actual || 0);

  return {
    project: {
      id: row.id,
      name: row.name,
      status: row.status,
      quality: row.quality,
      start_date: row.start_date,
      lead_developer_name: row.lead_developer_name,
      total_tasks: Number(agg.total_tasks || 0),
      completed_tasks: Number(agg.completed_tasks || 0),
      active_tasks: Number(agg.active_tasks || 0),
      on_hold_tasks: Number(agg.on_hold_tasks || 0),
      total_estimated: totalEstimated,
      total_actual: totalActual,
      total_project_time: totalProjectTime(completedActual),
      variance: projectVariance(totalActual, totalEstimated),
      efficiency_rate: efficiencyRate(totalEstimated, totalActual),
    },
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    summary: {
      ...summary,
      total_estimated: totalEstimated,
      total_actual: totalActual,
      total_time_logged: totalProjectTime(completedActual),
      variance: projectVariance(totalActual, totalEstimated),
      efficiency_rate: efficiencyRate(totalEstimated, totalActual),
      total_projects: 1,
      active_projects: row.status === "active" ? 1 : 0,
      completed_projects: row.status === "completed" ? 1 : 0,
      on_hold_projects: row.status === "on_hold" ? 1 : 0,
    },
    charts,
    assigned_developers: assignedDevelopers.rows.map((dev) => ({
      id: dev.id,
      full_name: dev.full_name,
      title: dev.title,
      task_count: Number(dev.task_count || 0),
    })),
    tasks: tasks.rows.map(mapTaskRow),
  };
};

const getTeamExportData = async (query = {}) => {
  const developerId = query.developerId || query.teamMemberId;

  if (developerId) {
    const data = await getTeamReportById(developerId, query);
    if (!data) return null;
    return {
      ...data,
      developers: [
        {
          ...data.developer,
          tasks: data.tasks,
        },
      ],
    };
  }

  const overview = await getTeamReports(query);
  const developersWithTasks = await Promise.all(
    overview.developers.map(async (dev) => {
      const detail = await getTeamReportById(dev.id, query);
      return { ...dev, tasks: detail?.tasks || [] };
    })
  );

  return { ...overview, developers: developersWithTasks };
};

const getProjectExportData = async (query = {}) => {
  if (query.projectId) {
    const data = await getProjectReportById(query.projectId, query);
    if (!data) return null;
    return {
      ...data,
      projects: [
        {
          ...data.project,
          tasks: data.tasks,
        },
      ],
    };
  }

  const overview = await getProjectReports(query);
  const projectsWithTasks = await Promise.all(
    overview.projects.map(async (project) => {
      const detail = await getProjectReportById(project.id, query);
      return {
        ...project,
        tasks: detail?.tasks || [],
      };
    })
  );

  return { ...overview, projects: projectsWithTasks };
};

module.exports = {
  getTeamReports,
  getTeamReportById,
  getProjectReports,
  getProjectReportById,
  getTeamExportData,
  getProjectExportData,
};
