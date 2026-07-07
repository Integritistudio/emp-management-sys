"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { teamData } from "@/data/team";
import { formatHours, formatPercent, formatLabel } from "@/lib/formatters";

export function TeamMemberCard({ member, onEdit, onDelete }) {
  return (
    <Card className="flex h-full min-h-[280px] flex-col border border-primary/15 bg-surface">
      <div className="mb-4 border-b border-border-light pb-3">
        <div>
          <h3 className="text-tagline font-semibold text-text-primary">{member.full_name}</h3>
          <p className="text-caption text-text-secondary">{member.title}</p>
          <p className="mt-1 text-caption text-text-muted">{member.email}</p>
        </div>
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

      <div className="mt-auto flex gap-2 pt-5">
        <Button variant="secondary" className="flex-1" onClick={() => onEdit(member)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button variant="ghost" onClick={() => onDelete(member)}>
          <Trash2 className="h-4 w-4 text-danger" />
        </Button>
      </div>
    </Card>
  );
}
