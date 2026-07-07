"use client";

import { reportsData } from "@/data/reports";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatHours, formatPercent } from "@/lib/formatters";

export function ReportSummary({ summary, loading }) {
  if (loading) {
    return (
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-card" />
        ))}
      </div>
    );
  }

  if (!summary) return null;

  const items = [
    { label: reportsData.summary.totalTasks, value: summary.total_tasks },
    { label: reportsData.summary.completed, value: summary.completed_tasks },
    { label: reportsData.summary.active, value: summary.active_tasks },
    { label: reportsData.summary.onHold, value: summary.on_hold_tasks },
    { label: reportsData.summary.timeLogged, value: formatHours(summary.total_time_logged || summary.total_actual) },
    { label: reportsData.summary.estimated, value: formatHours(summary.total_estimated) },
    { label: reportsData.summary.actual, value: formatHours(summary.total_actual) },
    { label: reportsData.summary.variance, value: formatHours(summary.variance) },
    {
      label: reportsData.summary.efficiency,
      value: formatPercent(summary.efficiency_rate),
    },
  ];

  return (
    <div className="mb-6">
      <h2 className="mb-4 text-tagline font-semibold text-text-primary">
        {reportsData.summary.title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <Card key={item.label} className="!p-4">
            <p className="metric-label">{item.label}</p>
            <p className="mt-1 text-[21px] font-semibold leading-tight text-text-primary">
              {item.value ?? "—"}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
