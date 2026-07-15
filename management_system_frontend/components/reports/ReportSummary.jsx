"use client";

import { reportsData } from "@/data/reports";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import {
  formatHours,
  formatLabel,
  formatPercent,
  getStatusVariant,
} from "@/lib/formatters";

export function ReportSummary({
  summary,
  loading,
  type = "team",
  selectedMode = null,
  selectedName = "",
  entityMeta = null,
}) {
  if (loading) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const isDeveloper = selectedMode === "developer";
  const isProject = selectedMode === "project";
  const isSelected = isDeveloper || isProject;

  const teamOverviewItems = [
    { label: reportsData.summary.totalTasks, value: summary.total_tasks },
    { label: reportsData.summary.active, value: summary.active_tasks },
    {
      label: reportsData.summary.teamOutput,
      value: summary.team_output ?? summary.completed_tasks,
    },
    { label: reportsData.summary.onHold, value: summary.on_hold_tasks },
    {
      label: reportsData.summary.timeLogged,
      value: formatHours(summary.total_time_logged ?? summary.total_actual),
    },
    { label: reportsData.summary.estimated, value: formatHours(summary.total_estimated) },
    { label: reportsData.summary.actual, value: formatHours(summary.total_actual) },
    { label: reportsData.summary.variance, value: formatHours(summary.variance) },
    {
      label: reportsData.summary.efficiency,
      value: formatPercent(summary.efficiency_rate),
    },
    {
      label: reportsData.summary.matrixRating,
      value: summary.matrix_rating
        ? formatLabel(String(summary.matrix_rating).replace(/_/g, " "))
        : "—",
    },
  ];

  const projectOverviewItems = [
    { label: reportsData.summary.totalProjects, value: summary.total_projects },
    { label: reportsData.summary.activeProjects, value: summary.active_projects },
    {
      label: reportsData.summary.completedProjects,
      value: summary.completed_projects,
    },
    {
      label: reportsData.summary.onHoldProjects,
      value: summary.on_hold_projects,
    },
    { label: reportsData.summary.totalTasks, value: summary.total_tasks },
    { label: reportsData.summary.completed, value: summary.completed_tasks },
    { label: reportsData.summary.active, value: summary.active_tasks },
    { label: reportsData.summary.estimated, value: formatHours(summary.total_estimated) },
    { label: reportsData.summary.actual, value: formatHours(summary.total_actual) },
    { label: reportsData.summary.variance, value: formatHours(summary.variance) },
    {
      label: reportsData.summary.efficiency,
      value: formatPercent(summary.efficiency_rate),
    },
  ];

  // Single developer — no team-wide project counts
  const developerItems = [
    { label: reportsData.summary.totalTasks, value: summary.total_tasks },
    { label: reportsData.summary.completed, value: summary.completed_tasks },
    { label: reportsData.summary.active, value: summary.active_tasks },
    { label: reportsData.summary.onHold, value: summary.on_hold_tasks },
    {
      label: reportsData.summary.timeLogged,
      value: formatHours(summary.total_time_logged ?? summary.total_actual),
    },
    { label: reportsData.summary.estimated, value: formatHours(summary.total_estimated) },
    { label: reportsData.summary.actual, value: formatHours(summary.total_actual) },
    { label: reportsData.summary.variance, value: formatHours(summary.variance) },
    {
      label: reportsData.summary.efficiency,
      value: formatPercent(summary.efficiency_rate),
    },
    {
      label: reportsData.summary.developerMatrix,
      value:
        entityMeta?.matrix_rating ||
        summary.matrix_rating ||
        "—",
    },
  ];

  // Single project — hide "Total Projects: 1"
  const projectDetailItems = [
    ...(entityMeta?.lead
      ? [{ label: reportsData.summary.lead, value: entityMeta.lead }]
      : []),
    ...(entityMeta?.status
      ? [
          {
            label: reportsData.summary.status,
            value: (
              <Badge variant={getStatusVariant(entityMeta.status)}>
                {formatLabel(entityMeta.status)}
              </Badge>
            ),
          },
        ]
      : []),
    ...(entityMeta?.quality
      ? [
          {
            label: reportsData.summary.quality,
            value: formatLabel(entityMeta.quality),
          },
        ]
      : []),
    { label: reportsData.summary.totalTasks, value: summary.total_tasks },
    { label: reportsData.summary.completed, value: summary.completed_tasks },
    { label: reportsData.summary.active, value: summary.active_tasks },
    { label: reportsData.summary.onHold, value: summary.on_hold_tasks },
    { label: reportsData.summary.estimated, value: formatHours(summary.total_estimated) },
    { label: reportsData.summary.actual, value: formatHours(summary.total_actual) },
    { label: reportsData.summary.variance, value: formatHours(summary.variance) },
    {
      label: reportsData.summary.efficiency,
      value: formatPercent(summary.efficiency_rate),
    },
  ];

  let title = reportsData.summary.title;
  let hint = null;
  let items = type === "project" ? projectOverviewItems : teamOverviewItems;

  if (isDeveloper && selectedName) {
    title = reportsData.summary.developerSummaryTitle(selectedName);
    hint = reportsData.summary.developerSummaryHint;
    items = developerItems;
  } else if (isProject && selectedName) {
    title = reportsData.summary.projectSummaryTitle(selectedName);
    hint = reportsData.summary.projectSummaryHint;
    items = projectDetailItems;
  }

  return (
    <div className="mb-6">
      <div className="mb-4">
        <h2 className="text-tagline font-semibold text-text-primary">{title}</h2>
        {hint ? <p className="mt-1 text-sm text-text-muted">{hint}</p> : null}
        {isDeveloper && entityMeta?.title ? (
          <p className="mt-1 text-sm text-text-secondary">{entityMeta.title}</p>
        ) : null}
      </div>
      <div
        className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${
          isSelected ? "xl:grid-cols-4" : "xl:grid-cols-5"
        }`}
      >
        {items.map((item) => (
          <Card key={item.label} className="!p-4">
            <p className="metric-label">{item.label}</p>
            <div className="mt-1 break-words text-[20px] font-semibold leading-tight text-text-primary">
              {item.value ?? "—"}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
