"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { projectsData } from "@/data/projects";
import { tasksData } from "@/data/tasks";
import { useProject } from "@/hooks/useProjects";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import {
  formatDate,
  formatDateTime,
  formatHours,
  formatLabel,
  formatPercent,
  getQualityVariant,
  getStatusVariant,
} from "@/lib/formatters";

export function ProjectDetailContent({ projectId }) {
  const { project, loading, error } = useProject(projectId);

  if (loading) {
    return (
      <div>
        <TableSkeleton rows={4} cols={4} />
        <div className="mt-6">
          <TableSkeleton rows={5} cols={8} />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
        {error || "Project not found"}
      </div>
    );
  }

  const stats = [
    { label: projectsData.detail.totalTasks, value: project.total_tasks },
    { label: projectsData.detail.completedTasks, value: project.completed_tasks },
    { label: projectsData.detail.activeTasks, value: project.active_tasks },
    { label: projectsData.detail.onHoldTasks, value: project.on_hold_tasks },
    {
      label: projectsData.detail.totalProjectTime,
      value: formatHours(project.total_project_time),
    },
    {
      label: projectsData.detail.estimated,
      value: formatHours(project.total_estimated_time),
    },
    {
      label: projectsData.detail.actual,
      value: formatHours(project.total_actual_time),
    },
    {
      label: projectsData.detail.variance,
      value: formatHours(project.project_variance),
    },
    {
      label: projectsData.detail.efficiency,
      value: formatPercent(project.project_efficiency_rate),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4 px-0">
            <ArrowLeft className="h-4 w-4" />
            {projectsData.detailBack}
          </Button>
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="heading-page">{project.name}</h1>
            <p className="mt-1 text-sm text-text-secondary">
              Lead: {project.lead_developer_name || "—"} · Started{" "}
              {formatDate(project.start_date)}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getQualityVariant(project.quality)}>
              {formatLabel(project.quality)}
            </Badge>
            <Badge variant={getStatusVariant(project.status)}>
              {formatLabel(project.status)}
            </Badge>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {projectsData.detail.statsTitle}
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="!p-4">
            <p className="text-xs text-text-muted">{stat.label}</p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{stat.value}</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {projectsData.detail.tasksTitle}
      </h2>

      {!project.tasks || project.tasks.length === 0 ? (
        <EmptyState
          title={tasksData.emptyTitle}
          description={projectsData.detail.noTasks}
        />
      ) : (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{tasksData.table.name}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.assignee}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.complexity}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.priority}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.startTime}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.deadline}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.estimated}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.actual}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.status}</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {project.tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.assigned_to_name || "—"}</TableCell>
                <TableCell>{formatLabel(task.complexity)}</TableCell>
                <TableCell>{formatLabel(task.priority)}</TableCell>
                <TableCell>{formatDateTime(task.start_time)}</TableCell>
                <TableCell>{formatDateTime(task.deadline)}</TableCell>
                <TableCell>{formatHours(task.estimated_hours)}</TableCell>
                <TableCell>{formatHours(task.actual_hours)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(task.status)}>
                    {formatLabel(task.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
