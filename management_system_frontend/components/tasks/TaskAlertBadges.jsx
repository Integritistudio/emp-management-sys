"use client";

import { Badge } from "@/components/ui/Badge";
import { tasksData } from "@/data/tasks";
import { ALERT_LEGEND, getTaskAlerts } from "@/lib/taskAlerts";

export function TaskAlertBadges({ task, className = "mt-1 flex flex-wrap gap-1" }) {
  const alerts = getTaskAlerts(task);
  if (!alerts.length) return null;

  return (
    <div className={className}>
      {alerts.map((alert) => (
        <Badge key={alert.key} variant={alert.variant}>
          {tasksData.alerts[alert.key] || alert.label}
        </Badge>
      ))}
    </div>
  );
}

export function TaskAlertsLegend({ className = "" }) {
  const items = ALERT_LEGEND;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-border-light bg-surface px-3 py-2 text-xs text-text-secondary ${className}`}
      role="note"
      aria-label="Task alert legend"
    >
      <span className="font-medium text-text-primary">
        {tasksData.alertLegendTitle}:
      </span>
      {items.map((item) => (
        <span
          key={item.key}
          className={`rounded-md border px-2 py-0.5 font-medium ${item.swatch}`}
        >
          {tasksData.alerts[item.key]}
        </span>
      ))}
    </div>
  );
}
