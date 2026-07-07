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
import { formatHours, formatLabel, formatPercent, getStatusVariant } from "@/lib/formatters";
import { Badge } from "@/components/ui/Badge";

export function TeamReportTable({ developers, tasks, loading, showDetail }) {
  if (loading) return <TableSkeleton rows={4} cols={7} />;

  if (showDetail && tasks?.length) {
    return (
      <Card className="mb-6" padding={false}>
        <div className="border-b border-border-light px-6 py-4">
          <h3 className="font-semibold text-text-primary">
            {reportsData.team.tasksTitle}
          </h3>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Task</TableHeaderCell>
              <TableHeaderCell>Project</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Est.</TableHeaderCell>
              <TableHeaderCell>Actual</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.project_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(task.status)}>
                    {formatLabel(task.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatHours(task.estimated_hours)}</TableCell>
                <TableCell>{formatHours(task.actual_hours)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  if (!developers?.length) {
    return (
      <EmptyState
        title={reportsData.team.empty}
        description=""
      />
    );
  }

  return (
    <Card className="mb-6" padding={false}>
      <div className="border-b border-border-light px-6 py-4">
        <h3 className="font-semibold text-text-primary">
          {reportsData.team.tableTitle}
        </h3>
      </div>
      <Table>
        <TableHead>
          <TableRow>
          <TableHeaderCell>{reportsData.team.name}</TableHeaderCell>
          <TableHeaderCell>{reportsData.team.completed}</TableHeaderCell>
          <TableHeaderCell>{reportsData.team.active}</TableHeaderCell>
          <TableHeaderCell>{reportsData.team.total}</TableHeaderCell>
          <TableHeaderCell>{reportsData.team.projects}</TableHeaderCell>
          <TableHeaderCell>{reportsData.team.efficiency}</TableHeaderCell>
          <TableHeaderCell>{reportsData.team.matrixRating}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {developers.map((dev) => (
            <TableRow key={dev.id}>
              <TableCell>
                <p className="font-medium">{dev.full_name}</p>
                <p className="text-xs text-text-muted">{dev.title}</p>
              </TableCell>
              <TableCell>{dev.completed_tasks}</TableCell>
              <TableCell>{dev.active_tasks}</TableCell>
              <TableCell>{dev.total_tasks}</TableCell>
              <TableCell>{dev.projects_worked_on}</TableCell>
              <TableCell>{formatPercent(dev.efficiency_rate)}</TableCell>
              <TableCell>{dev.matrix_rating}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

export function ProjectReportTable({ projects, tasks, loading, showDetail }) {
  if (loading) return <TableSkeleton rows={4} cols={6} />;

  if (showDetail && tasks?.length) {
    return (
      <Card className="mb-6" padding={false}>
        <div className="border-b border-border-light px-6 py-4">
          <h3 className="font-semibold text-text-primary">
            {reportsData.project.tasksTitle}
          </h3>
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Task</TableHeaderCell>
              <TableHeaderCell>Assignee</TableHeaderCell>
              <TableHeaderCell>Status</TableHeaderCell>
              <TableHeaderCell>Est.</TableHeaderCell>
              <TableHeaderCell>Actual</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.assigned_to_name || "—"}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(task.status)}>
                    {formatLabel(task.status)}
                  </Badge>
                </TableCell>
                <TableCell>{formatHours(task.estimated_hours)}</TableCell>
                <TableCell>{formatHours(task.actual_hours)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  }

  if (!projects?.length) {
    return (
      <EmptyState
        title={reportsData.project.empty}
        description=""
      />
    );
  }

  return (
    <Card className="mb-6" padding={false}>
      <div className="border-b border-border-light px-6 py-4">
        <h3 className="font-semibold text-text-primary">
          {reportsData.project.tableTitle}
        </h3>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>{reportsData.project.name}</TableHeaderCell>
            <TableHeaderCell>{reportsData.project.lead}</TableHeaderCell>
            <TableHeaderCell>{reportsData.project.completed}</TableHeaderCell>
            <TableHeaderCell>{reportsData.project.total}</TableHeaderCell>
            <TableHeaderCell>{reportsData.project.efficiency}</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell>{project.lead_developer_name || "—"}</TableCell>
              <TableCell>{project.completed_tasks}</TableCell>
              <TableCell>{project.total_tasks}</TableCell>
              <TableCell>{formatPercent(project.efficiency_rate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
