"use client";

import Link from "next/link";
import { tasksData } from "@/data/tasks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { TableActionButtons } from "@/components/ui/TableActionButtons";
import { SortableHeader } from "@/components/ui/SortableHeader";
import {
  formatDateTime,
  formatHours,
  formatLabel,
  getStatusVariant,
} from "@/lib/formatters";
import { getTaskAlerts, getTaskRowClass } from "@/lib/taskAlerts";
import { TaskTimerActions } from "./TaskTimerActions";

export function TasksTable({
  tasks,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
  onPause,
  onResume,
  onComplete,
  actionLoading,
  sort,
  onSort,
}) {
  const allSelected = tasks.length > 0 && selectedIds.length === tasks.length;

  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell className="w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="rounded border-border"
              aria-label="Select all tasks"
            />
          </TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.name}
              column="name"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{tasksData.table.project}</TableHeaderCell>
          <TableHeaderCell>{tasksData.table.details}</TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.complexity}
              column="complexity"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.priority}
              column="priority"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{tasksData.table.assignee}</TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.startTime}
              column="start_time"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{tasksData.table.estimated}</TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.deadline}
              column="deadline"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{tasksData.table.actual}</TableHeaderCell>
          <TableHeaderCell>{tasksData.table.variance}</TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.status}
              column="status"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell className="sticky right-0 bg-surface">
            {tasksData.table.actions}
          </TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tasks.map((task) => {
          const alerts = getTaskAlerts(task);
          return (
            <TableRow
              key={task.id}
              className={getTaskRowClass(task)}
              clickable
              onClick={() => onEdit(task)}
            >
              <TableCell
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task.id)}
                  onChange={() => onToggleSelect(task.id)}
                  className="rounded border-border"
                  aria-label={`Select ${task.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="min-w-[140px] font-medium text-text-primary">
                  {task.name}
                </div>
                {alerts.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {alerts.map((alert) => (
                      <Badge key={alert.key} variant={alert.variant}>
                        {tasksData.alerts[alert.key] || alert.label}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                {task.project_id && task.project_name ? (
                  <Link
                    href={`/projects/${task.project_id}`}
                    className="text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {task.project_name}
                  </Link>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell
                className="max-w-[180px] truncate"
                title={task.details || undefined}
              >
                {task.details || "—"}
              </TableCell>
              <TableCell>{formatLabel(task.complexity)}</TableCell>
              <TableCell>{formatLabel(task.priority)}</TableCell>
              <TableCell>{task.assigned_to_name || "—"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(task.start_time)}
              </TableCell>
              <TableCell>{formatHours(task.estimated_hours)}</TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(task.deadline)}
              </TableCell>
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
              <TableCell
                className="sticky right-0 bg-surface"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-1">
                  <TaskTimerActions
                    task={task}
                    onPause={onPause}
                    onResume={onResume}
                    onComplete={onComplete}
                    loading={actionLoading}
                  />
                  <TableActionButtons
                    showView={false}
                    onEdit={() => onEdit(task)}
                    onDelete={() => onDelete(task)}
                  />
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
