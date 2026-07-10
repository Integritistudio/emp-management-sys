"use client";

import { useRouter } from "next/navigation";
import { teamData } from "@/data/team";
import { commonData } from "@/data/common";
import { Card } from "@/components/ui/Card";
import { ActionIconButton } from "@/components/ui/TableActionButtons";
import { formatHours, formatPercent, formatLabel } from "@/lib/formatters";

export function TeamMemberCard({ member, onEdit, onDelete }) {
  const router = useRouter();

  return (
    <Card
      className="flex h-full min-h-[280px] cursor-pointer flex-col border border-primary/15 bg-surface transition-colors hover:border-primary/30"
      onClick={() => router.push(`/team/${member.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/team/${member.id}`);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="mb-4 border-b border-border-light pb-3">
        <h3 className="text-tagline font-semibold text-text-primary">{member.full_name}</h3>
        <p className="text-caption text-text-secondary">{member.title}</p>
        <p className="mt-1 text-caption text-text-muted">{member.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-caption">
        <div className="rounded-md bg-parchment px-3 py-2">
          <p className="text-caption text-text-muted">{teamData.card.tasksAssigned}</p>
          <p className="font-semibold text-text-primary">{member.total_tasks_assigned}</p>
        </div>
        <div className="rounded-md bg-parchment px-3 py-2">
          <p className="text-caption text-text-muted">{teamData.card.timeLogged}</p>
          <p className="font-semibold text-text-primary">
            {formatHours(member.total_time_logged)}
          </p>
        </div>
        <div className="rounded-md bg-parchment px-3 py-2">
          <p className="text-caption text-text-muted">{teamData.card.efficiency}</p>
          <p className="font-semibold text-text-primary">
            {formatPercent(member.efficiency_rate)}
          </p>
        </div>
        <div className="rounded-md bg-parchment px-3 py-2">
          <p className="text-caption text-text-muted">{teamData.card.matrixRating}</p>
          <p className="font-semibold text-primary">
            {formatLabel(member.output_level)} / {formatLabel(member.quality_level)}
          </p>
        </div>
      </div>

      <div
        className="mt-auto flex items-center justify-end gap-2 pt-5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <ActionIconButton
          type="view"
          label={commonData.actions.view}
          href={`/team/${member.id}`}
          boxed
        />
        <ActionIconButton
          type="edit"
          label={commonData.actions.edit}
          onClick={() => onEdit(member)}
          boxed
        />
        <ActionIconButton
          type="delete"
          label={commonData.actions.delete}
          onClick={() => onDelete(member)}
          boxed
        />
      </div>
    </Card>
  );
}
