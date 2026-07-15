"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { reportsData } from "@/data/reports";
import {
  formatHours,
  formatLabel,
  formatPercent,
  getStatusVariant,
} from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";
import { PaginatedTable } from "@/components/ui/PaginatedTable";
import { getTaskRowClass } from "@/lib/taskAlerts";
import { TaskAlertBadges } from "@/components/tasks/TaskAlertBadges";

function MetricStrip({ items }) {
  return (
    <div className="grid gap-3 border-b border-border-light px-6 py-4 sm:grid-cols-2 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label}>
          <p className="metric-label">{item.label}</p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {item.value ?? "—"}
          </p>
        </div>
      ))}
    </div>
  );
}

function TaskBreakdownTable({ tasks, assigneeColumn = false }) {
  if (!tasks?.length) {
    return (
      <div className="px-6 py-8 text-sm text-text-muted">No tasks in this period.</div>
    );
  }

  return (
    <div className="px-0">
      <PaginatedTable items={tasks} className="px-0">
        {(pageTasks) => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Task</TableHeaderCell>
          {assigneeColumn ? (
            <TableHeaderCell>Assignee</TableHeaderCell>
          ) : (
            <TableHeaderCell>Project</TableHeaderCell>
          )}
          <TableHeaderCell>Complexity</TableHeaderCell>
          <TableHeaderCell>Status</TableHeaderCell>
          <TableHeaderCell>Est.</TableHeaderCell>
          <TableHeaderCell>Actual</TableHeaderCell>
          <TableHeaderCell>Variance</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {pageTasks.map((task) => (
          <TableRow key={task.id} className={getTaskRowClass(task)}>
            <TableCell className="font-medium">
              <div>{task.name}</div>
              <TaskAlertBadges task={task} />
            </TableCell>
            <TableCell>
              {assigneeColumn
                ? task.assigned_to_name || "—"
                : task.project_name || "—"}
            </TableCell>
            <TableCell>{formatLabel(task.complexity)}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(task.status)}>
                {formatLabel(task.status)}
              </Badge>
            </TableCell>
            <TableCell>{formatHours(task.estimated_hours)}</TableCell>
            <TableCell>{formatHours(task.actual_hours)}</TableCell>
            <TableCell>{formatHours(task.variance)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
        )}
      </PaginatedTable>
    </div>
  );
}

export function DeveloperDetailPanel({
  member,
  developer,
  projects,
  tasks,
  loading,
  hideMetricStrip = false,
}) {
  if (loading) return <TableSkeleton rows={5} cols={7} />;
  if (!member && !developer) return null;

  const metrics = developer || {};
  const title = member?.full_name || metrics.full_name || "Developer";

  return (
    <div className="mb-6">
      {!hideMetricStrip ? (
        <Card className="mb-6" padding={false}>
          <div className="border-b border-border-light px-6 py-4">
            <h3 className="font-semibold text-text-primary">
              {reportsData.detail.developerTitle}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              {title}
              {member?.title ? ` · ${member.title}` : null}
            </p>
          </div>
          <MetricStrip
            items={[
              {
                label: reportsData.detail.totalAssigned,
                value: metrics.total_tasks ?? 0,
              },
              {
                label: reportsData.detail.tasksCompleted,
                value: metrics.completed_tasks ?? 0,
              },
              {
                label: reportsData.detail.activeTasks,
                value: metrics.active_tasks ?? 0,
              },
              {
                label: reportsData.detail.onHoldTasks,
                value: metrics.on_hold_tasks ?? 0,
              },
              {
                label: reportsData.detail.timeLogged,
                value: formatHours(metrics.total_time_logged ?? metrics.total_actual),
              },
              {
                label: reportsData.detail.estimated,
                value: formatHours(metrics.total_estimated),
              },
              {
                label: reportsData.detail.actual,
                value: formatHours(metrics.total_actual),
              },
              {
                label: reportsData.detail.variance,
                value: formatHours(metrics.variance),
              },
              {
                label: reportsData.detail.efficiency,
                value: formatPercent(metrics.efficiency_rate),
              },
              {
                label: reportsData.detail.matrixRating,
                value: member?.matrix_rating || metrics.matrix_rating || "—",
              },
            ]}
          />
        </Card>
      ) : null}

      {projects?.length ? (
        <Card className="mb-6" padding={false}>
          <div className="px-6 py-3">
            <p className="metric-label mb-2">{reportsData.detail.projectsWorkedOn}</p>
            <div className="flex flex-wrap gap-2">
              {projects.map((project) => (
                <Badge key={project.id} variant="primary">
                  {project.name}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      ) : null}

      <h2 className="mb-4 text-tagline font-semibold text-text-primary">
        {reportsData.team.tasksTitle}
      </h2>
      <Card padding={false}>
        <TaskBreakdownTable tasks={tasks} />
      </Card>
    </div>
  );
}

export function ProjectDetailPanel({
  project,
  tasks,
  loading,
  hideMetricStrip = false,
}) {
  if (loading) return <TableSkeleton rows={5} cols={7} />;
  if (!project) return null;

  return (
    <div className="mb-6">
      {!hideMetricStrip ? (
        <Card className="mb-6" padding={false}>
          <div className="border-b border-border-light px-6 py-4">
            <h3 className="font-semibold text-text-primary">
              {reportsData.detail.projectTitle}
            </h3>
            <p className="mt-1 text-sm text-text-secondary">{project.name}</p>
          </div>

          <MetricStrip
            items={[
              {
                label: reportsData.detail.lead,
                value: project.lead_developer_name || "—",
              },
              {
                label: reportsData.detail.status,
                value: formatLabel(project.status),
              },
              {
                label: reportsData.detail.quality,
                value: formatLabel(project.quality),
              },
              {
                label: reportsData.detail.totalAssigned,
                value: project.total_tasks ?? 0,
              },
              {
                label: reportsData.detail.tasksCompleted,
                value: project.completed_tasks ?? 0,
              },
              {
                label: reportsData.detail.activeTasks,
                value: project.active_tasks ?? 0,
              },
              {
                label: reportsData.detail.onHoldTasks,
                value: project.on_hold_tasks ?? 0,
              },
              {
                label: reportsData.detail.estimated,
                value: formatHours(project.total_estimated),
              },
              {
                label: reportsData.detail.actual,
                value: formatHours(project.total_actual),
              },
              {
                label: reportsData.detail.variance,
                value: formatHours(project.variance),
              },
              {
                label: reportsData.detail.efficiency,
                value: formatPercent(project.efficiency_rate),
              },
            ]}
          />
        </Card>
      ) : null}

      <h2 className="mb-4 text-tagline font-semibold text-text-primary">
        {reportsData.project.tasksTitle}
      </h2>
      <Card padding={false}>
        <TaskBreakdownTable tasks={tasks} assigneeColumn />
      </Card>
    </div>
  );
}

export function TeamReportTable({ developers, loading }) {
  if (loading) return <TableSkeleton rows={4} cols={10} />;

  if (!developers?.length) {
    return <EmptyState title={reportsData.team.empty} description="" />;
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-tagline font-semibold text-text-primary">
        {reportsData.team.tableTitle}
      </h2>
      <Card padding={false}>
        <PaginatedTable items={developers} className="p-0">
          {(pageDevelopers) => (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{reportsData.team.name}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.total}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.completed}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.active}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.onHold}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.projects}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.estimated}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.actual}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.variance}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.efficiency}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.team.matrixRating}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageDevelopers.map((dev) => (
                  <TableRow key={dev.id}>
                    <TableCell>
                      <p className="font-medium">{dev.full_name}</p>
                      <p className="text-xs text-text-muted">{dev.title}</p>
                    </TableCell>
                    <TableCell>{dev.total_tasks}</TableCell>
                    <TableCell>{dev.completed_tasks}</TableCell>
                    <TableCell>{dev.active_tasks}</TableCell>
                    <TableCell>{dev.on_hold_tasks}</TableCell>
                    <TableCell>{dev.projects_worked_on}</TableCell>
                    <TableCell>{formatHours(dev.total_estimated)}</TableCell>
                    <TableCell>{formatHours(dev.total_actual)}</TableCell>
                    <TableCell>{formatHours(dev.variance)}</TableCell>
                    <TableCell>{formatPercent(dev.efficiency_rate)}</TableCell>
                    <TableCell className="text-xs">{dev.matrix_rating}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </PaginatedTable>
      </Card>
    </div>
  );
}

