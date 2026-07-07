const pool = require("../db");
const { getDateRange } = require("../utils/dateFilters");
const {
  efficiencyRate,
  taskVariance,
  projectVariance,
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
    matrix_rating: `${row.output_level} output / ${row.quality_level} quality`,
    total_tasks: row.total_tasks,
    completed_tasks: row.completed_tasks,
    active_tasks: row.active_tasks || 0,
    projects_worked_on: row.projects_worked_on || 0,
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
    COUNT(t.id) FILTER (WHERE t.status = 'in_progress')::int AS active_tasks,
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
  const [completedBar, activityLine, statusPie, hoursArea, efficiencyBar, priorityPie] =
    await Promise.all([
      pool.query(
        `SELECT COALESCE(tm.full_name, 'Unassigned') AS name,
          COUNT(*) FILTER (WHERE t.status = 'completed')::int AS value
        FROM tasks t
        LEFT JOIN team_members tm ON t.assigned_to = tm.id
        ${whereClause}
        GROUP BY tm.full_name
        ORDER BY value DESC`,
        values
      ),
      pool.query(
        `SELECT TO_CHAR(t.completed_at, 'YYYY-MM-DD') AS date,
          COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed,
          COALESCE(SUM(t.actual_hours), 0) AS hours
        FROM tasks t
        ${whereClause} AND t.completed_at IS NOT NULL
        GROUP BY TO_CHAR(t.completed_at, 'YYYY-MM-DD')
        ORDER BY date ASC`,
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
        `SELECT TO_CHAR(t.start_time, 'YYYY-MM-DD') AS date,
          COALESCE(SUM(t.actual_hours), 0) AS hours
        FROM tasks t
        ${whereClause} AND t.start_time IS NOT NULL
        GROUP BY TO_CHAR(t.start_time, 'YYYY-MM-DD')
        ORDER BY date ASC`,
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
      pool.query(
        `SELECT t.priority AS name, COUNT(*)::int AS value
        FROM tasks t
        ${whereClause}
        GROUP BY t.priority
        ORDER BY value DESC`,
        values
      ),
    ]);

  return {
    tasksCompletedBar: completedBar.rows.map((row) => ({
      name: row.name,
      value: row.value,
    })),
    activityLine: activityLine.rows.map((row) => ({
      date: row.date,
      completed: row.completed,
      hours: Number(row.hours),
    })),
    statusPie: statusPie.rows.map((row) => ({
      name: row.name,
      value: row.value,
    })),
    hoursArea: hoursArea.rows.map((row) => ({
      date: row.date,
      hours: Number(row.hours),
    })),
    efficiencyBar: efficiencyBar.rows.map((row) => ({
      name: row.name,
      efficiency: efficiencyRate(row.total_estimated, row.total_actual),
    })),
    priorityPie: priorityPie.rows.map((row) => ({
      name: row.name,
      value: row.value,
    })),
  };
};

const getTeamSummary = async (whereClause, values) => {
  const result = await pool.query(
    `SELECT
      COUNT(*)::int AS total_tasks,
      COUNT(*) FILTER (WHERE t.status = 'completed')::int AS completed_tasks,
      COUNT(*) FILTER (WHERE t.status = 'in_progress')::int AS active_tasks,
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
    active_tasks: row.active_tasks,
    on_hold_tasks: row.on_hold_tasks,
    total_estimated: totalEstimated,
    total_actual: totalActual,
    total_time_logged: totalActual,
    variance: taskVariance(totalActual, totalEstimated),
    efficiency_rate: efficiencyRate(totalEstimated, totalActual),
  };
};

const getTeamReports = async (query = {}) => {
  const { range, whereClause, values } = buildTaskFilters(query);
  const [summary, charts, developers] = await Promise.all([
    getTeamSummary(whereClause, values),
    buildChartData(whereClause, values),
    pool.query(
      `${DEVELOPER_SELECT}
      GROUP BY tm.id, tm.full_name, tm.title, tm.output_level, tm.quality_level
      ORDER BY completed_tasks DESC, tm.full_name ASC`,
      [range.startDate, range.endDate]
    ),
  ]);

  return {
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    summary,
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

  const [summary, charts, tasks, projectsWorked] = await Promise.all([
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
  ]);

  const member = memberResult.rows[0];

  return {
    member: {
      ...member,
      matrix_rating: `${member.output_level} output / ${member.quality_level} quality`,
    },
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    summary,
    charts,
    projects_worked_on: projectsWorked.rows,
    tasks: tasks.rows.map(mapTaskRow),
  };
};

const getProjectReports = async (query = {}) => {
  const range = getDateRange(query);
  const taskFilters = buildTaskFilters(query);

  const projectConditions = [];
  const projectValues = [...taskFilters.values];
  let projectIndex = taskFilters.values.length + 1;

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
      COUNT(t.id) FILTER (WHERE t.status = 'in_progress')::int AS active_tasks,
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

  const [summary, charts] = await Promise.all([
    getTeamSummary(taskFilters.whereClause, taskFilters.values),
    buildChartData(taskFilters.whereClause, taskFilters.values),
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
      const completedEstimated = Number(row.completed_estimated || 0);
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
        variance: projectVariance(completedActual, completedEstimated),
        efficiency_rate: efficiencyRate(completedEstimated, completedActual),
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

  const { range, whereClause, values } = buildTaskFilters({
    ...query,
    projectId: id,
  });

  const [summary, charts, tasks] = await Promise.all([
    getTeamSummary(whereClause, values),
    buildChartData(whereClause, values),
    pool.query(
      `${TASK_DETAIL_SELECT} ${whereClause} ORDER BY t.created_at DESC`,
      values
    ),
  ]);

  const row = projectResult.rows[0];
  const totalEstimated = Number(summary.total_estimated || 0);
  const totalActual = Number(summary.total_actual || 0);

  return {
    project: {
      id: row.id,
      name: row.name,
      status: row.status,
      quality: row.quality,
      start_date: row.start_date,
      lead_developer_name: row.lead_developer_name,
    },
    period: range.period,
    startDate: range.startDate,
    endDate: range.endDate,
    summary: {
      ...summary,
      variance: projectVariance(totalActual, totalEstimated),
      efficiency_rate: efficiencyRate(totalEstimated, totalActual),
    },
    charts,
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
          ...mapDeveloperRow({
            id: data.member.id,
            full_name: data.member.full_name,
            title: data.member.title,
            output_level: data.member.output_level,
            quality_level: data.member.quality_level,
            total_tasks: data.summary.total_tasks,
            completed_tasks: data.summary.completed_tasks,
            active_tasks: data.summary.active_tasks,
            projects_worked_on: data.projects_worked_on.length,
            total_estimated: data.summary.total_estimated,
            total_actual: data.summary.total_actual,
          }),
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
          total_tasks: data.summary.total_tasks,
          completed_tasks: data.summary.completed_tasks,
          active_tasks: data.summary.active_tasks,
          on_hold_tasks: data.summary.on_hold_tasks,
          total_estimated: data.summary.total_estimated,
          total_actual: data.summary.total_actual,
          variance: data.summary.variance,
          efficiency_rate: data.summary.efficiency_rate,
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
