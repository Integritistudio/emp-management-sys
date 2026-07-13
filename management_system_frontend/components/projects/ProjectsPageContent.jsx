"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import {
  projectsData,
  PROJECT_QUALITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from "@/data/projects";
import { useProjects } from "@/hooks/useProjects";
import { useTeam } from "@/hooks/useTeam";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getNextSort } from "@/lib/sort";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import { ProjectsTable } from "./ProjectsTable";
import { ProjectForm } from "./ProjectForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { commonData } from "@/data/common";

export function ProjectsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [quality, setQuality] = useState(searchParams.get("quality") || "");
  const [leadDeveloperId, setLeadDeveloperId] = useState(
    searchParams.get("leadDeveloperId") || ""
  );
  const [startDate, setStartDate] = useState(searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("endDate") || "");
  const debouncedSearch = useDebouncedValue(search);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { members: developers } = useTeam();

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status || undefined,
      quality: quality || undefined,
      leadDeveloperId: leadDeveloperId || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sort: searchParams.get("sort") || undefined,
    }),
    [debouncedSearch, status, quality, leadDeveloperId, startDate, endDate, searchParams]
  );

  const { projects, loading, error, createProject, updateProject, deleteProject } =
    useProjects(params);

  const syncUrl = useCallback(() => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (status) query.set("status", status);
    if (quality) query.set("quality", quality);
    if (leadDeveloperId) query.set("leadDeveloperId", leadDeveloperId);
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);
    const sort = searchParams.get("sort");
    if (sort) query.set("sort", sort);
    const qs = query.toString();
    router.replace(qs ? `/projects?${qs}` : "/projects");
  }, [
    debouncedSearch,
    status,
    quality,
    leadDeveloperId,
    startDate,
    endDate,
    router,
    searchParams,
  ]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const hasActiveFilters = Boolean(
    search || status || quality || leadDeveloperId || startDate || endDate
  );

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setQuality("");
    setLeadDeveloperId("");
    setStartDate("");
    setEndDate("");
  };

  const developerOptions = developers.map((dev) => ({
    value: dev.id,
    label: dev.full_name,
  }));

  const openCreate = () => {
    setEditingProject(null);
    setModalOpen(true);
  };

  const openEdit = (project) => {
    setEditingProject(project);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingProject) {
      await updateProject(editingProject.id, data);
    } else {
      await createProject(data);
    }
    setModalOpen(false);
    setEditingProject(null);
  };

  const handleDelete = (project) => {
    setProjectToDelete(project);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  const currentSort = searchParams.get("sort") || "";

  const handleSort = (column) => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (status) query.set("status", status);
    if (quality) query.set("quality", quality);
    if (leadDeveloperId) query.set("leadDeveloperId", leadDeveloperId);
    if (startDate) query.set("startDate", startDate);
    if (endDate) query.set("endDate", endDate);
    const nextSort = getNextSort(currentSort, column);
    if (nextSort) query.set("sort", nextSort);
    const qs = query.toString();
    router.replace(qs ? `/projects?${qs}` : "/projects");
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-page">{projectsData.pageTitle}</h1>
          <p className="text-subtitle">{projectsData.subtitle}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {projectsData.addButton}
        </Button>
      </div>

      <div className="mb-6">
        <FilterBar
          filtersLayout="twoRow"
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={projectsData.searchPlaceholder}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          filters={[
            {
              key: "status",
              label: projectsData.filters.status,
              value: status,
              onChange: setStatus,
              options: PROJECT_STATUS_OPTIONS,
            },
            {
              key: "quality",
              label: projectsData.filters.quality,
              value: quality,
              onChange: setQuality,
              options: PROJECT_QUALITY_OPTIONS,
            },
            {
              key: "leadDeveloperId",
              label: projectsData.filters.lead,
              value: leadDeveloperId,
              onChange: setLeadDeveloperId,
              options: developerOptions,
            },
          ]}
          dateRange={{
            startLabel: projectsData.filters.startDate,
            endLabel: projectsData.filters.endDate,
            startDate,
            endDate,
            onStartChange: setStartDate,
            onEndChange: setEndDate,
          }}
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <TableSkeleton rows={6} cols={11} />
      ) : projects.length === 0 ? (
        <EmptyState
          title={projectsData.emptyTitle}
          description={projectsData.emptyDescription}
        />
      ) : (
        <ProjectsTable
          projects={projects}
          onEdit={openEdit}
          onDelete={handleDelete}
          sort={currentSort}
          onSort={handleSort}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? projectsData.form.editTitle : projectsData.form.title}
        size="lg"
      >
        <ProjectForm
          project={editingProject}
          developers={developers}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(projectToDelete)}
        title={commonData.delete.projectTitle}
        message={
          projectToDelete
            ? commonData.delete.projectMessage(
                projectToDelete.name,
                projectToDelete.total_tasks
              )
            : ""
        }
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
