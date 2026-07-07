"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { teamData, TEAM_EFFICIENCY_FILTER_OPTIONS } from "@/data/team";
import { useTeam } from "@/hooks/useTeam";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { filterTeamMembers } from "@/lib/teamFilters";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { FilterBar } from "@/components/ui/FilterBar";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardGridSkeleton } from "@/components/ui/TableSkeleton";
import { TeamMemberCard } from "./TeamMemberCard";
import { TeamMemberForm } from "./TeamMemberForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { commonData } from "@/data/common";

export function TeamPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [titleFilter, setTitleFilter] = useState(searchParams.get("title") || "");
  const [efficiencyFilter, setEfficiencyFilter] = useState(
    searchParams.get("efficiencyRange") || ""
  );
  const debouncedSearch = useDebouncedValue(search, 400);
  const sortParam = searchParams.get("sort") || undefined;
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { members, titleOptions, loading, error, createMember, updateMember, deleteMember } =
    useTeam({ sort: sortParam });

  const visibleMembers = useMemo(
    () =>
      filterTeamMembers(members, {
        search: debouncedSearch,
        title: titleFilter,
        efficiencyRange: efficiencyFilter,
      }),
    [members, debouncedSearch, titleFilter, efficiencyFilter]
  );

  const syncUrl = useCallback(() => {
    const query = new URLSearchParams();
    if (debouncedSearch) query.set("search", debouncedSearch);
    if (titleFilter) query.set("title", titleFilter);
    if (efficiencyFilter) query.set("efficiencyRange", efficiencyFilter);
    if (sortParam) query.set("sort", sortParam);
    const qs = query.toString();
    router.replace(qs ? `/team?${qs}` : "/team");
  }, [debouncedSearch, titleFilter, efficiencyFilter, sortParam, router]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const hasActiveFilters = Boolean(search || titleFilter || efficiencyFilter);

  const clearFilters = () => {
    setSearch("");
    setTitleFilter("");
    setEfficiencyFilter("");
  };

  const openCreate = () => {
    setEditingMember(null);
    setModalOpen(true);
  };

  const openEdit = (member) => {
    setEditingMember(member);
    setModalOpen(true);
  };

  const handleSubmit = async (data) => {
    if (editingMember) {
      await updateMember(editingMember.id, data);
    } else {
      await createMember(data);
    }
    setModalOpen(false);
    setEditingMember(null);
  };

  const handleDelete = (member) => {
    setMemberToDelete(member);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteMember(memberToDelete.id);
      setMemberToDelete(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="heading-page">{teamData.pageTitle}</h1>
          <p className="text-subtitle">{teamData.subtitle}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          {teamData.addButton}
        </Button>
      </div>

      <div className="mb-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder={teamData.searchPlaceholder}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
          filters={[
            {
              key: "title",
              label: teamData.filters.title,
              value: titleFilter,
              onChange: setTitleFilter,
              placeholder: teamData.filters.titlePlaceholder,
              options: titleOptions.map((title) => ({
                value: title,
                label: title,
              })),
            },
            {
              key: "efficiencyRange",
              label: teamData.filters.efficiency,
              value: efficiencyFilter,
              onChange: setEfficiencyFilter,
              placeholder: teamData.filters.efficiencyPlaceholder,
              options: TEAM_EFFICIENCY_FILTER_OPTIONS,
            },
          ]}
        />
      </div>

      {error ? (
        <div className="mb-4 rounded-button border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <CardGridSkeleton count={6} />
      ) : visibleMembers.length === 0 ? (
        <EmptyState
          title={teamData.emptyTitle}
          description={teamData.emptyDescription}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleMembers.map((member) => (
            <TeamMemberCard
              key={member.id}
              member={member}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? teamData.form.editTitle : teamData.form.title}
      >
        <TeamMemberForm
          member={editingMember}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(memberToDelete)}
        title={commonData.delete.teamTitle}
        message={
          memberToDelete
            ? commonData.delete.teamMessage(memberToDelete.full_name)
            : ""
        }
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onCancel={() => setMemberToDelete(null)}
      />
    </div>
  );
}
