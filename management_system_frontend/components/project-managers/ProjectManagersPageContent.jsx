"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { projectManagersData } from "@/data/projectManagers";
import { projectManagersApi } from "@/lib/projectManagers";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";
import { Card } from "@/components/ui/Card";
import { ActionIconButton } from "@/components/ui/TableActionButtons";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProjectManagerForm } from "./ProjectManagerForm";
import { commonData } from "@/data/common";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function ProjectManagersPageContent() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await projectManagersApi.getAll();
      setManagers(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load project managers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const visible = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return managers;
    return managers.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [managers, debouncedSearch]);

  const handleSubmit = async (data) => {
    if (editing) {
      await projectManagersApi.update(editing.id, data);
    } else {
      await projectManagersApi.create(data);
    }
    setModalOpen(false);
    setEditing(null);
    await fetchManagers();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleteLoading(true);
    try {
      await projectManagersApi.delete(toDelete.id);
      setToDelete(null);
      await fetchManagers();
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-page">{projectManagersData.pageTitle}</h1>
          <p className="text-subtitle">{projectManagersData.subtitle}</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          {projectManagersData.addButton}
        </Button>
      </div>

      <div className="mb-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={projectManagersData.searchPlaceholder}
          hasActiveFilters={Boolean(search)}
          onClear={() => setSearch("")}
          filters={[]}
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : visible.length === 0 ? (
        <EmptyState
          title={projectManagersData.emptyTitle}
          description={projectManagersData.emptyDescription}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((manager) => (
            <Card
              key={manager.id}
              className="flex h-full min-h-[160px] flex-col border border-primary/15 bg-surface"
            >
              <div className="mb-4 border-b border-border-light pb-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-tagline font-semibold text-text-primary">
                    {manager.full_name}
                  </h3>
                  {manager.has_login ? (
                    <span className="shrink-0 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      {projectManagersData.card.loginEnabled}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-caption text-text-muted">{manager.email}</p>
              </div>
              <div className="mt-auto flex items-center justify-end gap-2">
                <ActionIconButton
                  type="edit"
                  label={commonData.actions.edit}
                  onClick={() => {
                    setEditing(manager);
                    setModalOpen(true);
                  }}
                  boxed
                />
                <ActionIconButton
                  type="delete"
                  label={commonData.actions.delete}
                  onClick={() => setToDelete(manager)}
                  boxed
                />
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editing
            ? projectManagersData.form.editTitle
            : projectManagersData.form.title
        }
      >
        <ProjectManagerForm
          manager={editing}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete project manager?"
        message={
          toDelete
            ? `Delete ${toDelete.full_name}? They will lose project ownership (set to none).`
            : ""
        }
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
