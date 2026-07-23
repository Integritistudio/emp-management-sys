"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { projectsData } from "@/data/projects";
import { tasksData } from "@/data/tasks";
import { useProject } from "@/hooks/useProjects";
import { useTeam } from "@/hooks/useTeam";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ProjectForm } from "./ProjectForm";
import { ProjectCollaborators } from "./ProjectCollaborators";
import { commonData } from "@/data/common";
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
import { getTaskRowClass } from "@/lib/taskAlerts";
import { TaskAlertBadges } from "@/components/tasks/TaskAlertBadges";
import { PaginatedTable } from "@/components/ui/PaginatedTable";

export function ProjectDetailContent({ projectId }) {
  const router = useRouter();
  const { members: developers } = useTeam();
  const { project, loading, error, updateProject, deleteProject, refresh } =
    useProject(projectId);
  const [modalOpen, setModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  if (loading) {
    return (
      <div>
        <TableSkeleton rows={4} cols={4} />
        <div className="mt-6">
          <TableSkeleton rows={5} cols={12} />
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

  const metadata = [
    {
      label: projectsData.detail.name,
      value: project.name,
    },
    {
      label: projectsData.detail.lead,
      value: project.lead_developer_name || "—",
    },
    {
      label: projectsData.detail.startDate,
      value: formatDate(project.start_date),
    },
    {
      label: projectsData.detail.quality,
      value: (
        <Badge variant={getQualityVariant(project.quality)}>
          {formatLabel(project.quality)}
        </Badge>
      ),
    },
    {
      label: projectsData.detail.status,
      value: (
        <Badge variant={getStatusVariant(project.status)}>
          {formatLabel(project.status)}
        </Badge>
      ),
    },
  ];

  // PDF 8.5 + 8.7 — overview metrics in specification order
  const stats = [
    { label: projectsData.detail.totalTasks, value: project.total_tasks },
    { label: projectsData.detail.completedTasks, value: project.completed_tasks },
    { label: projectsData.detail.activeTasks, value: project.active_tasks },
    { label: projectsData.detail.onHoldTasks, value: project.on_hold_tasks },
    {
      label: projectsData.detail.estimated,
      value: formatHours(project.total_estimated_time),
    },
    {
      label: projectsData.detail.actual,
      value: formatHours(project.total_actual_time),
    },
    {
      label: projectsData.detail.totalProjectTime,
      value: formatHours(project.total_project_time),
    },
    {
      label: projectsData.detail.activeTaskTime,
      hint: projectsData.detail.activeTaskTimeHint,
      value: formatHours(project.active_task_time ?? 0),
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

  const handleSubmit = async (data) => {
    await updateProject(data);
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteProject();
      router.push("/projects");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4 px-0">
            <ArrowLeft className="h-4 w-4" />
            {projectsData.detailBack}
          </Button>
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="heading-page">{project.name}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tooltip content={commonData.actions.edit}>
              <Button
                variant="secondary"
                onClick={() => setModalOpen(true)}
                aria-label={commonData.actions.edit}
              >
                <Pencil className="h-4 w-4 text-accent" />
                {projectsData.detail.editButton}
              </Button>
            </Tooltip>
            <Tooltip content={commonData.actions.delete}>
              <Button
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                aria-label={commonData.actions.delete}
              >
                <Trash2 className="h-4 w-4" />
                {commonData.delete.projectTitle}
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {projectsData.detail.infoTitle}
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metadata.map((item) => (
          <Card key={item.label} className="!p-4">
            <p className="text-xs text-text-muted">{item.label}</p>
            <div className="mt-1 text-sm font-medium text-text-primary">
              {item.value}
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {projectsData.detail.statsTitle}
      </h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="!p-4">
            <p className="text-xs text-text-muted">
              {stat.label}
              {stat.hint ? (
                <span className="font-normal text-text-muted/80"> {stat.hint}</span>
              ) : null}
            </p>
            <p className="mt-1 text-xl font-semibold text-text-primary">{stat.value}</p>
          </Card>
        ))}
      </div>

      <ProjectCollaborators
        projectId={project.id}
        ownerId={project.owner_id}
        initialCollaborators={project.collaborators || []}
        onChanged={refresh}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-text-primary">
          {projectsData.detail.tasksTitle}
        </h2>
        <Link href={`/tasks?projectId=${project.id}&create=1`}>
          <Button variant="secondary" type="button">
            <Plus className="h-4 w-4" />
            {tasksData.addButton}
          </Button>
        </Link>
      </div>

      {!project.tasks || project.tasks.length === 0 ? (
        <EmptyState
          title={tasksData.emptyTitle}
          description={projectsData.detail.noTasks}
        />
      ) : (
        <PaginatedTable items={project.tasks}>
          {(pageTasks) => (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>{tasksData.table.name}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.assignee}</TableHeaderCell>
              <TableHeaderCell>{projectsData.detail.taskTable.details}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.complexity}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.priority}</TableHeaderCell>
              <TableHeaderCell>{tasksData.table.startTime}</TableHeaderCell>
              <TableHeaderCell>{projectsData.detail.taskTable.deadline}</TableHeaderCell>
              <TableHeaderCell>{projectsData.detail.taskTable.estimated}</TableHeaderCell>
              <TableHeaderCell>{projectsData.detail.taskTable.actual}</TableHeaderCell>
              <TableHeaderCell>{projectsData.detail.taskTable.variance}</TableHeaderCell>
              <TableHeaderCell>
                <span>{projectsData.detail.taskTable.status}</span>
                <span className="mt-0.5 block text-[10px] font-normal normal-case text-text-muted">
                  {projectsData.detail.taskTable.statusHint}
                </span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageTasks.map((task) => (
              <TableRow key={task.id} className={getTaskRowClass(task)}>
                <TableCell className="font-medium">
                  <div>{task.name}</div>
                  <TaskAlertBadges task={task} />
                </TableCell>
                <TableCell>{task.assigned_to_name || "—"}</TableCell>
                <TableCell
                  className="max-w-[200px] truncate"
                  title={task.details || undefined}
                >
                  {task.details || "—"}
                </TableCell>
                <TableCell>{formatLabel(task.complexity)}</TableCell>
                <TableCell>{formatLabel(task.priority)}</TableCell>
                <TableCell>{formatDateTime(task.start_time)}</TableCell>
                <TableCell>{formatDateTime(task.deadline)}</TableCell>
                <TableCell>{formatHours(task.estimated_hours)}</TableCell>
                <TableCell>{formatHours(task.actual_hours)}</TableCell>
                <TableCell>
                  {task.variance !== null && task.variance !== undefined
                    ? formatHours(task.variance)
                    : "—"}
                </TableCell>
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
        </PaginatedTable>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={projectsData.form.editTitle}
        size="lg"
      >
        <ProjectForm
          project={project}
          developers={developers}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={commonData.delete.projectTitle}
        message={commonData.delete.projectMessage(
          project.name,
          project.total_tasks
        )}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
