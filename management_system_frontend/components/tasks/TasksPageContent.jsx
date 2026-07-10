"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  tasksData,
  TASK_COMPLEXITY_OPTIONS,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/data/tasks";
import { useTasks } from "@/hooks/useTasks";
import { useProjects } from "@/hooks/useProjects";
import { useTeam } from "@/hooks/useTeam";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getNextSort } from "@/lib/sort";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { TasksTable } from "./TasksTable";
import { TaskForm } from "./TaskForm";
import { BulkActionsBar } from "./BulkActionsBar";
import { CompletionModal } from "./CompletionModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { commonData } from "@/data/common";

export function TasksPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const { projects } = useProjects();
  const { members: developers } = useTeam();

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      projectId: projectId || undefined,
      developerId: developerId || undefined,
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
    if (developerId) query.set("developerId", developerId);
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
  ]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const hasActiveFilters = Boolean(
    search || projectId || developerId || status || complexity || priority || startDate || endDate
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
    if (developerId) query.set("developerId", developerId);
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

  const developerOptions = developers.map((dev) => ({
    value: dev.id,
    label: dev.full_name,
  }));

  const openCreate = () => {
    setEditingTask(null);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
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
        await bulkUpdate({
          taskIds: selectedIds,
          action: "complete",
          confirm: true,
        });
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

  const toggleSelectAll = () => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map((t) => t.id));
    }
  };

  const handleBulkApply = async () => {
    if (!bulkAction) return;
    setActionLoading(true);
    try {
      const response = await bulkUpdate({
        taskIds: selectedIds,
        action: bulkAction,
        value: bulkValue || undefined,
        confirm: bulkAction === "complete" ? false : undefined,
      });

      if (response.requiresConfirmation) {
        setCompletionTask({ name: `${selectedIds.length} tasks` });
        setCompletionElapsed(null);
        setCompletionMode("bulk");
        setCompletionOpen(true);
        return;
      }

      setSelectedIds([]);
      setBulkAction("");
      setBulkValue("");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-page">{tasksData.pageTitle}</h1>
          <p className="text-subtitle">{tasksData.subtitle}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {tasksData.addButton}
        </Button>
      </div>

      <div className="mb-6">
        <FilterBar
          filtersLayout="twoRow"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={tasksData.searchPlaceholder}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          filters={[
            {
              key: "projectId",
              label: tasksData.filters.project,
              value: projectId,
              onChange: setProjectId,
              options: projectOptions,
            },
            {
              key: "developerId",
              label: tasksData.filters.developer,
              value: developerId,
              onChange: setDeveloperId,
              options: developerOptions,
            },
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
          ]}
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

      {error ? (
        <div className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <TableSkeleton rows={6} cols={9} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title={tasksData.emptyTitle}
          description={tasksData.emptyDescription}
        />
      ) : (
        <TasksTable
          tasks={tasks}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? tasksData.form.editTitle : tasksData.form.title}
        size="xl"
      >
        <TaskForm
          task={editingTask}
          projects={projects}
          developers={developers}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <CompletionModal
        open={completionOpen}
        task={completionTask}
        elapsedHours={completionElapsed}
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
