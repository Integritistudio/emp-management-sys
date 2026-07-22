"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, X } from "lucide-react";
import {
  tasksData,
  TASK_COMPLEXITY_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/data/tasks";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeam } from "@/hooks/useTeam";
import { useAuthContext } from "@/hooks/useAuth";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { projectsApi } from "@/lib/projects";
import { getNextSort } from "@/lib/sort";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { PaginatedTable } from "@/components/ui/PaginatedTable";
import { TasksTable } from "./TasksTable";
import { TaskForm } from "./TaskForm";
import { BulkActionsBar } from "./BulkActionsBar";
import { CompletionModal } from "./CompletionModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { commonData } from "@/data/common";

export function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isMember, user } = useAuthContext();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [projectId, setProjectId] = useState(searchParams.get("projectId") || "");
  const [developerId, setDeveloperId] = useState(
    searchParams.get("developerId") || ""
  );
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [complexity, setComplexity] = useState(searchParams.get("complexity") || "");
  const [priority, setPriority] = useState(searchParams.get("priority") || "");
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const debouncedSearch = useDebouncedValue(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [bulkValue, setBulkValue] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionTask, setCompletionTask] = useState(null);
  const [completionElapsed, setCompletionElapsed] = useState(null);
  const [completionMode, setCompletionMode] = useState("single");
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState(null);
  const [projectOptionsList, setProjectOptionsList] = useState([]);

  useEffect(() => {
    if (!bulkResult) return undefined;
    const timer = setTimeout(() => setBulkResult(null), 10000);
    return () => clearTimeout(timer);
  }, [bulkResult]);

  const { projects: adminProjects } = useProjects({}, { enabled: !isMember });
  const { members: developers } = useTeam({}, { enabled: !isMember });

  useEffect(() => {
    if (!isMember) {
      setProjectOptionsList(adminProjects || []);
      return;
    }
    let mounted = true;
    projectsApi
      .getOptions()
      .then((res) => {
        if (mounted) setProjectOptionsList(res.data || []);
      })
      .catch(() => {
        if (mounted) setProjectOptionsList([]);
      });
    return () => {
      mounted = false;
    };
  }, [isMember, adminProjects]);

  const projects = isMember ? projectOptionsList : adminProjects || [];

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      projectId: projectId || undefined,
      developerId: isMember ? undefined : developerId || undefined,
      status: status || undefined,
      complexity: complexity || undefined,
      priority: priority || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sort: searchParams.get("sort") || undefined,
    }),
    [
      debouncedSearch,
      projectId,
      developerId,
      status,
      complexity,
      priority,
      startDate,
      endDate,
      searchParams,
      isMember,
    ]
  );

  const {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    pauseTask,
    resumeTask,
    completeTask,
    bulkUpdate,
  } = useTasks(params);

  const syncUrl = useCallback(() => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (projectId) query.set("projectId", projectId);
    if (!isMember && developerId) query.set("developerId", developerId);
    if (status) query.set("status", status);
    if (complexity) query.set("complexity", complexity);
    if (priority) query.set("priority", priority);
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);
    const sort = searchParams.get("sort");
    if (sort) query.set("sort", sort);
    const qs = query.toString();
    router.replace(qs ? `/tasks?${qs}` : "/tasks");
  }, [
    debouncedSearch,
    projectId,
    developerId,
    status,
    complexity,
    priority,
    startDate,
    endDate,
    router,
    searchParams,
    isMember,
  ]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const hasActiveFilters = Boolean(
    search ||
      projectId ||
      (!isMember && developerId) ||
      status ||
      complexity ||
      priority ||
      startDate ||
      endDate
  );

  const clearFilters = () => {
    setSearch("");
    setProjectId("");
    setDeveloperId("");
    setStatus("");
    setComplexity("");
    setPriority("");
    setStartDate("");
    setEndDate("");
  };

  const currentSort = searchParams.get("sort") || "";

  const handleSort = (column) => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (projectId) query.set("projectId", projectId);
    if (!isMember && developerId) query.set("developerId", developerId);
    if (status) query.set("status", status);
    if (complexity) query.set("complexity", complexity);
    if (priority) query.set("priority", priority);
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);
    const nextSort = getNextSort(currentSort, column);
    if (nextSort) query.set("sort", nextSort);
    const qs = query.toString();
    router.replace(qs ? `/tasks?${qs}` : "/tasks");
  };

  const projectOptions = projects.map((project) => ({
    value: project.id,
    label: project.name,
  }));

  const developerOptions = (developers || []).map((dev) => ({
    value: dev.id,
    label: dev.full_name,
  }));

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!isMember && searchParams.get("create") === "1") {
      setEditingTask(null);
      setModalOpen(true);
    }
  }, [searchParams, isMember]);

  const openEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingTask) {
      const becomingCompleted =
        data.status === "completed" && editingTask.status !== "completed";

      if (becomingCompleted) {
        const { status: _status, actual_hours: actualHours, ...rest } = data;
        const hasManual =
          actualHours !== undefined &&
          actualHours !== null &&
          actualHours !== "";

        await updateTask(editingTask.id, {
          ...rest,
          status: editingTask.status,
        });

        const response = await completeTask(
          editingTask.id,
          hasManual,
          hasManual ? parseFloat(actualHours) : undefined
        );

        if (response.requiresConfirmation) {
          setModalOpen(false);
          setEditingTask(null);
          setCompletionTask(editingTask);
          setCompletionElapsed(response.elapsed_hours);
          setCompletionMode("single");
          setCompletionOpen(true);
          return;
        }
      } else {
        const response = await updateTask(editingTask.id, data);
        if (response?.requiresConfirmation) {
          setModalOpen(false);
          setEditingTask(null);
          setCompletionTask(editingTask);
          setCompletionElapsed(response.elapsed_hours);
          setCompletionMode("single");
          setCompletionOpen(true);
          return;
        }
      }
    } else {
      await createTask(data);
    }
    setModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = (task) => {
    setTaskToDelete(task);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteTask(taskToDelete.id);
      setTaskToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePause = async (task) => {
    setActionLoading(true);
    try {
      await pauseTask(task.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async (task) => {
    setActionLoading(true);
    try {
      await resumeTask(task.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (task) => {
    setActionLoading(true);
    try {
      const response = await completeTask(task.id, false);
      if (response.requiresConfirmation) {
        setCompletionTask(task);
        setCompletionElapsed(response.elapsed_hours);
        setCompletionMode("single");
        setCompletionOpen(true);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const formatBulkResult = (response) => {
    const summary = response.summary || {};
    const parts = [];
    if (summary.updated) {
      parts.push(tasksData.bulk.resultUpdated(summary.updated));
    }
    if (summary.skipped) {
      parts.push(tasksData.bulk.resultSkipped(summary.skipped));
    }
    if (summary.failed) {
      parts.push(tasksData.bulk.resultFailed(summary.failed));
    }
    const skippedDetails = (response.data || [])
      .filter((row) => (row.skipped || (!row.success && row.message)) && row.message)
      .slice(0, 8)
      .map((row) => `${row.name || "Task"}: ${row.message}`);

    const noneUpdated = !summary.updated;
    return {
      message: parts.length
        ? parts.join(" · ")
        : response.message || "Bulk action processed.",
      details: skippedDetails,
      hasSkips: Boolean(summary.skipped || summary.failed || noneUpdated),
    };
  };

  const confirmCompletion = async ({ useManual, actualHours } = {}) => {
    setActionLoading(true);
    try {
      if (completionMode === "single" && completionTask) {
        await completeTask(
          completionTask.id,
          true,
          useManual ? actualHours : undefined
        );
      } else if (completionMode === "bulk") {
        const response = await bulkUpdate({
          taskIds: selectedIds,
          action: "complete",
          confirm: true,
          actual_hours: useManual ? actualHours : undefined,
        });
        setBulkResult(formatBulkResult(response));
        setSelectedIds([]);
        setBulkAction("");
        setBulkValue("");
      }
      setCompletionOpen(false);
      setCompletionTask(null);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkApply = async () => {
    if (!bulkAction) return;
    setActionLoading(true);
    setBulkResult(null);
    try {
      const isBulkComplete =
        bulkAction === "complete" ||
        (bulkAction === "change_status" && bulkValue === "completed");

      const response = await bulkUpdate({
        taskIds: selectedIds,
        action: bulkAction,
        value: bulkValue || undefined,
        confirm: isBulkComplete ? false : undefined,
      });

      if (response.requiresConfirmation) {
        setCompletionTask({ name: `${selectedIds.length} tasks` });
        setCompletionElapsed(null);
        setCompletionMode("bulk");
        setCompletionOpen(true);
        return;
      }

      setBulkResult(formatBulkResult(response));
      setSelectedIds([]);
      setBulkAction("");
      setBulkValue("");
    } finally {
      setActionLoading(false);
    }
  };

  const filterDefs = [
    {
      key: "projectId",
      label: tasksData.filters.project,
      value: projectId,
      onChange: setProjectId,
      options: projectOptions,
    },
    ...(!isMember
      ? [
          {
            key: "developerId",
            label: tasksData.filters.developer,
            value: developerId,
            onChange: setDeveloperId,
            options: developerOptions,
          },
        ]
      : []),
    {
      key: "status",
      label: tasksData.filters.status,
      value: status,
      onChange: setStatus,
      options: TASK_STATUS_OPTIONS,
    },
    {
      key: "complexity",
      label: tasksData.filters.complexity,
      value: complexity,
      onChange: setComplexity,
      options: TASK_COMPLEXITY_OPTIONS,
    },
    {
      key: "priority",
      label: tasksData.filters.priority,
      value: priority,
      onChange: setPriority,
      options: TASK_PRIORITY_OPTIONS,
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-page">{tasksData.pageTitle}</h1>
          <p className="text-subtitle">
            {isMember ? "View your assigned tasks" : tasksData.subtitle}
          </p>
        </div>
        {!isMember ? (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {tasksData.addButton}
          </Button>
        ) : null}
      </div>

      <div className="mb-6">
        <FilterBar
          filtersLayout="twoRow"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={tasksData.searchPlaceholder}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          filters={filterDefs}
          dateRange={{
            startLabel: tasksData.filters.startDate,
            endLabel: tasksData.filters.endDate,
            startDate,
            endDate,
            onStartChange: setStartDate,
            onEndChange: setEndDate,
          }}
        />
      </div>

      {!isMember ? (
        <BulkActionsBar
          selectedCount={selectedIds.length}
          action={bulkAction}
          value={bulkValue}
          developers={developers}
          projects={projects}
          onActionChange={(value) => {
            setBulkAction(value);
            setBulkValue("");
          }}
          onValueChange={setBulkValue}
          onApply={handleBulkApply}
          onClear={() => {
            setSelectedIds([]);
            setBulkAction("");
            setBulkValue("");
          }}
          loading={actionLoading}
        />
      ) : null}

      {bulkResult ? (
        <div
          className={`mb-4 w-full max-w-lg overflow-hidden rounded-md border px-4 py-3 text-sm shadow-sm ${
            bulkResult.hasSkips
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-green-200 bg-green-50 text-green-900"
          }`}
          role="status"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 break-words">
              <p className="font-medium leading-snug">{bulkResult.message}</p>
              {bulkResult.details?.length ? (
                <ul className="mt-2 space-y-1.5 text-xs leading-relaxed opacity-90">
                  {bulkResult.details.map((line) => (
                    <li key={line} className="break-words pl-3 -indent-3">
                      • {line}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setBulkResult(null)}
              className="shrink-0 rounded p-1 opacity-70 transition-opacity hover:bg-black/5 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <TableSkeleton rows={6} cols={14} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title={tasksData.emptyTitle}
          description={tasksData.emptyDescription}
        />
      ) : (
        <PaginatedTable items={tasks}>
          {(pageTasks) => (
            <TasksTable
              tasks={pageTasks}
              selectedIds={selectedIds}
              onToggleSelect={isMember ? undefined : toggleSelect}
              onToggleSelectAll={
                isMember
                  ? undefined
                  : () => {
                      const pageIds = pageTasks.map((t) => t.id);
                      const allSelected =
                        pageIds.length > 0 &&
                        pageIds.every((id) => selectedIds.includes(id));
                      if (allSelected) {
                        setSelectedIds((prev) =>
                          prev.filter((id) => !pageIds.includes(id))
                        );
                      } else {
                        setSelectedIds((prev) => [
                          ...new Set([...prev, ...pageIds]),
                        ]);
                      }
                    }
              }
              hideSelection={isMember}
              hideActions={isMember}
              onEdit={openEdit}
              onDelete={handleDelete}
              onPause={handlePause}
              onResume={handleResume}
              onComplete={handleComplete}
              actionLoading={actionLoading}
              sort={currentSort}
              onSort={handleSort}
            />
          )}
        </PaginatedTable>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? tasksData.form.editTitle : tasksData.form.title}
        size="xl"
      >
        <TaskForm
          task={editingTask}
          projects={projects}
          developers={developers || []}
          defaultProjectId={projectId}
          lockAssignee={isMember}
          assigneeId={user?.memberId || user?.id || ""}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <CompletionModal
        open={completionOpen}
        task={completionTask}
        elapsedHours={completionElapsed}
        mode={completionMode}
        onConfirm={confirmCompletion}
        onCancel={() => {
          setCompletionOpen(false);
          setCompletionTask(null);
        }}
        loading={actionLoading}
      />

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title={commonData.delete.taskTitle}
        message={
          taskToDelete ? commonData.delete.taskMessage(taskToDelete.name) : ""
        }
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </div>
  );
}
