"use client";

import { Pencil, Trash2 } from "lucide-react";
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
import { Button } from "@/components/ui/Button";
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
          <TableHeaderCell>{tasksData.table.assignee}</TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.deadline}
              column="deadline"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{tasksData.table.estimated}</TableHeaderCell>
          <TableHeaderCell>{tasksData.table.actual}</TableHeaderCell>
          <TableHeaderCell>
            <SortableHeader
              label={tasksData.table.status}
              column="status"
              currentSort={sort}
              onSort={onSort}
            />
          </TableHeaderCell>
          <TableHeaderCell>{tasksData.table.actions}</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {tasks.map((task) => {
          const alerts = getTaskAlerts(task);
          return (
            <TableRow key={task.id} className={getTaskRowClass(task)}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(task.id)}
                  onChange={() => onToggleSelect(task.id)}
                  className="rounded border-border"
                  aria-label={`Select ${task.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="font-medium text-text-primary">{task.name}</div>
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
              <TableCell>{task.project_name || "—"}</TableCell>
              <TableCell>{task.assigned_to_name || "—"}</TableCell>
              <TableCell>{formatDateTime(task.deadline)}</TableCell>
              <TableCell>{formatHours(task.estimated_hours)}</TableCell>
              <TableCell>{formatHours(task.actual_hours)}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(task.status)}>
                  {formatLabel(task.status)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <TaskTimerActions
                    task={task}
                    onPause={onPause}
                    onResume={onResume}
                    onComplete={onComplete}
                    loading={actionLoading}
                  />
                  <Button
                    variant="ghost"
                    className="px-2 py-1.5"
                    onClick={() => onEdit(task)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1.5"
                    onClick={() => onDelete(task)}
                  >
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
