"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { teamData } from "@/data/team";
import { useTeamMember } from "@/hooks/useTeam";
import { useAuthContext } from "@/hooks/useAuth";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { TeamMemberForm } from "./TeamMemberForm";
import { ActionIconButton } from "@/components/ui/TableActionButtons";
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

export function TeamMemberDetailContent({ memberId }) {
  const router = useRouter();
  const { isAdmin } = useAuthContext();
  const { member, loading, error, updateMember, deleteMember } = useTeamMember(memberId);
  const [modalOpen, setModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  if (error || !member) {
    return (
      <div className="rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
        {error || "Team member not found"}
      </div>
    );
  }

  const stats = [
    { label: teamData.card.tasksAssigned, value: member.total_tasks_assigned },
    { label: teamData.card.timeLogged, value: formatHours(member.total_time_logged) },
    { label: teamData.card.efficiency, value: formatPercent(member.efficiency_rate) },
    {
      label: teamData.card.matrixRating,
      value: `${formatLabel(member.output_level)} / ${formatLabel(member.quality_level)}`,
    },
  ];

  const handleSubmit = async (data) => {
    await updateMember(data);
    setModalOpen(false);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteMember();
      router.push("/team");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link href="/team">
          <Button variant="ghost" className="mb-4 px-0">
            <ArrowLeft className="h-4 w-4" />
            {teamData.detailBack}
          </Button>
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="heading-page">{member.full_name}</h1>
            <p className="mt-1 text-subtitle">{member.title}</p>
            <p className="mt-1 text-sm text-text-muted">{member.email}</p>
          </div>
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <ActionIconButton
                type="edit"
                label={commonData.actions.edit}
                onClick={() => setModalOpen(true)}
                boxed
              />
              <ActionIconButton
                type="delete"
                label={commonData.actions.delete}
                onClick={() => setShowDeleteConfirm(true)}
                boxed
              />
            </div>
          ) : null}
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {teamData.detail.statsTitle}
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
        {teamData.detail.projectsTitle}
      </h2>
      {!member.projects?.length ? (
        <div className="mb-8">
          <EmptyState title={teamData.detail.noProjects} description="" />
        </div>
      ) : (
        <div className="mb-8">
          <PaginatedTable items={member.projects}>
            {(pageProjects) => (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>{teamData.detail.projectTable.name}</TableHeaderCell>
                    <TableHeaderCell>{teamData.detail.projectTable.role}</TableHeaderCell>
                    <TableHeaderCell>{teamData.detail.projectTable.status}</TableHeaderCell>
                    <TableHeaderCell>{teamData.detail.projectTable.quality}</TableHeaderCell>
                    <TableHeaderCell>{teamData.detail.projectTable.startDate}</TableHeaderCell>
                    <TableHeaderCell>{teamData.detail.projectTable.tasks}</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageProjects.map((project) => (
                    <TableRow
                      key={project.id}
                      clickable
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <TableCell className="font-medium text-primary">{project.name}</TableCell>
                      <TableCell>
                        {teamData.detail.roles[project.role] || formatLabel(project.role)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(project.status)}>
                          {formatLabel(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getQualityVariant(project.quality)}>
                          {formatLabel(project.quality)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(project.start_date)}</TableCell>
                      <TableCell>{project.member_tasks}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </PaginatedTable>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {teamData.detail.tasksTitle}
      </h2>
      {!member.tasks?.length ? (
        <EmptyState title={teamData.detail.noTasks} description="" />
      ) : (
        <PaginatedTable items={member.tasks}>
          {(pageTasks) => (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>{teamData.detail.taskTable.name}</TableHeaderCell>
                  <TableHeaderCell>{teamData.detail.taskTable.project}</TableHeaderCell>
                  <TableHeaderCell>{teamData.detail.taskTable.details}</TableHeaderCell>
                  <TableHeaderCell>{teamData.detail.taskTable.startTime}</TableHeaderCell>
                  <TableHeaderCell>{teamData.detail.taskTable.deadline}</TableHeaderCell>
                  <TableHeaderCell>{teamData.detail.taskTable.estimated}</TableHeaderCell>
                  <TableHeaderCell>{teamData.detail.taskTable.actual}</TableHeaderCell>
                  <TableHeaderCell>{teamData.detail.taskTable.status}</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pageTasks.map((task) => (
                  <TableRow key={task.id} className={getTaskRowClass(task)}>
                    <TableCell className="font-medium">
                      <div>{task.name}</div>
                      <TaskAlertBadges task={task} />
                    </TableCell>
                    <TableCell>{task.project_name || "—"}</TableCell>
                    <TableCell
                      className="max-w-[220px] truncate"
                      title={task.details || undefined}
                    >
                      {task.details || "—"}
                    </TableCell>
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
        </PaginatedTable>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={teamData.form.editTitle}
        size="lg"
      >
        <TeamMemberForm
          member={member}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={showDeleteConfirm}
        title={commonData.delete.teamTitle}
        message={commonData.delete.teamMessage(member.full_name)}
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