export function ProjectReportTable({ projects, loading }) {
  if (loading) return <TableSkeleton rows={4} cols={10} />;

  if (!projects?.length) {
    return <EmptyState title={reportsData.project.empty} description="" />;
  }

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-tagline font-semibold text-text-primary">
        {reportsData.project.tableTitle}
      </h2>
      <Card padding={false}>
        <PaginatedTable items={projects}>
          {(pageProjects) => (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{reportsData.project.name}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.lead}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.status}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.quality}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.total}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.completed}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.active}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.onHold}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.estimated}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.actual}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.variance}</TableHeaderCell>
                  <TableHeaderCell>{reportsData.project.efficiency}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>{project.lead_developer_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(project.status)}>
                        {formatLabel(project.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatLabel(project.quality)}</TableCell>
                    <TableCell>{project.total_tasks}</TableCell>
                    <TableCell>{project.completed_tasks}</TableCell>
                    <TableCell>{project.active_tasks}</TableCell>
                    <TableCell>{project.on_hold_tasks}</TableCell>
                    <TableCell>{formatHours(project.total_estimated)}</TableCell>
                    <TableCell>{formatHours(project.total_actual)}</TableCell>
                    <TableCell>{formatHours(project.variance)}</TableCell>
                    <TableCell>{formatPercent(project.efficiency_rate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </PaginatedTable>
      </Card>
    </div>
  );
}
